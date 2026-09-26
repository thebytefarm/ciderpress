import { join } from 'node:path'

import { $ } from 'zx'

/**
 * Spawn `pnpm --filter <pkg> docs:build` and resolve with its exit code.
 * `env` overrides (e.g. `CIDERPRESS_BASE`) win over the example's
 * `config.base`.
 * @param opts.pkg - workspace package to build
 * @param opts.cwd - working directory (repo root)
 * @param opts.env - extra env vars merged on top of `process.env`
 * @returns the child process exit code (0 on success)
 */
export function runExampleBuild(opts: {
  readonly pkg: string
  readonly cwd: string
  readonly env: Readonly<Record<string, string>>
}): Promise<number> {
  return runSpawn({
    bin: 'pnpm',
    args: ['--filter', opts.pkg, 'docs:build'],
    cwd: opts.cwd,
    env: opts.env,
    failContext: `${opts.pkg} build`,
  })
}

/**
 * Build the root docs site by invoking the local `ciderpress` CLI
 * directly. Bypasses the `pnpm --filter ciderpress-monorepo docs:build`
 * indirection so this orchestrator can be the implementation of that
 * very script without recursing.
 * @param opts.cwd - working directory (repo root)
 * @returns the child process exit code (0 on success)
 */
export function runRootBuild(opts: {
  readonly cwd: string
}): Promise<number> {
  const cliPath = join(opts.cwd, 'packages', 'ciderpress', 'dist', 'cli.mjs')
  return runSpawn({
    bin: 'node',
    args: [cliPath, 'build'],
    cwd: opts.cwd,
    failContext: 'root build',
  })
}

/**
 * Spawn a child process with stdio piped, buffer its stderr, and resolve
 * with the exit code. On non-zero exit the buffered output is logged
 * against `failContext`.
 * @param opts.bin - executable to spawn
 * @param opts.args - argv passed to the executable
 * @param opts.cwd - working directory
 * @param opts.env - optional env overrides merged on top of `process.env`
 * @param opts.failContext - short label used in the failure log line
 * @returns the child process exit code
 * @private
 */
function runSpawn(opts: {
  readonly bin: string
  readonly args: readonly string[]
  readonly cwd: string
  readonly env?: Readonly<Record<string, string>>
  readonly failContext: string
}): Promise<number> {
  const shell = $({
    cwd: opts.cwd,
    env: { ...process.env, ...opts.env },
    verbose: false,
  })
  return shell`${opts.bin} ${opts.args}`
    .nothrow()
    .quiet()
    .then((result) => {
      if (!result.ok) {
        const output = [result.message, result.stdout, result.stderr].filter(Boolean).join('\n')
        console.error(`${opts.failContext} failed:\n${output}`)
      }
      return result.exitCode ?? 1
    })
}
