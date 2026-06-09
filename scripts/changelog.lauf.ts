import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { lauf, z } from 'laufen'

type BumpType = 'Major Changes' | 'Minor Changes' | 'Patch Changes'

interface Entry {
  readonly body: string
}

interface VersionBlock {
  readonly version: string
  readonly sections: ReadonlyMap<BumpType, readonly Entry[]>
}

interface PackageChangelog {
  readonly name: string
  readonly versions: readonly VersionBlock[]
}

interface AggregatedEntry {
  readonly body: string
  readonly packages: readonly string[]
}

interface AggregatedVersion {
  readonly version: string
  readonly sections: ReadonlyMap<BumpType, readonly AggregatedEntry[]>
}

interface ParsedSemver {
  readonly major: number
  readonly minor: number
  readonly patch: number
  readonly pre: string | null
}

const BUMP_TYPES: readonly BumpType[] = ['Major Changes', 'Minor Changes', 'Patch Changes']

const MIN_VERSION = '0.9.0'

const HEADER = `<!-- AUTO-GENERATED — DO NOT EDIT. Regenerate with: lauf run changelog -->

# Changelog

All notable changes to ciderpress packages, aggregated by release version.
`

function parseChangelog(text: string): PackageChangelog {
  const lines = text.split('\n')
  const name = (lines[0] ?? '').replace(/^#\s+/, '').trim()
  const rest = lines.slice(1).join('\n')
  const blocks = rest.split(/\n(?=## )/g).filter((b) => b.trim().length > 0)
  const versions = blocks.map(parseVersionBlock).filter((v): v is VersionBlock => v !== null)
  return { name, versions }
}

function parseVersionBlock(block: string): VersionBlock | null {
  const match = /^##\s+(\S.*)$/m.exec(block)
  if (!match) {
    return null
  }
  const version = match[1].trim()
  const remainder = block.slice(block.indexOf('\n') + 1)
  const subBlocks = remainder.split(/\n(?=### )/g).filter((b) => b.trim().length > 0)

  const pairs = subBlocks
    .map(parseSectionBlock)
    .filter((p): p is readonly [BumpType, readonly Entry[]] => p !== null)

  return { version, sections: new Map(pairs) }
}

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

function isBumpType(s: string): s is BumpType {
  return s === 'Major Changes' || s === 'Minor Changes' || s === 'Patch Changes'
}

function boundaryIndex(line: string, index: number): readonly number[] {
  if (line.startsWith('- ')) {
    return [index]
  }
  return []
}

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

function isInternalDepBump(entry: Entry): boolean {
  const first = entry.body.split('\n')[0] ?? ''
  return first.startsWith('- Updated dependencies')
}

function discoverChangelogs(packagesDir: string): readonly string[] {
  return readdirSync(packagesDir)
    .map((name) => join(packagesDir, name, 'CHANGELOG.md'))
    .filter((p) => existsSync(p) && statSync(p).isFile())
}

function splitCoreAndPre(v: string): { readonly core: string; readonly pre: string | null } {
  const dashIdx = v.indexOf('-')
  if (dashIdx === -1) {
    return { core: v, pre: null }
  }
  return { core: v.slice(0, dashIdx), pre: v.slice(dashIdx + 1) }
}

function parseSemver(v: string): ParsedSemver {
  const { core, pre } = splitCoreAndPre(v)
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(core)
  if (!match) {
    return { major: 0, minor: 0, patch: 0, pre: v }
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    pre,
  }
}

function compareSemverDesc(a: string, b: string): number {
  const pa = parseSemver(a)
  const pb = parseSemver(b)
  if (pa.major !== pb.major) {
    return pb.major - pa.major
  }
  if (pa.minor !== pb.minor) {
    return pb.minor - pa.minor
  }
  if (pa.patch !== pb.patch) {
    return pb.patch - pa.patch
  }
  if (pa.pre === null && pb.pre !== null) {
    return -1
  }
  if (pa.pre !== null && pb.pre === null) {
    return 1
  }
  if (pa.pre === null && pb.pre === null) {
    return 0
  }
  return (pb.pre ?? '').localeCompare(pa.pre ?? '')
}

function aggregate(changelogs: readonly PackageChangelog[]): readonly AggregatedVersion[] {
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

  const grouped = allEntries.reduce<Map<string, readonly string[]>>((acc, { body, pkg }) => {
    const existing = acc.get(body) ?? []
    acc.set(body, [...existing, pkg])
    return acc
  }, new Map())

  return [...grouped.entries()].map(([body, packages]) => ({
    body,
    packages: [...new Set(packages)].toSorted(),
  }))
}

function render(versions: readonly AggregatedVersion[]): string {
  const sections = versions.map(renderVersion)
  return `${HEADER}\n${sections.join('\n\n')}\n`
}

function renderVersion(v: AggregatedVersion): string {
  const bumpSections = [...v.sections.entries()].map(([type, entries]) =>
    renderBumpSection(type, entries)
  )
  return `## ${v.version}\n\n${bumpSections.join('\n\n')}`
}

function renderBumpSection(type: BumpType, entries: readonly AggregatedEntry[]): string {
  const body = entries.map(renderEntry).join('\n\n')
  return `### ${type}\n\n${body}`
}

function renderEntry(entry: AggregatedEntry): string {
  const chips = entry.packages.map((p) => `\`${p}\``).join(' ')
  return `${chips}\n\n${entry.body}`
}

export default lauf({
  description: 'Aggregate per-package CHANGELOG.md files into a root CHANGELOG.md',
  args: {
    verbose: z.boolean().default(false).describe('Enable verbose logging'),
  },
  run(ctx) {
    ctx.spinner.start('Aggregating package changelogs')

    const packagesDir = join(ctx.root, 'packages')
    const paths = discoverChangelogs(packagesDir)
    const parsed = paths.map((p) => parseChangelog(readFileSync(p, 'utf8')))

    if (ctx.args.verbose) {
      const summary = parsed.map((p) => `  ${p.name}: ${p.versions.length} versions`).join('\n')
      ctx.logger.info(`Discovered ${paths.length} package changelogs\n${summary}`)
    }

    const aggregated = aggregate(parsed)
    const content = render(aggregated)
    const outPath = join(ctx.root, 'CHANGELOG.md')
    writeFileSync(outPath, content)

    ctx.spinner.stop(
      `Aggregated ${aggregated.length} versions from ${parsed.length} packages → ${outPath.replace(`${ctx.root}/`, '')}`
    )
  },
})
