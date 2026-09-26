import { groupBy } from 'massaman/array'

import type { BumpType, PackageChangelog } from './parse.ts'
import { BUMP_TYPES } from './parse.ts'
import { compareSemverDesc } from './semver.ts'

/**
 * One bullet entry, with the set of packages that share its body text.
 * Entries with identical bodies (e.g. one changeset that touched several
 * packages) are merged into a single row tagged with all package names.
 */
export interface AggregatedEntry {
  readonly body: string
  readonly packages: readonly string[]
}

/**
 * A single version's worth of entries across every package, keyed by bump
 * type and ready to render.
 */
export interface AggregatedVersion {
  readonly version: string
  readonly sections: ReadonlyMap<BumpType, readonly AggregatedEntry[]>
}

/**
 * Oldest version included in the aggregated log. Anything older is dropped
 * because the project's pre-`0.9.0` history is not interesting to users.
 */
export const MIN_VERSION = '0.9.0'

/**
 * Merge a set of per-package changelogs into a single descending list of
 * aggregated versions. Versions older than {@link MIN_VERSION} are dropped,
 * and versions with no surviving entries are removed.
 * @param changelogs - parsed per-package changelogs
 * @returns aggregated versions, newest first
 */
export function aggregate(changelogs: readonly PackageChangelog[]): readonly AggregatedVersion[] {
  const allVersions = [...new Set(changelogs.flatMap((c) => c.versions.map((v) => v.version)))]
    .filter((v) => compareSemverDesc(v, MIN_VERSION) <= 0)
    .toSorted(compareSemverDesc)

  return allVersions
    .map((version) => {
      const pairs = BUMP_TYPES.map<readonly [BumpType, readonly AggregatedEntry[]]>((type) => [
        type,
        aggregateSection(version, type, changelogs),
      ]).filter(([, entries]) => entries.length > 0)
      return { version, sections: new Map(pairs) }
    })
    .filter((v) => v.sections.size > 0)
}

/**
 * Collect every entry of `type` at `version` across the supplied
 * changelogs, then dedupe by body so a shared changeset shows up once
 * with all originating package names attached.
 * @param version - the version to aggregate
 * @param type - the bump type to collect
 * @param changelogs - parsed per-package changelogs
 * @returns the deduped, package-tagged entries
 * @private
 */
function aggregateSection(
  version: string,
  type: BumpType,
  changelogs: readonly PackageChangelog[]
): readonly AggregatedEntry[] {
  const allEntries = changelogs.flatMap((cl) => {
    const v = cl.versions.find((vs) => vs.version === version)
    if (!v) {
      return []
    }
    const entries = v.sections.get(type)
    if (!entries) {
      return []
    }
    return entries.map((e) => ({ body: e.body, pkg: cl.name }))
  })

  const grouped = groupBy(allEntries, ({ body }) => body)

  return Object.entries(grouped).map(([body, group]) => ({
    body,
    packages: [...new Set(group.map(({ pkg }) => pkg))].toSorted(),
  }))
}
