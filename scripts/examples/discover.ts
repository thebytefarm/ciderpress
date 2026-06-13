import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'

import { attempt, isOk } from 'massaman/control'

/**
 * One example site discovered under `examples/`.
 */
export interface Example {
  readonly name: string
  readonly pkg: string
}

/**
 * Walk `examples/` and return every immediate subdirectory that has a
 * `package.json` with a string `name` field. Bad / missing manifests are
 * silently skipped — the goal is to list runnable examples, not to
 * validate them.
 * @param dir - absolute path to the `examples/` directory
 * @returns the discovered examples
 */
export function discoverExamples(dir: string): readonly Example[] {
  if (!existsSync(dir)) {
    return []
  }
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(dir, e.name))
    .flatMap((path) => {
      const pkgPath = join(path, 'package.json')
      if (!existsSync(pkgPath)) {
        return []
      }
      const parsed = attempt(() => JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string })
      if (!isOk(parsed) || typeof parsed.value.name !== 'string') {
        return []
      }
      return [{ name: basename(path), pkg: parsed.value.name }]
    })
}
