import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

import type { Result } from 'massaman/control'
import { attempt, err, isOk, ok } from 'massaman/control'

import type { ExampleMeta } from './discover.ts'

/**
 * Copy an example's `.ciderpress/dist/` into the root build output at
 * `.ciderpress/dist/examples/<slug>/`. Idempotent — overwrites in place.
 * @param opts.root - absolute path to the repo root
 * @param opts.example - the example to merge
 * @returns `ok(undefined)` on success, or an error when the source dist
 *   is missing or the copy fails
 */
export function mergeExampleDist(opts: {
  readonly root: string
  readonly example: ExampleMeta
}): Result<undefined> {
  const src = join(opts.example.absPath, '.ciderpress', 'dist')
  const dst = join(opts.root, '.ciderpress', 'dist', 'examples', opts.example.slug)
  if (!existsSync(src)) {
    return err(new Error(`expected ${src} to exist after build`))
  }
  const copied = attempt(() => {
    mkdirSync(dst, { recursive: true })
    cpSync(src, dst, { recursive: true, force: true })
  })
  if (!isOk(copied)) {
    return err(copied.error)
  }
  return ok(undefined)
}
