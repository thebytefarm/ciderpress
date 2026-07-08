/**
 * Detects leftover `{{ }}` fill markers in synced documentation content.
 *
 * A doc scaffolded from a template but never finished still carries the
 * template's `{{ id }}` markers. This scans the synced content (what actually
 * ships) so `check`/`build --check` can fail before those markers reach a
 * published site. Fenced and inline code are stripped first so docs that
 * *demonstrate* the convention in code samples don't false-positive.
 */

import fs from 'node:fs/promises'
import path from 'node:path'

import { findMarkers } from '@ciderpress/templates'
import { attemptAsync } from 'massaman/control'

const FENCED_BLOCK_PATTERN = /```[\s\S]*?```/g
const TILDE_BLOCK_PATTERN = /~~~[\s\S]*?~~~/g
const INLINE_CODE_PATTERN = /`[^`\n]*`/g

/**
 * A doc that still contains one or more unfilled `{{ }}` markers.
 */
export interface MarkerIssue {
  /** File path relative to the repo root. */
  readonly file: string
  /** The distinct leftover markers found, each normalized to `{{ key }}`. */
  readonly markers: readonly string[]
}

/**
 * Scan synced content for docs that still carry unfilled `{{ }}` markers.
 *
 * Walks every `.md`/`.mdx` file under `contentDir`, strips fenced and inline
 * code, and reports any remaining markers. Templates live outside the synced
 * content, so they are naturally excluded.
 *
 * @param input - The synced content directory and repo root for relative paths
 * @returns One issue per file with leftover markers (empty when all clean)
 */
export async function scanMarkers(input: {
  readonly contentDir: string
  readonly repoRoot: string
}): Promise<readonly MarkerIssue[]> {
  const { contentDir, repoRoot } = input
  const files = await collectMarkdownFiles(contentDir)

  const results = await Promise.all(
    files.map(async (absPath) => {
      const read = await attemptAsync(() => fs.readFile(absPath, 'utf8'))
      if (!read.ok) {
        return null
      }
      const markers = findMarkers(stripCode(read.value))
      if (markers.length === 0) {
        return null
      }
      return { file: path.relative(repoRoot, absPath), markers }
    })
  )

  return results.flatMap((result) => {
    if (result === null) {
      return []
    }
    return [result]
  })
}

/**
 * Recursively collect every `.md`/`.mdx` file under a directory.
 *
 * @private
 * @param dir - The directory to walk
 * @returns Absolute paths of all markdown/MDX files found (empty on read error)
 */
async function collectMarkdownFiles(dir: string): Promise<readonly string[]> {
  const read = await attemptAsync(() => fs.readdir(dir, { withFileTypes: true }))
  if (!read.ok) {
    return []
  }
  const entries = read.value

  const here = entries
    .filter((entry) => entry.isFile() && isMarkdown(entry.name))
    .map((entry) => path.join(dir, entry.name))

  const subDirs = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => collectMarkdownFiles(path.join(dir, entry.name)))
  )

  return [...here, ...subDirs.flat()]
}

/**
 * Check whether a filename is a markdown or MDX document.
 *
 * @private
 * @param name - The filename to inspect
 * @returns True for `.md` and `.mdx` files
 */
function isMarkdown(name: string): boolean {
  return name.endsWith('.md') || name.endsWith('.mdx')
}

/**
 * Remove fenced code blocks and inline code spans so markers used purely as
 * documentation examples are not treated as unfilled.
 *
 * @private
 * @param text - The raw document text
 * @returns The text with all code regions removed
 */
function stripCode(text: string): string {
  return text
    .replace(FENCED_BLOCK_PATTERN, '')
    .replace(TILDE_BLOCK_PATTERN, '')
    .replace(INLINE_CODE_PATTERN, '')
}
