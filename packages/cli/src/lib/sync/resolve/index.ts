import fs from 'node:fs'
import path from 'node:path'

import { hasAnyGlobInclude, isSingleFileInclude, normalizeInclude } from '@ciderpress/config'
import type { Page, Frontmatter } from '@ciderpress/config'
import { log } from '@clack/prompts'
import fg from 'fast-glob'
import { match, P } from 'massaman/match'
import { isNil, isNotNil, isString } from 'massaman/predicate'

import { syncError, collectResults } from '../errors.ts'
import type { SyncError, SyncOutcome } from '../errors.ts'
import type { ResolvedEntry, SyncContext } from '../types.ts'
import { extractBaseDir, linkToOutputPath, sourceExt } from './path.ts'
import { resolveRecursiveGlob } from './recursive.ts'
import { sortEntries } from './sort.ts'
import { deriveText, resolveSectionTitle } from './text.ts'

/**
 * Walk the Page tree and produce a ResolvedEntry tree.
 *
 * Resolves globs, derives text, merges frontmatter, deduplicates.
 * Returns a `SyncOutcome` tuple — the caller is responsible for
 * surfacing errors and exiting.
 *
 * @param pages - Config page tree to resolve
 * @param ctx - Sync context (provides repo root, config, quiet flag)
 * @param inheritedFrontmatter - Frontmatter inherited from parent pages
 * @param depth - Current nesting depth (0 = top-level)
 * @returns Result tuple containing resolved entry tree or the first sync error
 */
export async function resolveEntries(
  pages: readonly Page[],
  ctx: SyncContext,
  inheritedFrontmatter: Frontmatter = {},
  depth = 0
): Promise<readonly [SyncError, null] | readonly [null, ResolvedEntry[]]> {
  const results = await Promise.all(
    pages.map((page) => resolveSection(page, ctx, inheritedFrontmatter, depth))
  )

  const result = collectResults(results)
  const [err] = result
  if (err) {
    return [err, null]
  }

  const [, collected] = result as readonly [null, readonly ResolvedEntry[]]
  return [null, [...collected]]
}

/**
 * Resolve a single page node — dispatches to leaf, virtual, or nested section handler.
 *
 * @private
 * @param section - Page config node to resolve
 * @param ctx - Sync context
 * @param inheritedFrontmatter - Frontmatter inherited from parent
 * @param depth - Current nesting depth
 * @returns Sync outcome tuple with resolved entry or error
 */
function resolveSection(
  section: Page,
  ctx: SyncContext,
  inheritedFrontmatter: Frontmatter,
  depth: number
): Promise<SyncOutcome<ResolvedEntry>> {
  const mergedFm = { ...inheritedFrontmatter, ...section.defaults }

  if (isSingleFileInclude(section.include) && !section.pages) {
    return Promise.resolve(resolveFilePage(section, ctx, mergedFm))
  }

  if (isNotNil(section.content) && section.path) {
    return Promise.resolve(resolveVirtualPage(section, mergedFm))
  }

  return resolveNestedSection(section, ctx, mergedFm, depth)
}

/**
 * Resolve a leaf page backed by a single source file.
 *
 * @private
 * @param section - Page config with `include` pointing to a file
 * @param ctx - Sync context
 * @param frontmatter - Merged frontmatter for the page
 * @returns Sync outcome with resolved entry or error
 */
