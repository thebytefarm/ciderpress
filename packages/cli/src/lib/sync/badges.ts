/**
 * Sidebar badge resolution.
 *
 * Walks the resolved entry tree and stamps each entry with an encoded
 * Rspress `tag` string ({@link ResolvedEntry.badgeTag}) built from three
 * sources, in precedence order:
 *
 * 1. the page's own file frontmatter `badge` (read from disk here),
 * 2. inherited/`defaults` `badge` (already merged onto `page.frontmatter`),
 * 3. glob {@link BadgeRule}s matched against the entry's route path.
 *
 * Frontmatter and `defaults` win over glob rules; the first source that
 * yields a badge wins outright (override, not merge).
 *
 * A collapsible group entry that is *also* a doc (has children and a link)
 * gets no sidebar `tag` — the badge would collide with the collapse
 * chevron. Its badge still surfaces on the page via the route→badges map.
 *
 * @see https://rspress.dev/guide/basic/auto-nav-sidebar — sidebar `tag`
 */

import fs from 'node:fs'

import { encodeBadges, normalizeBadgeInput, resolveStatusBadges } from '@ciderpress/config'
import type { BadgeConfig, BadgeRule, Status } from '@ciderpress/config'

import { splitFrontmatter } from '../matter.ts'
import type { ResolvedEntry } from './types.ts'

/**
 * Inputs to the badge pass: glob rules and the resolved status registry.
 */
export interface BadgeContext {
  /**
   * Glob badge rules from the top-level `badges` config.
   */
  readonly rules: readonly BadgeRule[]
  /**
   * The effective status registry (built-in defaults + user overrides).
   */
  readonly registry: readonly Status[]
  /**
   * Show sidebar badges on collapsible group items that are also docs
   * (`sidebar.groupBadges`). Defaults to `false` — suppressed to avoid
   * colliding with the collapse chevron.
   */
  readonly groupBadges: boolean
}

/**
 * The result of a badge pass: the badged entry tree and a flat
 * route→badges map for page-level rendering (e.g. breadcrumbs).
 */
export interface BadgeResult {
  /**
   * The entry tree with `badgeTag` stamped where a sidebar badge applies.
   */
  readonly tree: readonly ResolvedEntry[]
  /**
   * Map of route path → resolved badges, covering every badged entry
   * (including collapsible-doc groups whose sidebar tag is suppressed).
   */
  readonly badgeMap: Record<string, readonly BadgeConfig[]>
}

/**
 * Resolve badges across the tree, stamping sidebar `tag`s and building a
 * route→badges map. Returns a new tree; the input is not mutated.
 *
 * @param entries - Resolved entry tree
 * @param ctx - Glob rules and the resolved status registry
 * @returns The badged tree and the route→badges map
 */
export async function applyBadges(
  entries: readonly ResolvedEntry[],
  ctx: BadgeContext
): Promise<BadgeResult> {
  const results = await Promise.all(entries.map((entry) => applyToEntry(entry, ctx)))
  return {
    tree: results.map((r) => r.tree),
    badgeMap: mergeMaps(results.map((r) => r.badgeMap)),
  }
}

/**
 * Resolve badges for a single entry and recurse into its children.
 *
 * @private
 * @param entry - Entry to stamp
 * @param ctx - Glob rules and the resolved status registry
 * @returns The badged entry (with children) and its subtree's badge map
 */
async function applyToEntry(
  entry: ResolvedEntry,
  ctx: BadgeContext
): Promise<{
  readonly tree: ResolvedEntry
  readonly badgeMap: Record<string, readonly BadgeConfig[]>
}> {
  const badges = await resolveEntryBadges(entry, ctx)
  const badgeTag = encodeBadges(badges)
  const children = await resolveChildren(entry.items, ctx)
  const selfMap = mapField(entry.link, badges)
  return {
    tree: {
      ...entry,
      ...tagField(sidebarTag(entry, badgeTag, ctx.groupBadges)),
      ...itemsField(children.tree),
    },
    badgeMap: { ...selfMap, ...children.badgeMap },
  }
}

/**
 * Decide the sidebar `tag` for an entry: suppressed (undefined) when the
 * entry is a collapsible group that also links to a doc, otherwise the
 * encoded tag.
 *
 * @private
 * @param entry - Entry being stamped
 * @param badgeTag - Encoded tag, or undefined when the entry has no badge
 * @param groupBadges - When true, do not suppress collapsible-doc badges
 * @returns The tag to emit, or undefined to suppress it
 */
