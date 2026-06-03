import type { Log } from '@kidd-cli/core'

/**
 * Shape of a single config validation issue, matching the optional `errors`
 * array on `ConfigError` from `@ciderpress/config`.
 */
export interface ConfigValidationIssue {
  readonly path: readonly (string | number)[]
  readonly message: string
}

/**
 * Log a list of config validation errors via the kidd-cli logger.
 *
 * Renders each issue as `  <dot-joined path>: <message>` using `log.error`.
 * Centralizes the side-effect logging pattern previously implemented inline
 * across multiple commands (`serve`, `dump`, `diff`, `build`).
 *
 * @param log - kidd-cli `ctx.log` instance for emitting messages
 * @param errors - Validation issues to render, one per line
 */
export function logConfigErrors(log: Log, errors: readonly ConfigValidationIssue[]): void {
  // oxlint-disable-next-line unicorn/no-array-for-each -- side-effect log
  errors.forEach((err) => {
    const path = err.path.join('.')
    log.error(`  ${path}: ${err.message}`)
  })
}
