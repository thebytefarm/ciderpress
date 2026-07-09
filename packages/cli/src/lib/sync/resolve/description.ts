import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { DescriptionFallback } from '@ciderpress/config'
import { match, P } from 'massaman/match'
import { isNil, isNotNil } from 'massaman/predicate'

import { parse as parseFrontmatter } from '../frontmatter.ts'
import type { ResolvedEntry } from '../types.ts'
import { ENTRY_SLUGS, entrySlugRank } from './path.ts'

/**
 * Source-file extensions probed when looking for a group's overview file
 * inside a directory, in preference order (`.md` before `.mdx`).
 *
 * @private
 */
const OVERVIEW_EXTENSIONS = ['.md', '.mdx'] as const

/**
 * Extract a short description from a markdown/MDX file.
 *
 * Checks frontmatter `description` first. When absent and `fallback` is
 * `'firstParagraph'`, uses the first prose paragraph after the heading;
 * when `'none'`, yields `undefined`. Read failures resolve to `undefined`
 * rather than propagating.
 *
 * @param sourcePath - Absolute path to the source file
 * @param fallback - Strategy when no frontmatter `description` is present
 * @returns Description string, or undefined if none found
 */
export async function extractFileDescription(
  sourcePath: string,
  fallback: DescriptionFallback
): Promise<string | undefined> {
  const [readErr, raw] = await readFileSafe(sourcePath)
  if (readErr) {
    return undefined
  }

  const { data, content } = parseFrontmatter(raw)
  if (isNotNil(data.description)) {
    const fromFrontmatter = String(data.description)
    if (fromFrontmatter.length > 0) {
      return fromFrontmatter
    }
  }

  if (fallback === 'none') {
    return undefined
  }

  return extractFirstParagraph(content)
}

/**
 * Pick the best-ranked entry-slug leaf among a group's children.
 *
 * Used to source a group's description from an in-group overview page
 * (e.g. `overview.md`, `index.md`) that was discovered as a leaf child
 * rather than promoted to the group's own page.
 *
 * @param items - A group's resolved child entries
 * @returns The highest-priority entry-slug child with a source file, or undefined
 */
export function findEntrySlugChild(items: readonly ResolvedEntry[]): ResolvedEntry | undefined {
  const ranked = items.flatMap((item) => {
    if (isNil(item.link) || isNil(item.page) || isNil(item.page.source)) {
      return []
    }
    const slug = item.link.split('/').findLast(Boolean) ?? ''
    const rank = entrySlugRank(slug)
    if (rank === -1) {
      return []
    }
    return [{ item, rank }]
  })

  if (ranked.length === 0) {
    return undefined
  }

  return ranked.reduce((best, cur) => {
    if (cur.rank < best.rank) {
      return cur
    }
    return best
  }).item
}

/**
 * Parameters for {@link resolveGroupDescription}.
 */
export interface ResolveGroupDescriptionParams {
  /**
   * Explicit config description (`Page.description`) — wins over any
   * file-derived description when present.
   */
  readonly explicit?: string
  /**
   * Absolute path to the group's own overview page source, when it has one.
   */
  readonly sourcePath?: string
  /**
   * The group's resolved children — scanned for an entry-slug overview leaf.
   */
  readonly children: readonly ResolvedEntry[]
  /**
   * Absolute directory to probe for an overview file when neither
   * `sourcePath` nor an entry-slug child yields a description.
   */
  readonly probeDir?: string
  /**
   * Preferred overview filename stem (from `discover.indexFile`).
   */
  readonly indexFile?: string
  /**
   * Strategy when a resolved file has no frontmatter `description`.
   */
  readonly fallback: DescriptionFallback
}

/**
 * Resolve the description for a group (a section with children).
 *
 * Precedence: explicit config `description` > the group's own overview
 * page > an entry-slug overview leaf among children > an overview file
 * probed in `probeDir`. Returns `undefined` when nothing yields text.
 *
 * @param params - Resolution inputs (see {@link ResolveGroupDescriptionParams})
 * @returns The resolved group description, or undefined
 */
