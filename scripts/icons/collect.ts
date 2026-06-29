import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { Result } from 'massaman/control'
import { attempt, err, isErr, ok } from 'massaman/control'

/**
 * A single `@iconify-json/*` package's `icons.json` payload — just the
 * pieces we need to enumerate every icon ID.
 */
export interface IconSet {
  readonly prefix: string
  readonly icons: Readonly<Record<string, unknown>>
  readonly aliases?: Readonly<Record<string, unknown>>
}

/**
 * Aggregated result of scanning every bundled icon set: the unique set of
 * prefixes plus every fully-qualified `prefix:name` ID.
 */
export interface GeneratedOutput {
  readonly prefixes: readonly string[]
  readonly ids: readonly string[]
}

/**
 * The `@iconify-json/*` packages we ship type definitions for. Edit this
 * list to add or remove a bundled icon set.
 */
export const ICON_SET_PACKAGES: readonly string[] = [
  'catppuccin',
  'devicon',
  'logos',
  'material-icon-theme',
  'mdi',
  'pixelarticons',
  'simple-icons',
  'skill-icons',
  'vscode-icons',
]

/**
 * Load every bundled icon set and roll its IDs up into a single output
 * payload. Stops at the first failed read and returns the error.
 * @param basePath - absolute path to `packages/ui/node_modules/@iconify-json`
 * @returns the collected output, or the first load error
 */
export function collectAllIcons(basePath: string): Result<GeneratedOutput> {
  const loaded = ICON_SET_PACKAGES.map((name) => ({ name, result: loadIconSet(basePath, name) }))
  const failure = loaded.find((entry) => isErr(entry.result))
  if (failure !== undefined) {
    return err(new Error(`Failed to load icon set "${failure.name}": ${failure.result.error}`))
  }
  const sets = loaded.map((entry) => entry.result.value as IconSet)
  return ok({
    prefixes: sets.map((s) => s.prefix),
    ids: sets.flatMap(extractIds),
  })
}

/**
 * Read and parse one `@iconify-json/<name>/icons.json` file.
 * @param basePath - parent dir holding the `@iconify-json` packages
 * @param name - icon-set package name (without the scope)
 * @returns the parsed payload, or a read/parse error
 * @private
 */
function loadIconSet(basePath: string, name: string): Result<IconSet> {
  return attempt(() => {
    const raw = readFileSync(join(basePath, name, 'icons.json'), 'utf8')
    return JSON.parse(raw) as IconSet
  })
}

/**
 * Emit every fully-qualified `prefix:name` ID for one icon set, including
 * both real icons and aliases.
 * @param iconSet - the loaded icon set
 * @returns the icon IDs
 * @private
 */
function extractIds(iconSet: IconSet): readonly string[] {
  const iconNames = Object.keys(iconSet.icons)
  const aliasNames = Object.keys(iconSet.aliases ?? {})
  return [...iconNames, ...aliasNames].map((name) => `${iconSet.prefix}:${name}`)
}