function resolveFilePage(
  section: Page,
  ctx: SyncContext,
  frontmatter: Frontmatter
): SyncOutcome<ResolvedEntry> {
  const { include } = section
  if (isNil(include) || !isString(include)) {
    return [
      syncError('missing_from', 'resolveFilePage called without single-file page.include'),
      null,
    ]
  }

  const sourcePath = path.resolve(ctx.repoRoot, include)
  if (!fs.existsSync(sourcePath)) {
    return [syncError('file_not_found', `Source file not found: ${include}`), null]
  }

  if (isNil(section.path)) {
    return [
      syncError('missing_link', `resolveFilePage called without page.path for: ${include}`),
      null,
    ]
  }

  const ext = sourceExt(include)
  const hidden = match(section.nav)
    .with(P.nonNullable, (n) => n.hidden)
    .otherwise(() => undefined)

  return [
    null,
    {
      title: resolveSectionTitle(section),
      description: section.description,
      link: section.path,
      hidden,
      card: section.card,
      page: {
        source: sourcePath,
        outputPath: linkToOutputPath(section.path, ext),
        frontmatter,
      },
    },
  ]
}

/**
 * Resolve a virtual page with inline or generated content.
 *
 * @private
 * @param section - Page config with `content` field
 * @param frontmatter - Merged frontmatter for the page
 * @returns Sync outcome with resolved entry or error
 */
function resolveVirtualPage(section: Page, frontmatter: Frontmatter): SyncOutcome<ResolvedEntry> {
  if (isNil(section.path)) {
    return [syncError('missing_link', 'resolveVirtualPage called without page.path'), null]
  }

  const hidden = match(section.nav)
    .with(P.nonNullable, (n) => n.hidden)
    .otherwise(() => undefined)

  return [
    null,
    {
      title: resolveSectionTitle(section),
      description: section.description,
      link: section.path,
      hidden,
      card: section.card,
      page: {
        content: section.content,
        outputPath: linkToOutputPath(section.path),
        frontmatter,
      },
    },
  ]
}

/**
 * Resolve a nested page — may include glob-discovered children,
 * explicit children, or both. Deduplicates and sorts the result.
 *
 * @private
 * @param section - Page config node with potential children
 * @param ctx - Sync context
 * @param mergedFm - Merged frontmatter
 * @param depth - Current nesting depth
 * @returns Sync outcome with resolved entry containing children
 */
async function resolveNestedSection(
  section: Page,
  ctx: SyncContext,
  mergedFm: Frontmatter,
  depth: number
): Promise<SyncOutcome<ResolvedEntry>> {
  const recursive = match(section.discover)
    .with(P.nonNullable, (d) => d.recursive)
    .otherwise(() => undefined)
  const sort = match(section.discover)
    .with(P.nonNullable, (d) => d.sort)
    .otherwise(() => undefined)
  const nav = section.nav
  const hidden = match(nav)
    .with(P.nonNullable, (n) => n.hidden)
    .otherwise(() => undefined)
  const navCollapsible = match(nav)
    .with(P.nonNullable, (n) => n.collapsible)
    .otherwise(() => undefined)
  const island = match(nav)
    .with(P.nonNullable, (n) => n.island)
    .otherwise(() => undefined)
  const navRoot = match(nav)
    .with(P.nonNullable, (n) => n.root)
    .otherwise(() => undefined)

  const globbed = await (() => {
    if (hasAnyGlobInclude(section.include)) {
      if (recursive) {
        return resolveRecursiveGlob(section, ctx, mergedFm, depth + 1)
      }
      return resolveGlob(section, ctx, mergedFm)
    }
    return Promise.resolve([] as ResolvedEntry[])
  })()

  const explicitResult = await (() => {
    if (section.pages) {
      return resolveEntries(section.pages, ctx, mergedFm, depth + 1)
    }
    return Promise.resolve([null, [] as ResolvedEntry[]] as const)
  })()

  const [explicitErr, explicit] = explicitResult
  if (explicitErr) {
    return [explicitErr, null]
  }

  const children = [...globbed, ...explicit]
  const deduped = deduplicateByLink(children)
  const sorted = sortEntries(deduped, sort)

  const sectionPage = resolveSectionPage(section, ctx, mergedFm)

  // Collapsible: explicit value wins, otherwise auto-collapse below top level
  const autoCollapsible = (() => {
    if (depth > 0) {
      return true as const
    }
  })()
  const collapsible = navCollapsible ?? autoCollapsible

  // Auto-derive link so the group is navigable and gets a landing page.
  // Priority: explicit path > common prefix of children's links
  const derivedLink = deriveCommonPrefix(sorted)
  const link = section.path ?? derivedLink
  const autoLink = !section.path && link !== undefined

  return [
    null,
    {
      title: resolveSectionTitle(section),
      description: section.description,
      link,
      collapsible,
      hidden,
      card: section.card,
      landing: section.landing,
      standalone: island,
      root: navRoot,
      autoLink,
      items: sorted,
      page: sectionPage,
    },
  ]
}

