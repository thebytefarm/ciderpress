import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'

import { attempt, isOk } from 'massaman/control'

/**
 * Metadata about one buildable example site. Richer than the lean
 * `Example` used by the runner script — the build pipeline needs the
 * config-level `title`, `description`, `theme`, and the absolute path to
 * the example so it can shell out and merge the dist back in.
 */
export interface ExampleMeta {
  readonly slug: string
  readonly pkg: string
  readonly title: string
  readonly description: string
  readonly theme: string | null
  readonly tagline: string | null
  readonly absPath: string
  readonly mountBase: string
}

/**
 * Walk `examples/` and return one descriptor per directory that holds a
 * `ciderpress.config.*` plus a workspace `package.json` with a
 * `docs:build` script. The `docs:build` script is the opt-in contract —
 * examples without it are silently skipped.
 * @param dir - absolute path to the examples root directory
 * @returns ordered (alpha-by-slug) list of discovered examples
 */
export function discoverExamples(dir: string): readonly ExampleMeta[] {
  if (!existsSync(dir)) {
    return []
  }
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(dir, e.name))
    .flatMap(metaFromPath)
    .sort((a, b) => a.slug.localeCompare(b.slug))
}

/**
 * Produce zero or one `ExampleMeta` from an example directory path.
 * Returns `[]` for any directory that doesn't satisfy the contract so
 * the caller can `.flatMap` over results.
 * @param path - absolute path to one candidate example directory
 * @returns a singleton or empty array
 * @private
 */
function metaFromPath(path: string): readonly ExampleMeta[] {
  const slug = basename(path)
  const configPath = findConfigPath(path)
  if (configPath === null) {
    return []
  }
  const pkgPath = join(path, 'package.json')
  if (!existsSync(pkgPath)) {
    return []
  }
  const pkgResult = attempt(
    () =>
      JSON.parse(readFileSync(pkgPath, 'utf8')) as {
        name?: string
        scripts?: Record<string, string>
      }
  )
  if (!isOk(pkgResult) || typeof pkgResult.value.name !== 'string') {
    return []
  }
  const scripts = pkgResult.value.scripts
  if (scripts === undefined || scripts['docs:build'] === undefined) {
    return []
  }
  const source = readFileSync(configPath, 'utf8')
  return [
    {
      slug,
      pkg: pkgResult.value.name,
      title: extractStringField(source, 'title') ?? slug,
      description: extractStringField(source, 'description') ?? '',
      tagline: extractStringField(source, 'tagline'),
      theme: extractThemeName(source),
      absPath: path,
      mountBase: `/examples/${slug}/`,
    },
  ]
}

/**
 * Probe a directory for a Ciderpress config file in any supported
 * extension. Mirrors the loader's resolution order.
 * @param dir - absolute path to the example directory
 * @returns absolute path to the discovered config, or `null` when none
 * @private
 */
function findConfigPath(dir: string): string | null {
  const extensions = ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs', 'json', 'jsonc', 'yml', 'yaml']
  const found = extensions
    .map((ext) => join(dir, `ciderpress.config.${ext}`))
    .find((p) => existsSync(p))
  return found ?? null
}

/**
 * Read a top-level string field (e.g. `title`, `description`) from a
 * Ciderpress TS/JS config source. Uses a regex against the literal
 * source rather than evaluating the module so React-pulling configs
 * still parse from Node without resolving the React graph.
 * @param source - raw config source
 * @param field - field name to look up
 * @returns the string literal value, or `null` when absent
 * @private
 */
function extractStringField(source: string, field: string): string | null {
  // oxlint-disable-next-line ciderpress/no-dynamic-regexp -- field is a caller-controlled identifier, not user input
  const pattern = new RegExp(`\\b${field}\\s*:\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`, 's')
  const match = pattern.exec(source)
  if (match === null) {
    return null
  }
  return match[2].replaceAll(/\\(['"`])/g, '$1')
}

/**
 * Pull the `theme.name` field out of a config source. Same regex-only
 * strategy as {@link extractStringField}.
 * @param source - raw config source
 * @returns theme name string, or `null` when not declared
 * @private
 */
function extractThemeName(source: string): string | null {
  const match = /theme\s*:\s*\{\s*[^}]*?\bname\s*:\s*(['"`])([^'"`]+)\1/s.exec(source)
  if (match === null) {
    return null
  }
  return match[2]
}