function sidebarTag(
  entry: ResolvedEntry,
  badgeTag: string | undefined,
  groupBadges: boolean
): string | undefined {
  if (!groupBadges && isCollapsibleDoc(entry)) {
    return undefined
  }
  return badgeTag
}

/**
 * Whether an entry is a collapsible group that is also a doc — i.e. it has
 * children (renders a collapse toggle) and a link (the toggle row is also
 * a page).
 *
 * @private
 * @param entry - Entry to test
 * @returns True when the entry is a collapsible doc
 */
function isCollapsibleDoc(entry: ResolvedEntry): boolean {
  const hasChildren = entry.items !== undefined && entry.items.length > 0
  return hasChildren && entry.link !== undefined
}

/**
 * Recurse into an entry's children when present.
 *
 * @private
 * @param items - Child entries, if any
 * @param ctx - Glob rules and the resolved status registry
 * @returns Badged children (or undefined) and their merged badge map
 */
async function resolveChildren(
  items: readonly ResolvedEntry[] | undefined,
  ctx: BadgeContext
): Promise<{
  readonly tree: readonly ResolvedEntry[] | undefined
  readonly badgeMap: Record<string, readonly BadgeConfig[]>
}> {
  if (items === undefined) {
    return { tree: undefined, badgeMap: {} }
  }
  const result = await applyBadges(items, ctx)
  return { tree: result.tree, badgeMap: result.badgeMap }
}

/**
 * Merge a list of badge maps into one.
 *
 * @private
 * @param maps - Badge maps to merge
 * @returns A single merged map
 */
function mergeMaps(
  maps: readonly Record<string, readonly BadgeConfig[]>[]
): Record<string, readonly BadgeConfig[]> {
  return Object.assign({}, ...maps)
}

/**
 * Build a single-entry badge map for an entry, omitted when it has no link
 * or no badges.
 *
 * @private
 * @param link - Entry route path, if any
 * @param badges - Resolved badges for the entry
 * @returns `{ [link]: badges }` or an empty object
 */
function mapField(
  link: string | undefined,
  badges: readonly BadgeConfig[]
): Record<string, readonly BadgeConfig[]> {
  if (link === undefined || badges.length === 0) {
    return {}
  }
  return { [link]: badges }
}

/**
 * Resolve the effective badges for an entry by precedence. Each source
 * contributes both its ad-hoc `badge` and its named `status`; the first
 * source that yields any badge wins (file → defaults → glob).
 *
 * @private
 * @param entry - Entry to resolve badges for
 * @param ctx - Glob rules and the resolved status registry
 * @returns Normalized badges (empty when none apply)
 */
async function resolveEntryBadges(
  entry: ResolvedEntry,
  ctx: BadgeContext
): Promise<readonly BadgeConfig[]> {
  const fromFile = await readFileBadges(entry, ctx.registry)
  if (fromFile.length > 0) {
    return fromFile
  }
  const fromDefaults = collectSource(
    readFrontmatterField(entry, 'badge'),
    readFrontmatterField(entry, 'status'),
    ctx.registry
  )
  if (fromDefaults.length > 0) {
    return fromDefaults
  }
  return matchRuleBadges(entry.link, ctx)
}

/**
 * Combine a source's ad-hoc `badge` input and named `status` reference(s)
 * into a flat list of badge chips.
 *
 * @private
 * @param badgeInput - Raw `badge` value from the source
 * @param statusInput - Raw `status` reference from the source
 * @param registry - The resolved status registry
 * @returns Badges from the status refs followed by the ad-hoc badges
 */
function collectSource(
  badgeInput: unknown,
  statusInput: unknown,
  registry: readonly Status[]
): readonly BadgeConfig[] {
  return [...resolveStatusBadges(statusInput, registry), ...normalizeBadgeInput(badgeInput)]
}

/**
 * Read the `badge`/`status` fields from an entry's source file frontmatter
 * (the file's own YAML wins over config `defaults`).
 *
 * @private
 * @param entry - Entry whose source file to read
 * @param registry - The resolved status registry
 * @returns Badges from file frontmatter (empty when absent)
 */
async function readFileBadges(
  entry: ResolvedEntry,
  registry: readonly Status[]
): Promise<readonly BadgeConfig[]> {
  const source = readSource(entry)
  if (source === null) {
    return []
  }
  const [readErr, raw] = await readFileSafe(source)
  if (readErr) {
    return []
  }
  const [parseErr, file] = splitFrontmatter(raw)
  if (parseErr) {
    return []
  }
  return collectSource(file.data.badge, file.data.status, registry)
}