export async function resolveGroupDescription(
  params: ResolveGroupDescriptionParams
): Promise<string | undefined> {
  if (isNotNil(params.explicit)) {
    return params.explicit
  }

  if (isNotNil(params.sourcePath)) {
    const fromSource = await extractFileDescription(params.sourcePath, params.fallback)
    if (isNotNil(fromSource)) {
      return fromSource
    }
  }

  const child = findEntrySlugChild(params.children)
  if (isNotNil(child) && isNotNil(child.page) && isNotNil(child.page.source)) {
    const fromChild = await extractFileDescription(child.page.source, params.fallback)
    if (isNotNil(fromChild)) {
      return fromChild
    }
  }

  if (isNotNil(params.probeDir)) {
    const overview = findOverviewFile(params.probeDir, params.indexFile)
    if (isNotNil(overview)) {
      return extractFileDescription(overview, params.fallback)
    }
  }

  return undefined
}

/**
 * Locate an overview file inside a directory by probing entry-slug names.
 *
 * Prefers `indexFile` (when supplied) over the built-in {@link ENTRY_SLUGS}
 * chain, and `.md` over `.mdx` for each candidate name.
 *
 * @private
 * @param dir - Absolute directory to probe
 * @param indexFile - Preferred overview filename stem, if configured
 * @returns Absolute path to the first existing overview file, or undefined
 */
function findOverviewFile(dir: string, indexFile: string | undefined): string | undefined {
  const names = match(indexFile)
    .with(P.string, (name) => [name, ...ENTRY_SLUGS])
    .otherwise(() => [...ENTRY_SLUGS])

  const candidates = names.flatMap((name) =>
    OVERVIEW_EXTENSIONS.map((ext) => path.join(dir, `${name}${ext}`))
  )

  return candidates.find((candidate) => existsSync(candidate))
}

/**
 * Extract the first non-empty prose paragraph after the first heading.
 *
 * Skips HTML/JSX blocks and horizontal rules, and stops at the next
 * heading or the first blank line following collected text.
 *
 * @private
 * @param content - Markdown body (frontmatter already stripped)
 * @returns The joined paragraph text, or undefined when none is found
 */
function extractFirstParagraph(content: string): string | undefined {
  const lines = content.split('\n')
  const headingIdx = lines.findIndex((l) => l.startsWith('#'))
  const para = resolveParagraph(lines, headingIdx)

  if (para.length > 0) {
    return para.join(' ')
  }

  return undefined
}

/**
 * Collect the first non-empty paragraph after a heading from markdown lines.
 *
 * @private
 * @param lines - Array of markdown lines
 * @param headingIdx - Index of the heading line (-1 if none found)
 * @returns Array of trimmed paragraph lines
 */
function resolveParagraph(lines: readonly string[], headingIdx: number): readonly string[] {
  if (headingIdx === -1) {
    return []
  }

  return lines
    .slice(headingIdx + 1)
    .reduce<{ readonly done: boolean; readonly result: readonly string[] }>(
      (acc, line) => {
        if (acc.done) {
          return acc
        }
        if (line.startsWith('#')) {
          return { done: true, result: acc.result }
        }

        const trimmed = line.trim()
        if (trimmed === '' && acc.result.length > 0) {
          return { done: true, result: acc.result }
        }
        if (trimmed === '') {
          return acc
        }
        if (trimmed.startsWith('<') || trimmed.startsWith('---')) {
          return acc
        }

        return { done: false, result: [...acc.result, trimmed] }
      },
      { done: false, result: [] }
    ).result
}

/**
 * Read a file as UTF-8, returning a Result tuple instead of throwing.
 *
 * @private
 * @param sourcePath - Absolute path to the file
 * @returns `[null, contents]` on success, `[error, null]` on failure
 */
async function readFileSafe(
  sourcePath: string
): Promise<readonly [Error, null] | readonly [null, string]> {
  try {
    const raw = await fs.readFile(sourcePath, 'utf8')
    return [null, raw]
  } catch (error) {
    return [error as Error, null]
  }
}
