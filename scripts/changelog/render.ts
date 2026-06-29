import { autoGenHeader } from '../lib/auto-gen-header.ts'
import type { AggregatedEntry, AggregatedVersion } from './aggregate.ts'
import type { BumpType } from './parse.ts'

const HEADER = `${autoGenHeader({ cmd: 'lauf run changelog', style: 'html' })}

# Changelog

All notable changes to ciderpress packages, aggregated by release version.
`

/**
 * Render the aggregated versions into the final root `CHANGELOG.md` body.
 * @param versions - aggregated versions, newest first
 * @returns the full markdown file contents, terminated by a newline
 */
export function render(versions: readonly AggregatedVersion[]): string {
  const sections = versions.map(renderVersion)
  return `${HEADER}\n${sections.join('\n\n')}\n`
}

/**
 * Render a single aggregated version block as `## <version>` followed by
 * its bump-type sections.
 * @param v - the aggregated version
 * @returns the markdown for one version
 * @private
 */
function renderVersion(v: AggregatedVersion): string {
  const bumpSections = [...v.sections.entries()].map(([type, entries]) =>
    renderBumpSection(type, entries)
  )
  return `## ${v.version}\n\n${bumpSections.join('\n\n')}`
}

/**
 * Render a single `### <BumpType>` section with all its entries.
 * @param type - the bump type heading
 * @param entries - aggregated entries for this section
 * @returns the markdown for one bump section
 * @private
 */
function renderBumpSection(type: BumpType, entries: readonly AggregatedEntry[]): string {
  const body = entries.map(renderEntry).join('\n\n')
  return `### ${type}\n\n${body}`
}

/**
 * Render a single aggregated entry as a package-chip header followed by
 * the entry body.
 * @param entry - the aggregated entry
 * @returns the markdown for one entry
 * @private
 */
function renderEntry(entry: AggregatedEntry): string {
  const chips = entry.packages.map((p) => `\`${p}\``).join(' ')
  return `${chips}\n\n${entry.body}`
}
