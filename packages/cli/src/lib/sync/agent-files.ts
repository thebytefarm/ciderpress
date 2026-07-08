import path from 'node:path'

import { hasGlobChars } from '@ciderpress/config'

/**
 * Bare filenames of coding-agent instruction files that must never be pulled
 * into the docs site by a content glob.
 *
 * These files (Claude Code's `CLAUDE.md`, the `AGENTS.md` convention, Gemini
 * CLI's `GEMINI.md`, etc.) live at arbitrary depths in a repo and are written
 * for agents, not readers. Matching is case-sensitive against the uppercase
 * convention only — a lowercase `claude.md` is treated as ordinary content,
 * since the agent-file convention is effectively always uppercase.
 *
 * Extend this list to exclude additional agent instruction files.
 */
export const AGENT_INSTRUCTION_FILES: readonly string[] = [
  'CLAUDE.md',
  'AGENTS.md',
  'AGENT.md',
  'GEMINI.md',
]

/**
 * Whether a bare filename is a known coding-agent instruction file.
 *
 * @param filename - A bare filename with no directory component (e.g. `CLAUDE.md`)
 * @returns True when the name exactly matches an uppercase agent instruction file
 */
export function isAgentInstructionFile(filename: string): boolean {
  return AGENT_INSTRUCTION_FILES.includes(filename)
}

/**
 * Drop agent instruction files that a glob swept up, while keeping any that a
 * literal include named directly.
 *
 * A glob such as `**\/*.md` should never surface `CLAUDE.md`, but an include of
 * `docs/CLAUDE.md` (no glob metacharacters) is an explicit request and is kept.
 *
 * @param files - Repo-relative file paths returned by fast-glob
 * @param patterns - The include patterns that produced `files`
 * @returns `files` with globbed agent instruction files removed
 */
export function excludeGlobbedAgentFiles(
  files: readonly string[],
  patterns: readonly string[]
): readonly string[] {
  const explicit = new Set(patterns.filter((p) => !hasGlobChars(p)).map(normalizeRelative))

  return files.filter((file) => {
    if (!isAgentInstructionFile(path.basename(file))) {
      return true
    }
    return explicit.has(normalizeRelative(file))
  })
}

/**
 * Normalize a relative path for equality comparison — POSIX separators, no `./`.
 *
 * @private
 * @param p - A relative path from an include pattern or glob result
 * @returns The normalized POSIX-style relative path
 */
function normalizeRelative(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.\//, '')
}
