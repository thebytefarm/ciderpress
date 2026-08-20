import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..', '..')
const EXAMPLES_SRC = join(REPO_ROOT, 'examples')

/**
 * Single source of truth about an example for the e2e suite.
 */
export interface ExampleMeta {
  /** Directory name (e.g. `simple`) — also the URL mount segment. */
  readonly slug: string
  /** URL path the example is mounted at on the merged deploy. */
  readonly mountBase: string
  /** Project title declared in the example's ciderpress config. */
  readonly title: string
}

/**
 * Discover every example with a `docs:build` script + a ciderpress
 * config. Mirrors the orchestrator's discovery so the e2e suite only
 * runs against what the build pipeline actually ships. Reads from the
 * source tree (not the built dist) so the list is stable even before
 * a build runs.
 *
 * @returns Alpha-sorted-by-slug list of discoverable examples
 */
export function discoverExamples(): readonly ExampleMeta[] {
  if (!existsSync(EXAMPLES_SRC)) {
    return []
  }
  return readdirSync(EXAMPLES_SRC, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const dir = join(EXAMPLES_SRC, entry.name)
      const configPath = findConfigPath(dir)
      if (configPath === null) {
        return []
      }
      const pkg = readPackageJson(join(dir, 'package.json'))
      if (pkg === null) {
        return []
      }
      const scripts = pkg.scripts
      if (scripts === undefined || scripts['docs:build'] === undefined) {
        return []
      }
      // oxlint-disable-next-line ciderpress/no-dynamic-filesystem-path -- configPath is derived from our own example dirs, not user input
      const source = readFileSync(configPath, 'utf8')
      return [
        {
          slug: entry.name,
          mountBase: `/examples/${entry.name}/`,
          title: extractTitle(source) ?? entry.name,
        } satisfies ExampleMeta,
      ]
    })
    .toSorted((a, b) => a.slug.localeCompare(b.slug))
}

/**
 * Probe an example directory for a ciderpress config file in any of
 * the loader-supported extensions.
 *
 * @private
 * @param dir - Absolute path to the example directory
 * @returns Absolute path to the config file, or `null` when missing
 */
function findConfigPath(dir: string): string | null {
  const extensions = ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs', 'json', 'jsonc', 'yml', 'yaml']
  const found = extensions
    .map((ext) => join(dir, `ciderpress.config.${ext}`))
    // oxlint-disable-next-line ciderpress/no-dynamic-filesystem-path -- candidate is derived from a fixed extension list + our own example dirs
    .find((candidate) => existsSync(candidate))
  return found ?? null
}

/**
 * Read + parse a package.json. Returns `null` on read or parse failure
 * so callers can ignore broken packages without aborting discovery.
 *
 * @private
 * @param path - Absolute path to the package.json file
 * @returns Parsed JSON object, or `null` when unreadable
 */
function readPackageJson(
  path: string
): { readonly scripts?: Readonly<Record<string, string>> } | null {
  // oxlint-disable-next-line ciderpress/no-dynamic-filesystem-path -- path is derived from our own example dirs, not user input
  if (!existsSync(path)) {
    return null
  }
  try {
    return JSON.parse(
      // oxlint-disable-next-line ciderpress/no-dynamic-filesystem-path -- same as above
      readFileSync(path, 'utf8')
    ) as {
      readonly scripts?: Readonly<Record<string, string>>
    }
  } catch {
    return null
  }
}

/**
 * Pull the literal `title:` string out of a ciderpress config source.
 * Regex-based — avoids running the config in Node, which would pull in
 * React for function-form fields like `logo`.
 *
 * @private
 * @param source - Raw config source
 * @returns Title string, or `null` when absent
 */
function extractTitle(source: string): string | null {
  const match = /\btitle\s*:\s*(['"`])((?:\\.|(?!\1).)*)\1/s.exec(source)
  if (match === null) {
    return null
  }
  return match[2].replace(/\\(['"`])/g, '$1')
}
