import { loadConfig } from '@ciderpress/config/loader'
import { toError } from 'massaman/conversion'

import { clean } from '../commands/clean.ts'
import { createPaths } from './paths.ts'
import { openBrowser, startDevServer } from './rspress.ts'
import { sync } from './sync/index.ts'
import { createWatcher } from './watcher.ts'

/**
 * Options accepted by the headless dev runner — a strict superset of the
 * TUI flags, minus the React/Ink rendering concerns.
 */
export interface RunDevHeadlessOptions {
  readonly quiet?: boolean
  readonly clean?: boolean
  readonly port?: number
  readonly host?: string
  readonly url?: string
  readonly theme?: string
  readonly colorMode?: 'dark' | 'light'
  readonly vscode?: boolean
}

/**
 * Long-running headless dev runner — the non-TTY counterpart to
 * `DevScreen`. Performs config load, optional clean, initial sync,
 * dev server start, and content watcher attachment, then keeps the
 * process alive until SIGINT/SIGTERM is received.
 *
 * Logs to stdout/stderr only — no Ink, no raw-mode stdin. Safe to run
 * from CI, nodemon, Docker, or any non-interactive parent process.
 *
 * @param options - Same option shape as the `dev` TUI command
 * @returns Resolves on graceful shutdown
 */
export async function runDevHeadless(options: RunDevHeadlessOptions): Promise<void> {
  const log = resolveLogger(options.quiet === true)

  const cwd = process.cwd()
  const paths = createPaths(cwd)

  log('loading config...')
  const [configError, config] = await loadConfig(cwd)
  if (configError) {
    logError(`config error: ${configError.message}`)
    process.exit(1)
  }

  if (options.clean === true) {
    log('cleaning previous output...')
    await clean(paths)
  }

  log('syncing content...')
  const syncResult = await sync(config, { paths, quiet: true })
  if (syncResult.error) {
    logError(`sync error: ${syncResult.error}`)
    process.exit(1)
  }
  log(`sync ok (${syncResult.pagesWritten} written)`)

  log('starting dev server...')
  const server = await startDevServer({
    config,
    paths,
    port: options.port,
    host: options.host,
    url: options.url,
    theme: options.theme,
    colorMode: options.colorMode,
    vscode: options.vscode ?? false,
  })

  log(`ready: ${server.url}`)

  if (config.devServer?.open === true) {
    openBrowser(server.url)
  }

  const watcher = createWatcher({
    paths,
    initialConfig: config,
    callbacks: {
      onStatusChange: (status) => log(`watcher: ${status}`),
      onError: (message) => logError(`watcher error: ${message}`),
      onSyncComplete: (result) => {
        if (result.error) {
          logError(`sync error: ${result.error}`)
        } else {
          log(`sync ok (${result.pagesWritten} written)`)
        }
      },
      onFileChange: (filename) => log(`changed: ${filename}`),
      onConfigReloaded: () => log('config reloaded'),
    },
    onConfigReload: async (newConfig) => {
      try {
        await server.onConfigReload(newConfig)
      } catch (error) {
        logError(`config reload failed: ${toError(error).message}`)
      }
    },
  })

  await waitForShutdown(log, server.close, watcher.close)
}

/**
 * Block on SIGINT/SIGTERM and gracefully shut down the watcher and server.
 *
 * @private
 * @param log - Info logger
 * @param closeServer - Async server close
 * @param closeWatcher - Sync watcher close
 * @returns Resolves once shutdown completes
 */
function waitForShutdown(
  log: (msg: string) => void,
  closeServer: () => Promise<void>,
  closeWatcher: () => void
): Promise<void> {
  return new Promise<void>((resolve) => {
    async function shutdown(signal: NodeJS.Signals): Promise<void> {
      log(`received ${signal} — shutting down...`)
      closeWatcher()
      await closeServer()
      resolve()
    }
    process.once('SIGINT', shutdown)
    process.once('SIGTERM', shutdown)
  })
}

/**
 * Pick the right info-level logger based on the `--quiet` flag.
 *
 * @private
 * @param quiet - True when `--quiet` was passed
 * @returns Either the stdout writer or a no-op
 */
function resolveLogger(quiet: boolean): (msg: string) => void {
  if (quiet) {
    return logSilent
  }
  return logInfo
}

/**
 * Writes an info-level message to stdout with the `[ciderpress]` prefix.
 *
 * @private
 * @param msg - Message body
 */
function logInfo(msg: string): void {
  process.stdout.write(`[ciderpress] ${msg}\n`)
}

/**
 * No-op logger used when `--quiet` is set.
 *
 * @private
 */
function logSilent(): void {
  // intentionally empty
}

/**
 * Writes an error-level message to stderr with the `[ciderpress]` prefix.
 *
 * @private
 * @param msg - Message body
 */
function logError(msg: string): void {
  process.stderr.write(`[ciderpress] ${msg}\n`)
}
