import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { isNotNil } from 'massaman/predicate'

/**
 * Bump-type heading used by Changesets in per-package CHANGELOG files.
 */
export type BumpType = 'Major Changes' | 'Minor Changes' | 'Patch Changes'

/**
 * A single bullet-style entry under a bump-type section.
 */
export interface Entry {
  readonly body: string
}

/**
 * One `## <version>` block from a per-package CHANGELOG, with its
 * sub-sections keyed by bump type.
 */
export interface VersionBlock {
  readonly version: string
  readonly sections: ReadonlyMap<BumpType, readonly Entry[]>
}

/**
 * A parsed per-package CHANGELOG.md.
 */
export interface PackageChangelog {
  readonly name: string
  readonly versions: readonly VersionBlock[]
}

/**
 * All bump-type headings recognised by the aggregator, in the order they
 * appear in rendered output.
 */
export const BUMP_TYPES: readonly BumpType[] = ['Major Changes', 'Minor Changes', 'Patch Changes']

/**
 * Walk `packages/` and return the path to every `CHANGELOG.md` that
 * actually exists and is a regular file.
 * @param packagesDir - absolute path to the workspace `packages/` directory
 * @returns absolute paths to discovered CHANGELOG files
 */
export function discoverChangelogs(packagesDir: string): readonly string[] {
  return readdirSync(packagesDir)
    .map((name) => join(packagesDir, name, 'CHANGELOG.md'))
    .filter((p) => existsSync(p) && statSync(p).isFile())
}

/**
 * Parse the raw text of a per-package CHANGELOG.md (Changesets format) into
 * a structured `PackageChangelog`. The first line is taken as the package
 * name; everything else is split on `## ` headings.
 * @param text - raw file contents
 * @returns the parsed changelog
 */
export function parseChangelog(text: string): PackageChangelog {
  const lines = text.split('\n')
  const name = (lines[0] ?? '').replace(/^#\s+/, '').trim()
  const rest = lines.slice(1).join('\n')
  const blocks = rest.split(/\n(?=## )/g).filter((b) => b.trim().length > 0)
  const versions = blocks.map(parseVersionBlock).filter(isNotNil)
  return { name, versions }
}

/**
 * Parse a single `## <version>` block into a `VersionBlock`.
 * @param block - the block text starting with `## `
 * @returns the parsed block, or `null` when the heading can't be read
 * @private
 */
function parseVersionBlock(block: string): VersionBlock | null {
  const match = /^##\s+(\S.*)$/m.exec(block)
  if (!match) {
    return null
  }
  const version = match[1].trim()
  const remainder = block.slice(block.indexOf('\n') + 1)
  const subBlocks = remainder.split(/\n(?=### )/g).filter((b) => b.trim().length > 0)
  const pairs = subBlocks.map(parseSectionBlock).filter(isNotNil)
  return { version, sections: new Map(pairs) }
}

/**
 * Parse a `### <bump-type>` block into a `[type, entries]` pair. Ignores
 * any heading that isn't a recognised bump-type.
 * @param block - the block text starting with `### `
 * @returns the parsed pair, or `null` when the heading isn't a bump type
 * @private
 */
function parseSectionBlock(block: string): readonly [BumpType, readonly Entry[]] | null {
  const match = /^###\s+(.+)$/m.exec(block)
  if (!match) {
    return null
  }
  const heading = match[1].trim()
  if (!isBumpType(heading)) {
    return null
  }
  const remainder = block.slice(block.indexOf('\n') + 1)
  return [heading, splitEntries(remainder)]
}

/**
 * Type guard for `BumpType` string-literal values.
 * @param s - the heading text
 * @returns `true` when `s` is a recognised bump type
 * @private
 */
function isBumpType(s: string): s is BumpType {
  return s === 'Major Changes' || s === 'Minor Changes' || s === 'Patch Changes'
}

/**
 * Split a bump-section body into individual bullet entries. Each entry is
 * delimited by a top-level `- ` line; internal dep-bump rows produced by
 * Changesets are filtered out so they don't show up in the aggregated log.
 * @param text - the body text below the bump-type heading
 * @returns the parsed entries
 * @private
 */
function splitEntries(text: string): readonly Entry[] {
  const lines = text.split('\n')
  const boundaries = lines.flatMap(boundaryIndex)
  if (boundaries.length === 0) {
    return []
  }
  return boundaries
    .map((start, idx) => {
      const end = boundaries[idx + 1] ?? lines.length
      return { body: lines.slice(start, end).join('\n').trimEnd() }
    })
    .filter((e) => !isInternalDepBump(e))
}

/**
 * Return `[i]` when `line` starts a new bullet, otherwise `[]`. Used with
 * `flatMap` to collect bullet boundaries without a loop.
 * @param line - the text line being checked
 * @param index - the line's index in the file
 * @returns a singleton array with the index, or an empty array
 * @private
 */
function boundaryIndex(line: string, index: number): readonly number[] {
  if (line.startsWith('- ')) {
    return [index]
  }
  return []
}

/**
 * Detect the auto-generated "Updated dependencies" rows Changesets adds
 * when one workspace package depends on another. These would just create
 * noise in the aggregated log.
 * @param entry - a parsed bullet entry
 * @returns `true` when this entry is an internal dep-bump row
 * @private
 */
function isInternalDepBump(entry: Entry): boolean {
  const first = entry.body.split('\n')[0] ?? ''
  return first.startsWith('- Updated dependencies')
}