/**
 * Resolve the section header page (if the page has a `path` and a single-file `include`).
 *
 * @private
 * @param section - Page config
 * @param ctx - Sync context
 * @param mergedFm - Merged frontmatter
 * @returns Page data for the section header, or undefined
 */
function resolveSectionPage(
  section: Page,
  ctx: SyncContext,
  mergedFm: Frontmatter
): ResolvedEntry['page'] | undefined {
  const recursive = match(section.discover)
    .with(P.nonNullable, (d) => d.recursive)
    .otherwise(() => undefined)
  const indexFile = match(section.discover)
    .with(P.nonNullable, (d) => d.indexFile)
    .otherwise(() => undefined)

  if (section.path && isSingleFileInclude(section.include)) {
    const include = section.include as string
    const sourcePath = path.resolve(ctx.repoRoot, include)
    if (fs.existsSync(sourcePath)) {
      const ext = sourceExt(include)
      return {
        source: sourcePath,
        outputPath: linkToOutputPath(section.path, ext),
        frontmatter: mergedFm,
      }
    }
  } else if (section.path && recursive && section.include) {
    // Recursive mode: find the root-level entry file from the glob base (.md or .mdx)
    const patterns = normalizeInclude(section.include)
    const baseDir = extractBaseDir(patterns[0])
    const entryFile = indexFile ?? 'overview'
    const mdPath = path.join(baseDir, `${entryFile}.md`)
    const mdxPath = path.join(baseDir, `${entryFile}.mdx`)
    const mdxExists = fs.existsSync(path.resolve(ctx.repoRoot, mdxPath))
    const indexPath = match(mdxExists)
      .with(true, () => mdxPath)
      .otherwise(() => mdPath)
    const sourcePath = path.resolve(ctx.repoRoot, indexPath)
    if (fs.existsSync(sourcePath)) {
      const ext = sourceExt(indexPath)
      return {
        source: sourcePath,
        outputPath: linkToOutputPath(section.path, ext),
        frontmatter: mergedFm,
      }
    }
  }
}

/**
 * Resolve a non-recursive glob pattern into leaf page entries.
 *
 * @private
 * @param section - Page config with glob `include` pattern(s)
 * @param ctx - Sync context
 * @param frontmatter - Frontmatter to apply to discovered pages
 * @returns Array of resolved entries for each matching file
 */
