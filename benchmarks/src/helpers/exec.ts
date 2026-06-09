import { execFileSync } from 'node:child_process'
import path from 'node:path'

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..', '..')
const CLI_ENTRY = path.resolve(REPO_ROOT, 'packages/ciderpress/dist/cli.mjs')

/**
 * Run a ciderpress CLI command synchronously and return stdout.
 *
 * @param args - CLI arguments (e.g. ['sync', '--quiet'])
 * @param cwd - Working directory to run in
 * @returns stdout string
 */
export function runCli(args: readonly string[], cwd: string): string {
  return execFileSync('node', [CLI_ENTRY, ...args], {
    cwd,
    stdio: 'pipe',
    encoding: 'utf8',
    timeout: 300_000,
  })
}

export { REPO_ROOT }
