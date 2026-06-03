import fs from 'node:fs/promises'
import path from 'node:path'

import { difference, partition, uniq } from 'massaman/array'
import { attemptAsync } from 'massaman/control'

import type { Manifest } from './types.ts'

const MANIFEST_FILE = '.generated/manifest.json'

/**
 * Load the previous sync manifest from disk.
 *
 * @param outDir - Absolute path to the output directory
 * @returns Parsed manifest, or `null` if no manifest exists
 */
export async function loadManifest(outDir: string): Promise<Manifest | null> {
  const p = path.resolve(outDir, MANIFEST_FILE)
  // I/O boundary: both fs.readFile and JSON.parse can throw —
  // missing file (first sync) or corrupted manifest are expected cases.
  try {
    const raw = await fs.readFile(p, 'utf8')
    return JSON.parse(raw) as Manifest
  } catch {
    return null
  }
}

/**
 * Write the current sync manifest to disk.
 *
 * @param outDir - Absolute path to the output directory
 * @param manifest - Manifest to persist
 */
export async function saveManifest(outDir: string, manifest: Manifest): Promise<void> {
  const p = path.resolve(outDir, MANIFEST_FILE)
  await fs.mkdir(path.dirname(p), { recursive: true })
  await fs.writeFile(p, JSON.stringify(manifest, null, 2), 'utf8')
}

/**
 * Result returned by {@link cleanStaleFiles} describing the outcome of
 * deleting stale output files.
 *
 * `attempted` is the total number of stale paths considered for removal,
 * `removed` is how many `fs.rm` calls completed without error, and `failed`
 * captures any per-path errors (with `force: true` set, failures are rare
 * but indicate permission/IO issues worth surfacing).
 */
export interface CleanStaleFilesResult {
  readonly attempted: number
  readonly removed: number
  readonly failed: readonly { readonly path: string; readonly reason: string }[]
}

/**
 * Delete output files that exist in the old manifest but not the new one.
 * Prunes empty parent directories after removing stale files.
 *
 * Each `fs.rm` is wrapped in `attemptAsync` so a single failure cannot
 * abort the entire cleanup pass. Per-path failures are collected and
 * returned to the caller; `attempted` may exceed `removed` when some
 * paths failed to delete (and `failed` will be non-empty).
 *
 * @param outDir - Absolute path to the output directory
 * @param oldManifest - Manifest from the previous sync
 * @param newManifest - Manifest from the current sync
 * @returns Counts of attempted vs removed stale files plus per-path failures
 */
export async function cleanStaleFiles(
  outDir: string,
  oldManifest: Manifest,
  newManifest: Manifest
): Promise<CleanStaleFilesResult> {
  const stalePaths = difference(Object.keys(oldManifest.files), Object.keys(newManifest.files))

  const resolved = stalePaths.map((oldPath) => path.resolve(outDir, oldPath))

  // Remove files in parallel (independent I/O, safe to parallelize)
  const outcomes = await Promise.all(
    resolved.map(async (abs) => {
      const result = await attemptAsync(async () => {
        await fs.rm(abs, { force: true })
      })
      return { abs, result } as const
    })
  )

  const [failures, successes] = partition(outcomes, ({ result }) => !result.ok)
  const failed = failures.map(({ abs, result }) => ({
    path: abs,
    reason: resolveReason(result.error),
  }))

  // Deduplicate parents so shared ancestors aren't raced N times
  const uniqueParents = uniq(resolved.map((abs) => path.dirname(abs)))
  await Promise.all(uniqueParents.map((dir) => pruneEmptyDirs(dir, outDir)))

  return {
    attempted: stalePaths.length,
    removed: successes.length,
    failed,
  }
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Translate an `attemptAsync` error into a human-readable reason string.
 *
 * @private
 * @param error - Error from a failed `attemptAsync` result, or null
 * @returns Reason message, or `'unknown'` when the error was null
 */
function resolveReason(error: Error | null): string {
  if (error === null) {
    return 'unknown'
  }
  return error.message
}

/**
 * Recursively remove empty parent directories up to the stop boundary.
 *
 * @private
 * @param dir - Absolute path to the directory to check and possibly remove
 * @param stopAt - Absolute path to the boundary directory (never removed)
 * @returns Promise that resolves when pruning is complete
 */
async function pruneEmptyDirs(dir: string, stopAt: string): Promise<void> {
  if (dir === stopAt || !dir.startsWith(stopAt)) {
    return
  }
  try {
    const entries = await fs.readdir(dir)
    if (entries.length === 0) {
      await fs.rmdir(dir)
      await pruneEmptyDirs(path.dirname(dir), stopAt)
    }
  } catch {
    // directory may have been removed already
  }
}