async function resolveGlob(
  section: Page,
  ctx: SyncContext,
  frontmatter: Frontmatter
): Promise<ResolvedEntry[]> {
  const globalIgnore = match(ctx.config.discover)
    .with(P.nonNullable, (d) => d.ignore ?? [])
    .otherwise(() => [] as readonly string[])
  const sectionIgnore = match(section.discover)
    .with(P.nonNullable, (d) => d.ignore ?? [])
    .otherwise(() => [] as readonly string[])
  const ignore = [...globalIgnore, ...sectionIgnore]

  if (isNil(section.include)) {
    log.error('[ciderpress] resolveGlob called without page.include')
    return []
  }

  const patterns = normalizeInclude(section.include)
  const files = await fg(patterns as string[], {
    cwd: ctx.repoRoot,
    ignore,
    absolute: false,
    onlyFiles: true,
  })

  const titleStr = resolveSectionTitle(section)

  if (files.length === 0) {
    if (!ctx.quiet) {
      log.warn(`Glob "${String(section.include)}" matched 0 files for "${titleStr}"`)
    }
    return []
  }

  const prefix = section.path ?? ''

  const titleConfig = match(section.title)
    .when(
      (
        t
      ): t is {
        from: 'auto' | 'filename' | 'heading' | 'frontmatter'
        transform?: (text: string, slug: string) => string
      } => typeof t === 'object' && t !== null && 'from' in t,
      (t) => t
    )
    .otherwise(() => null)
  const titleFrom = match(titleConfig)
    .with(P.nonNullable, (tc) => tc.from)
    .otherwise(() => 'auto' as const)
  const titleTransform = match(titleConfig)
    .with(P.nonNullable, (tc) => tc.transform ?? null)
    .otherwise(() => null)

  return Promise.all(
    files.map(async (file) => {
      const ext = sourceExt(file)
      const slug = path.basename(file, path.extname(file))
      const link = `${prefix}/${slug}`
      const sourcePath = path.resolve(ctx.repoRoot, file)
      const rawTitle = await deriveText(sourcePath, slug, titleFrom)
      const title = match(titleTransform)
        .with(P.nonNullable, (t) => t(rawTitle, slug))
        .otherwise(() => rawTitle)

      return {
        title,
        link,
        page: {
          source: sourcePath,
          outputPath: linkToOutputPath(link, ext),
          frontmatter,
        },
      } satisfies ResolvedEntry
    })
  )
}

/**
 * Derive a common path prefix from children's links.
 *
 * Given children with links like `/a/b/c`, `/a/b/d`, `/a/b/e`,
 * returns `/a/b`. Returns `undefined` when no common prefix exists
 * or there are no children with links.
 *
 * @private
 * @param children - Child entries to derive common prefix from
 * @returns Common link prefix, or undefined
 */
function deriveCommonPrefix(children: readonly ResolvedEntry[]): string | undefined {
  const links = children.filter((c) => c.link).map((c) => c.link as string)
  if (links.length === 0) {
    return undefined
  }

  const segmentArrays = links.map((link) => link.split('/').filter(Boolean))
  const shortest = segmentArrays.reduce(
    (min, segs) => Math.min(min, segs.length),
    Number.POSITIVE_INFINITY
  )

  const refSegs = segmentArrays[0].slice(0, shortest)
  const divergeAt = refSegs.findIndex((seg, i) => !segmentArrays.every((segs) => segs[i] === seg))
  const common = match(divergeAt)
    .with(-1, () => refSegs)
    .otherwise((n) => refSegs.slice(0, n))

  if (common.length === 0) {
    return undefined
  }

  return `/${common.join('/')}`
}

/**
 * Deduplicate entries by `link`. Later entries (explicit) override earlier (glob).
 *
 * Uses `link` as the dedup key when present. Entries without a link are never
 * considered duplicates — they always pass through (sections with only `text`).
 *
 * @private
 * @param entries - Entries to deduplicate
 * @returns Deduplicated entries with later entries winning over earlier ones
 */
function deduplicateByLink(entries: readonly ResolvedEntry[]): ResolvedEntry[] {
  const { result } = entries.reduce<{ seen: Map<string, number>; result: ResolvedEntry[] }>(
    (acc, entry) => {
      if (isNil(entry.link)) {
        return {
          seen: acc.seen,
          result: [...acc.result, entry],
        }
      }
      const existing = acc.seen.get(entry.link)
      if (existing === undefined) {
        // intentional mutation: seen Map is mutated in-place for O(1) dedup lookups
        acc.seen.set(entry.link, acc.result.length)
        return {
          seen: acc.seen,
          result: [...acc.result, entry],
        }
      }
      return {
        seen: acc.seen,
        result: acc.result.map((item, i) => {
          if (i === existing) {
            return entry
          }
          return item
        }),
      }
    },
    { seen: new Map<string, number>(), result: [] }
  )

  return result
}
