/**
 * Parsing helpers for `draft` template variables: the `--var id=value`
 * arguments and the always-available built-in variables. Kept pure and free of
 * prompts/IO so they can be unit-tested in isolation.
 */

/**
 * Reserved built-in variable ids, always resolved by `draft` regardless of a
 * template's declared `vars`. A template may still list one of these in `vars`
 * (e.g. for documentation), but the built-in value wins.
 */
export const RESERVED_VARS = ['title', 'slug', 'date', 'filename'] as const

/**
 * The outcome of parsing `--var` arguments: the resolved key/value map plus any
 * malformed entries (missing `=` or empty id) for the caller to warn about.
 */
export interface ParsedVarArgs {
  readonly values: Readonly<Record<string, string>>
  readonly invalid: readonly string[]
}

/**
 * Parse repeated `--var id=value` arguments into a key/value map.
 *
 * Splits on the first `=` so values may themselves contain `=`. Entries with no
 * `=` or an empty id are collected into `invalid` rather than silently dropped.
 *
 * @example
 * ```ts
 * parseVarArgs(['decision=Use Postgres', 'context=']).values
 * // { decision: 'Use Postgres', context: '' }
 * ```
 *
 * @param args - The raw `--var` argument strings, or undefined when none passed
 * @returns The parsed values and any malformed entries
 */
export function parseVarArgs(args: readonly string[] | undefined): ParsedVarArgs {
  if (args === undefined) {
    return { values: {}, invalid: [] }
  }
  const parsed = args.map(parseVarArg)
  const values = Object.fromEntries(
    parsed.flatMap((entry) => {
      if (entry.ok) {
        return [[entry.id, entry.value] as const]
      }
      return []
    })
  )
  const invalid = parsed.flatMap((entry) => {
    if (entry.ok) {
      return []
    }
    return [entry.raw]
  })
  return { values, invalid }
}

/**
 * The always-available built-in variables resolved for every draft.
 */
export interface BuiltInVars {
  readonly title: string
  readonly slug: string
  readonly date: string
  readonly filename: string
}

/**
 * The outcome of parsing a single `--var` argument.
 */
type VarArgOutcome =
  | { readonly ok: true; readonly id: string; readonly value: string }
  | { readonly ok: false; readonly raw: string }

/**
 * Parse a single `id=value` argument, splitting on the first `=`.
 *
 * @private
 * @param raw - The raw argument string
 * @returns An `ok` outcome with id/value, or a failure carrying the raw string
 */
function parseVarArg(raw: string): VarArgOutcome {
  const eq = raw.indexOf('=')
  if (eq <= 0) {
    return { ok: false, raw }
  }
  const id = raw.slice(0, eq).trim()
  if (id.length === 0) {
    return { ok: false, raw }
  }
  return { ok: true, id, value: raw.slice(eq + 1) }
}

/**
 * Build the always-available built-in variables for a draft.
 *
 * @example
 * ```ts
 * buildBuiltInVars({
 *   title: 'Auth',
 *   slug: 'auth',
 *   filename: 'auth.md',
 *   now: new Date('2026-07-08T00:00:00Z'),
 * })
 * // { title: 'Auth', slug: 'auth', filename: 'auth.md', date: '2026-07-08' }
 * ```
 *
 * @param input - The resolved title, slug, output filename, and current date
 * @returns The built-in variable map (title, slug, filename, ISO date)
 */
export function buildBuiltInVars(input: {
  readonly title: string
  readonly slug: string
  readonly filename: string
  readonly now: Date
}): BuiltInVars {
  return {
    title: input.title,
    slug: input.slug,
    filename: input.filename,
    date: input.now.toISOString().slice(0, 10),
  }
}