/**
 * Match an entry's route path against glob rules, returning the first
 * matching rule's badges (its `badge` and `status`).
 *
 * @private
 * @param link - Entry route path (e.g. `/api/foo`)
 * @param ctx - Glob rules and the resolved status registry
 * @returns Badges from the first matching rule (empty when none)
 */
function matchRuleBadges(link: string | undefined, ctx: BadgeContext): readonly BadgeConfig[] {
  if (link === undefined) {
    return []
  }
  const rule = ctx.rules.find((r) => patternsOf(r.match).some((p) => matchesRoute(link, p)))
  if (rule === undefined) {
    return []
  }
  return collectSource(rule.badge, rule.status, ctx.registry)
}

/**
 * Test a route path against a single glob pattern.
 *
 * Supported syntax: `*` (any run of non-slash chars), `**` (any run,
 * including slashes), and `?` (a single non-slash char). Patterns are
 * anchored to the full path.
 *
 * @private
 * @param link - Route path to test
 * @param pattern - Glob pattern
 * @returns True when the path matches the pattern
 */
function matchesRoute(link: string, pattern: string): boolean {
  return globToRegExp(pattern).test(link)
}

/**
 * Compile a glob pattern into an anchored regular expression.
 *
 * @private
 * @param pattern - Glob pattern
 * @returns Anchored `RegExp` for the pattern
 */
function globToRegExp(pattern: string): RegExp {
  const escaped = pattern.replaceAll(/[.+^${}()|[\]\\]/g, String.raw`\$&`)
  const body = escaped
    .replaceAll('**', ' ')
    .replaceAll('*', '[^/]*')
    .replaceAll(' ', '.*')
    .replaceAll('?', '[^/]')
  // oxlint-disable-next-line security/detect-non-literal-regexp -- pattern is compiled from trusted config-authored globs, not user input
  return new RegExp(`^${body}$`)
}

/**
 * Read a field from an entry's merged page frontmatter (config `defaults`).
 *
 * @private
 * @param entry - Entry to inspect
 * @param field - Frontmatter field to read (`'badge'` or `'status'`)
 * @returns The raw field value, or `undefined`
 */
function readFrontmatterField(entry: ResolvedEntry, field: 'badge' | 'status'): unknown {
  const { page } = entry
  if (page === undefined) {
    return undefined
  }
  return page.frontmatter[field]
}

/**
 * Get an entry's source file path, if it is backed by one.
 *
 * @private
 * @param entry - Entry to inspect
 * @returns Absolute source path, or `null` for virtual/grouping entries
 */
function readSource(entry: ResolvedEntry): string | null {
  const { page } = entry
  if (page === undefined) {
    return null
  }
  const { source } = page
  if (source === undefined) {
    return null
  }
  return source
}

/**
 * Normalize a rule's `match` into an array of patterns.
 *
 * @private
 * @param match - Single pattern or array of patterns
 * @returns Array of patterns
 */
function patternsOf(match: string | readonly string[]): readonly string[] {
  if (typeof match === 'string') {
    return [match]
  }
  return match
}

/**
 * Build the optional `badgeTag` field, omitted when there is no tag.
 *
 * @private
 * @param badgeTag - Encoded tag or `undefined`
 * @returns `{ badgeTag }` or an empty object
 */
function tagField(badgeTag: string | undefined): { readonly badgeTag?: string } {
  if (badgeTag === undefined) {
    return {}
  }
  return { badgeTag }
}

/**
 * Build the optional `items` field, omitted for leaf entries.
 *
 * @private
 * @param items - Child entries or `undefined`
 * @returns `{ items }` or an empty object
 */
function itemsField(items: readonly ResolvedEntry[] | undefined): {
  items?: readonly ResolvedEntry[]
} {
  if (items === undefined) {
    return {}
  }
  return { items }
}

/**
 * Read a file's contents, returning a Result tuple instead of throwing.
 *
 * @private
 * @param source - Absolute file path
 * @returns `[error, null]` on failure, `[null, contents]` on success
 */
async function readFileSafe(
  source: string
): Promise<readonly [Error, null] | readonly [null, string]> {
  try {
    const contents = await fs.promises.readFile(source, 'utf8')
    return [null, contents]
  } catch (error) {
    if (error instanceof Error) {
      return [error, null]
    }
    return [new Error(String(error)), null]
  }
}
