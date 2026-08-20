import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { workspace } from 'vscode'
import type { Disposable, OutputChannel } from 'vscode'

import type { ServerStatus, StatusBar } from './status-bar'

interface DevServerDeps {
  readonly workspaceRoot: string
  readonly statusBar: StatusBar
  readonly outputChannel: OutputChannel
  readonly showErrorMessage: (message: string) => void
  readonly onStatusChange: (status: ServerStatus) => void
  readonly onReady: (baseUrl: string) => void
  readonly onStopped: () => void
}

interface DevServer extends Disposable {
  readonly start: () => void
  readonly stop: () => void
  readonly restart: () => void
  readonly isRunning: () => boolean
  readonly getBaseUrl: () => string | null
}

const MAX_STDOUT_BUFFER = 65_536

function findBinary(
  workspaceRoot: string
): { readonly cmd: string; readonly args: readonly string[] } | null {
  const localBin = path.join(workspaceRoot, 'node_modules', '.bin', 'ciderpress')
  // oxlint-disable-next-line ciderpress/no-dynamic-filesystem-path -- path is constrained to the workspace-local ciderpress binary
  if (fs.existsSync(localBin)) {
    const config = workspace.getConfiguration('ciderpress')
    const baseArgs: string[] = ['dev', '--vscode']
    const port = config.get<number>('server.port')
    if (port !== null && port !== undefined) {
      baseArgs.push('--port', String(port))
    }
    const theme = config.get<string>('theme')
    if (theme) {
      baseArgs.push('--theme', theme)
    }
    const colorMode = config.get<string>('theme.mode')
    if (colorMode) {
      baseArgs.push('--color-mode', colorMode)
    }
    return { cmd: localBin, args: baseArgs }
  }
  return null
}

/**
 * Parses the local URL from Rspress dev server stdout.
 * Matches lines like: `➜  Local:    http://localhost:6174/`
 */
function parseLocalUrl(text: string): string | null {
  const match = /Local:\s+(https?:\/\/[^\s/]+)\/?/.exec(text)
  if (match) {
    return match[1] ?? null
  }
  return null
}

/**
 * Creates a managed dev server that spawns and monitors a `ciderpress dev` child process.
 */
function createDevServer(deps: DevServerDeps): DevServer {
  /*
   * VS Code extension state: mutable process reference is unavoidable
   * when managing an external child process lifecycle.
   */
  const state: {
    process: ChildProcess | null
    status: ServerStatus
    baseUrl: string | null
    stdoutBuffer: string
    restartPending: boolean
  } = {
    process: null,
    status: 'stopped',
    baseUrl: null,
    stdoutBuffer: '',
    restartPending: false,
  }

  function setStatus(status: ServerStatus): void {
    state.status = status
    deps.statusBar.update(status)
    deps.onStatusChange(status)
  }

  function start(): void {
    if (state.status !== 'stopped') {
      return
    }

    const binary = findBinary(deps.workspaceRoot)
    if (!binary) {
      const message =
        'ciderpress binary not found in node_modules. Run `npm install` or `pnpm install` first.'
      deps.outputChannel.appendLine(`[ciderpress] ${message}`)
      deps.outputChannel.show(true)
      deps.showErrorMessage(message)
      return
    }

    setStatus('starting')
    state.baseUrl = null
    state.stdoutBuffer = ''
    deps.outputChannel.appendLine('[ciderpress] Starting dev server...')

    /*
     * Spread readonly args into a mutable array for spawn().
     * Full process.env is passed intentionally — ciderpress dev needs PATH,
     * NODE_PATH, npm/pnpm config vars, proxy settings, etc. to function.
     */
    const child = spawn(binary.cmd, [...binary.args], {
      cwd: deps.workspaceRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '0' },
    })

    /* spawn() returns synchronously — state.process is set before any async events fire */
    state.process = child

    if (child.stdout) {
      child.stdout.on('data', (data: Buffer) => {
        const text = data.toString()
        deps.outputChannel.append(text)

        /* Buffer all stdout until the URL is found — data events may split lines across chunks */
        if (state.status === 'starting' && state.stdoutBuffer.length <= MAX_STDOUT_BUFFER) {
          state.stdoutBuffer += text
          if (state.stdoutBuffer.length > MAX_STDOUT_BUFFER) {
            deps.outputChannel.appendLine(
              '[ciderpress] stdout buffer exceeded 64KB — URL detection stopped'
            )
            return
          }
          const url = parseLocalUrl(state.stdoutBuffer)
          if (url) {
            state.baseUrl = url
            state.stdoutBuffer = ''
            setStatus('running')
            deps.onReady(url)
          }
        }
      })
    }

    if (child.stderr) {
      child.stderr.on('data', (data: Buffer) => {
        deps.outputChannel.append(data.toString())
      })
    }

    child.on('close', (code) => {
      if (state.process !== child) {
        return
      }
      deps.outputChannel.appendLine(`[ciderpress] Dev server exited (code ${String(code)})`)
      state.process = null
      state.baseUrl = null
      state.stdoutBuffer = ''
      setStatus('stopped')
      deps.onStopped()
      if (state.restartPending) {
        state.restartPending = false
        start()
      }
    })

    child.on('error', (err) => {
      if (state.process !== child) {
        return
      }
      deps.outputChannel.appendLine(`[ciderpress] Failed to start: ${err.message}`)
      state.process = null
      state.baseUrl = null
      state.stdoutBuffer = ''
      setStatus('stopped')
      deps.onStopped()
    })
  }

  function stop(): void {
    if (!state.process) {
      return
    }
    deps.outputChannel.appendLine('[ciderpress] Stopping dev server...')
    setStatus('stopping')
    state.process.kill()
    /* Do not null state.process here — the close handler clears it when the child actually exits */
  }

  function restart(): void {
    if (!state.process) {
      start()
      return
    }
    state.restartPending = true
    stop()
  }

  return {
    start,
    stop,
    restart,
    isRunning: () => state.status === 'running',
    getBaseUrl: () => state.baseUrl,
    dispose: (): void => {
      if (state.process) {
        state.process.kill()
        state.process = null
      }
      state.status = 'stopped'
      state.baseUrl = null
      state.stdoutBuffer = ''
    },
  }
}

export { createDevServer }
export type { DevServer }
