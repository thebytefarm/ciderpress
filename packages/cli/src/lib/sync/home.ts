import fs from 'node:fs/promises'
import path from 'node:path'

import {
  collectAllWorkspaceItems,
  hasGlobChars,
  resolveOptionalIcon,
  serializeIcon,
} from '@ciderpress/config'
import type {
  Feature,
  HomeBlock,
  HomeConfig,
  HomeShowcaseBlock,
  HomeTabItem,
  Page,
  SerializedIcon,
  Workspace,
  CiderpressConfig,
} from '@ciderpress/config'
import { match, P } from 'massaman/match'
import { isNotNil, isString } from 'massaman/predicate'

import { parse as parseFrontmatter, stringify as stringifyFrontmatter } from './frontmatter.ts'
import { resolveSectionTitle } from './resolve/text.ts'

/**
 * Framework default home deck, used when `home.blocks` is omitted: an
 * auto-generated features grid (derived from the first top-level pages)
 * plus the workspace showcase.
 */
const defaultHomeBlocks: readonly HomeBlock[] = Object.freeze([
  { type: 'features' },
  { type: 'showcase' },
] as const)

/**
 * Serializable workspace card data for a single item.
 */
export interface HomeWorkspaceCardData {
  readonly title: string
  readonly href: string
  readonly icon: SerializedIcon | undefined
  readonly scope: string | undefined
  readonly description: string | undefined
  readonly tags: readonly string[]
  readonly badge: { readonly src: string; readonly alt: string } | undefined
}

/**
 * A group of workspace cards (apps, packages, or custom).
 */
export interface HomeWorkspaceGroupData {
  readonly type: 'apps' | 'packages' | 'workspaces'
  readonly heading: string
  readonly description: string
  readonly cards: readonly HomeWorkspaceCardData[]
}

/**
 * All workspace groups for the home page.
 */
export type HomeWorkspaceData = readonly HomeWorkspaceGroupData[]

/**
 * Result of generating the default home page.
 *
 * Workspace data is not carried here — `sync()` builds it directly from
 * {@link buildWorkspaceData} for `.generated/workspaces.json`, and
 * returning a second copy meant every sync walked apps, packages, and
 * workspace groups twice to produce a field nothing read.
 */
export interface HomePageResult {
  readonly content: string
  /**
   * Non-fatal problems found while compiling `home.blocks` — e.g. a
   * `showcase.source` path that matches no page. The caller surfaces
   * these; the sync itself still completes.
   */
  readonly warnings: readonly string[]
}

/**
 * Sensible fallback descriptions for common section names.
 * Used when no frontmatter description is available.
 */
const DEFAULT_SECTION_DESCRIPTIONS: Readonly<Record<string, string>> = {
  guides: 'Step-by-step walkthroughs covering setup, workflows, and common tasks.',
  guide: 'Step-by-step walkthroughs covering setup, workflows, and common tasks.',
  standards: 'Code style, naming conventions, and engineering best practices for the team.',
  standard: 'Code style, naming conventions, and engineering best practices for the team.',
  security: 'Authentication, authorization, secrets management, and vulnerability policies.',
  architecture: 'System design, service boundaries, data flow, and infrastructure decisions.',
  'getting started': 'Everything you need to set up your environment and start contributing.',
  introduction: 'Project overview, goals, and how the pieces fit together.',
  overview: 'High-level summary of the platform, key concepts, and navigation.',
  'api reference': 'Endpoint contracts, request/response schemas, and usage examples.',
  api: 'Endpoint contracts, request/response schemas, and usage examples.',
  testing: 'Test strategy, tooling, coverage targets, and how to run the suite.',
  deployment: 'Build pipelines, release process, and environment configuration.',
  contributing: 'How to propose changes, open PRs, and follow the development workflow.',
  troubleshooting: 'Common issues, error explanations, and debugging techniques.',
  configuration: 'Available settings, environment variables, and how to customize behavior.',
  reference: 'Detailed technical reference covering APIs, types, and configuration options.',
}

/**
 * Generate a default Rspress home page from config metadata.
 *
 * Produces `pageType: home` frontmatter with hero derived from config
 * `title`/`description` and `features:` array from top-level sections.
 * Workspace data is serialized separately for `.generated/workspaces.json`.
 *
 * @param config - ciderpress config
 * @param repoRoot - Absolute path to repo root (for resolving source files)
 * @returns Home page content and workspace data
 */
export async function generateDefaultHomePage(
  config: CiderpressConfig,
  repoRoot: string
): Promise<HomePageResult> {
  const title = config.title ?? 'Documentation'
  const description = config.description ?? title
  const firstLink = findFirstLink(config.pages)
  const home = config.home

  // Landing-page extensions live on the typed `HomeConfig` now — no more
  // `Record<string, unknown>` casts. Destructure with a defaulted empty
  // object so optional fields surface as `undefined` cleanly.
  const { hero } = home ?? {}
  const { label, tagline, actions: heroActions, demo: heroDemo } = hero ?? {}
  const { banner: brandBanner } = config.brand ?? {}
  // `BannerConfig` is `string | BannerFn`, so this stays a `P.string`
  // guard rather than a `??` default — a function banner must fall back to
  // the static path, not be serialized into the frontmatter.
  const bannerSrc = match(brandBanner)
    .with(P.string, (s) => s)
    .otherwise(() => '/banner.svg')

  const defaultActions = [{ variant: 'primary', text: 'Get Started', href: firstLink }]
  const heroConfig: Record<string, unknown> = {
    name: title,
    text: description,
    ...match(label)
      .with(P.nonNullable, (e) => ({ eyebrow: e }))
      .otherwise(() => ({})),
    ...match(tagline)
      .with(P.nonNullable, (t) => ({ tagline: t }))
      .otherwise(() => ({})),
    actions: match(heroActions)
      .with(P.nonNullable, (a) => a)
      .otherwise(() => defaultActions),
    image: {
      src: bannerSrc,
      alt: title,
    },
  }

  // Landing bands compile to an ordered `blocks` array. `heroDemo` still
  // rides along on the hero config verbatim — the HomeLayout resolves its
  // code/image/terminal variant at render time.
  const blockResult = await buildHomeBlocks({
    home,
    pages: config.pages,
    workspaces: collectAllWorkspaceItems(config),
    scopes: buildWorkspaceScopes(config),
    repoRoot,
  })

  const frontmatterData: Record<string, unknown> = {
    pageType: 'home',
    hero: heroConfig,
    ...match(heroDemo)
      .with(P.nonNullable, (h) => ({ heroDemo: h }))
      .otherwise(() => ({})),
    ...match(blockResult.blocks.length > 0)
      .with(true, () => ({ blocks: blockResult.blocks }))
      .otherwise(() => ({})),
  }

  const content = stringifyFrontmatter('', frontmatterData)

  return { content, warnings: blockResult.warnings }
}

/**
 * Parameters for {@link buildHomeBlocks}.
 *
 * @private
 */
interface BuildHomeBlocksParams {
  readonly home: HomeConfig | undefined
  readonly pages: readonly Page[]
  readonly workspaces: readonly Workspace[]
  readonly scopes: ReadonlyMap<string, string>
  readonly repoRoot: string
}

/**
 * Compiled blocks plus any non-fatal problems found along the way.
 *
 * @private
 */
interface BuildHomeBlocksResult {
  readonly blocks: readonly Record<string, unknown>[]
  readonly warnings: readonly string[]
}

/**
 * Resolve `home.blocks` into serializable frontmatter blocks, falling back
 * to the framework default deck when none are configured. `features` and
 * `showcase` blocks resolve card data (icons, descriptions); every other
 * block is plain data passed through verbatim.
 *
 * @private
 * @param params - Home config, pages, and repo root
 * @returns Ordered, frontmatter-ready block objects plus warnings
 */
async function buildHomeBlocks(params: BuildHomeBlocksParams): Promise<BuildHomeBlocksResult> {
  const { home, pages, workspaces, scopes, repoRoot } = params
  const { blocks } = home ?? {}
  const blockList = blocks ?? defaultHomeBlocks
  const resolved = await Promise.all(
    blockList.map((block) => resolveHomeBlock({ block, pages, workspaces, scopes, repoRoot }))
  )
  return {
    blocks: resolved.map((r) => r.block).filter(isNotNil),
    warnings: resolved.flatMap((r) => r.warnings),
  }
}

/**
 * Parameters for {@link resolveHomeBlock}.
 *
 * @private
 */
interface ResolveHomeBlockParams {
  readonly block: HomeBlock
  readonly pages: readonly Page[]
  readonly workspaces: readonly Workspace[]
  readonly scopes: ReadonlyMap<string, string>
  readonly repoRoot: string
}

/**
 * A single compiled block plus any warnings it produced.
 *
 * @private
 */
interface ResolveHomeBlockResult {
  /**
   * The frontmatter-ready block, or null when it could not be compiled and
   * should not reach the page.
   */
  readonly block: Record<string, unknown> | null
  readonly warnings: readonly string[]
}

/**
 * Resolve a single home block into a serializable frontmatter object.
 *
 * - `features` — resolves cards (explicit `items` or auto-derived from
 *   the first pages) and serializes their icons
 * - `showcase` — resolves an explicit `source` path list into cards; the
 *   default `'workspaces'` source is rendered from `workspaces.json`
 * - everything else is plain data and passes through unchanged
 *
 * @private
 * @param params - The block plus pages/repo root for card resolution
 * @returns Frontmatter-ready block object and warnings
 */
async function resolveHomeBlock(params: ResolveHomeBlockParams): Promise<ResolveHomeBlockResult> {
  const { block, pages, workspaces, scopes, repoRoot } = params
  return (
    match(block)
      .with({ type: 'features' }, async (b) => {
        const features = await match(b.items)
          .with(P.nonNullable, buildExplicitFeatures)
          .otherwise(() => buildFeatures(pages, repoRoot))
        return {
          block: { ...b, items: buildFrontmatterFeatures(features) },
          warnings: [],
        }
      })
      .with({ type: 'showcase' }, (b) =>
        resolveShowcaseBlock({ block: b, pages, workspaces, scopes, repoRoot })
      )
      .with({ type: 'tabs' }, (b) =>
        Promise.resolve({
          block: { ...b, items: b.items.map(resolveTabItem) },
          warnings: [],
        })
      )
      .with({ type: P.union('proof', 'split', 'cta') }, (b) =>
        Promise.resolve({ block: { ...b }, warnings: [] })
      )
      // Anything else is a block type this CLI does not know. Dropping it
      // with a warning keeps the writer and the theme in agreement: the
      // renderer has no arm for it either, and forwarding it verbatim used
      // to put an unrenderable block into frontmatter with no signal.
      .otherwise((b) =>
        Promise.resolve({
          block: null,
          warnings: [
            `home block type "${String((b as { type?: unknown }).type)}" is not recognized — block skipped`,
          ],
        })
      )
  )
}

/**
 * Resolve a single tab entry for frontmatter. Only the icon needs work —
 * it is serialized to its Iconify form like feature-card icons; every
 * other field is plain data and passes through verbatim.
 *
 * @private
 * @param item - Tab entry from `home.blocks[].items`
 * @returns Frontmatter-ready tab entry
 */
function resolveTabItem(item: HomeTabItem): Record<string, unknown> {
  const { icon, ...rest } = item
  const serialized = serializeIcon(resolveOptionalIcon(icon))
  return {
    ...rest,
    ...match(serialized)
      .with(P.nonNullable, (i) => ({ icon: i }))
      .otherwise(() => ({})),
  }
}

/**
 * Parameters for {@link resolveShowcaseBlock}.
 *
 * @private
 */
interface ResolveShowcaseBlockParams {
  readonly block: HomeShowcaseBlock
  readonly pages: readonly Page[]
  readonly workspaces: readonly Workspace[]
  readonly scopes: ReadonlyMap<string, string>
  readonly repoRoot: string
}

/**
 * Resolve a `showcase` block. An explicit `source` path list compiles to
 * a `cards` array rendered as one ungrouped grid; the default
 * `'workspaces'` source carries no cards and the theme falls back to the
 * grouped workspace data serialized into `.generated/workspaces.json`.
 *
 * Each path is matched against workspace items (apps, packages, and
 * workspace groups) first, then the page tree. Paths that match neither
 * are skipped with a warning rather than failing the sync.
 *
 * @private
 * @param params - The showcase block plus pages/workspaces/repo root
 * @returns Frontmatter-ready block object and warnings
 */
async function resolveShowcaseBlock(
  params: ResolveShowcaseBlockParams
): Promise<ResolveHomeBlockResult> {
  const { block, pages, workspaces, scopes, repoRoot } = params
  const paths = match(block.source)
    .with(P.array(P.string), (s) => s)
    .otherwise(() => null)
  if (paths === null) {
    // Strip `source` on this branch too — the theme has no `source` key and
    // leaving it in only adds noise to a generated, diffed file.
    const { source: _unused, ...rest } = block
    return { block: { ...rest }, warnings: [] }
  }

  const resolved = await Promise.all(
    paths.map(async (targetPath) => {
      const workspace = workspaces.find((item) => item.path === targetPath)
      if (workspace) {
        return { card: buildWorkspaceCard({ workspace, scopes }), warning: null }
      }
      const page = findPageByPath([...pages, ...workspacePages(workspaces)], targetPath)
      if (page === undefined) {
        return {
          card: null,
          warning: `home showcase source path "${targetPath}" matches no page or workspace — card skipped`,
        }
      }
      return { card: await buildPageCard(page, repoRoot), warning: null }
    })
  )

  const { source: _source, ...rest } = block
  return {
    block: { ...rest, cards: resolved.map((r) => r.card).filter(isNotNil) },
    warnings: resolved.map((r) => r.warning).filter(isNotNil),
  }
}

/**
 * Parameters for {@link buildWorkspaceCard}.
 *
 * @private
 */
interface BuildWorkspaceCardParams {
  readonly workspace: Workspace
  readonly scopes: ReadonlyMap<string, string>
}

/**
 * Build a showcase card from a workspace item. Workspace entries already
 * carry every card field, so nothing needs resolving from disk.
 *
 * The scope chip is looked up rather than left blank: the same app reached
 * through the default deck renders an `apps/` chip, and hardcoding
 * `undefined` here made an explicit `showcase.source` drop it, so one
 * workspace rendered two different ways depending on how it was reached.
 *
 * @private
 * @param params - Workspace item to render, and the path-to-scope lookup
 * @returns Serializable card data
 */
function buildWorkspaceCard({
  workspace,
  scopes,
}: BuildWorkspaceCardParams): HomeWorkspaceCardData {
  return {
    title: match(workspace.title)
      .with(P.string, (t) => t)
      .otherwise(String),
    href: workspace.path,
    icon: serializeIcon(resolveOptionalIcon(workspace.icon)),
    scope: scopes.get(workspace.path),
    description: workspace.description,
    tags: resolveTagLabels(workspace.tags),
    badge: workspace.badge,
  }
}

/**
 * Map each app/package path to the scope chip the default deck gives it.
 * Custom workspace groups carry no scope, so they are absent from the map.
 *
 * @private
 * @param config - Ciderpress config with apps and packages
 * @returns Lookup from workspace path to scope label
 */
function buildWorkspaceScopes(config: CiderpressConfig): ReadonlyMap<string, string> {
  return new Map([
    ...(config.apps ?? []).map((app) => [app.path, 'apps/'] as const),
    ...(config.packages ?? []).map((pkg) => [pkg.path, 'packages/'] as const),
  ])
}

/**
 * Collect the child pages declared on workspace items. A showcase
 * `source` may point at a page nested under a workspace (e.g.
 * `/apps/api/guides`), which never appears in the top-level page tree.
 *
 * @private
 * @param workspaces - All workspace items (apps, packages, groups)
 * @returns Every explicitly declared workspace child page
 */
function workspacePages(workspaces: readonly Workspace[]): readonly Page[] {
  return workspaces.flatMap((workspace) => workspace.pages ?? [])
}

/**
 * Find a page anywhere in the page tree by its configured `path`.
 *
 * @private
 * @param pages - Pages to search, including nested children
 * @param targetPath - Configured page path (e.g. `/products/cli`)
 * @returns The matching page, or undefined
 */
function findPageByPath(pages: readonly Page[], targetPath: string): Page | undefined {
  const direct = pages.find((page) => page.path === targetPath)
  if (direct) {
    return direct
  }
  return pages.reduce<Page | undefined>((found, page) => {
    if (found) {
      return found
    }
    if (!page.pages) {
      return undefined
    }
    return findPageByPath(page.pages, targetPath)
  }, undefined)
}

/**
 * Build a showcase card from a config page. `page.card` overrides win
 * over the page's own metadata, mirroring how workspace cards resolve.
 *
 * @private
 * @param page - Page to render as a card
 * @param repoRoot - Absolute path to repo root, for frontmatter lookups
 * @returns Serializable card data
 */
async function buildPageCard(page: Page, repoRoot: string): Promise<HomeWorkspaceCardData> {
  const card = page.card
  const cardIcon = match(card)
    .with(P.nonNullable, (c) => c.icon)
    .otherwise(() => undefined)
  const icon = match(cardIcon)
    .with(P.nonNullable, (i) => i)
    .otherwise(() => page.icon)
  const cardDescription = match(card)
    .with(P.nonNullable, (c) => c.description)
    .otherwise(() => undefined)
  const description = await match(cardDescription)
    .with(P.string, (d) => Promise.resolve(d))
    .otherwise(() => extractSectionDescription(page, repoRoot))

  return {
    title: resolveSectionTitle(page),
    href: page.path ?? '/',
    icon: serializeIcon(resolveOptionalIcon(icon)),
    scope: match(card)
      .with(P.nonNullable, (c) => c.scope)
      .otherwise(() => undefined),
    description,
    tags: match(card)
      .with(P.nonNullable, (c) => resolveTagLabels(c.tags))
      .otherwise(() => []),
    badge: match(card)
      .with(P.nonNullable, (c) => c.badge)
      .otherwise(() => undefined),
  }
}

/**
 * Build serializable workspace data from config apps/packages/workspaces.
 * Returns typed group data for the home page.
 *
 * @param config - Ciderpress config with apps, packages, and workspace groups
 * @returns Workspace data result containing all groups
 */
export function buildWorkspaceData(config: CiderpressConfig): WorkspaceDataResult {
  const apps = config.apps ?? []
  const packages = config.packages ?? []
  const workspaceGroups = config.workspaces ?? []

  const hasWorkspaceItems = apps.length > 0 || packages.length > 0 || workspaceGroups.length > 0

  if (!hasWorkspaceItems) {
    return { data: [] }
  }

  const appsResult = match(apps.length > 0)
    .with(true, () =>
      buildGroupData({
        type: 'apps',
        heading: 'Apps',
        description:
          'Standalone applications and runnable services — APIs, workers, web apps, and anything that deploys independently.',
        items: apps,
        scopePrefix: 'apps/',
      })
    )
    .otherwise(() => null)

  const packagesResult = match(packages.length > 0)
    .with(true, () =>
      buildGroupData({
        type: 'packages',
        heading: 'Packages',
        description:
          'Reusable modules shared across the codebase — libraries, utilities, configs, SDKs, and internal tooling.',
        items: packages,
        scopePrefix: 'packages/',
      })
    )
    .otherwise(() => null)

  const groupResults = workspaceGroups.map((g) => {
    const titleStr = match(g.title)
      .with(P.string, (t) => t)
      .otherwise(String)
    const descStr = g.description ?? ''
    return buildGroupData({
      type: 'workspaces',
      heading: titleStr,
      description: descStr,
      items: g.items,
      scopePrefix: '',
    })
  })

  const allResults = [appsResult, packagesResult, ...groupResults].filter(
    (r): r is GroupDataResult => r !== null
  )

  return {
    data: allResults.map((r) => r.group),
  }
}

/**
 * Internal result wrapper returned by `buildWorkspaceData`.
 *
 * @private
 */
interface WorkspaceDataResult {
  readonly data: HomeWorkspaceData
}

/**
 * Internal result wrapper returned by `buildGroupData`.
 *
 * @private
 */
interface GroupDataResult {
  readonly group: HomeWorkspaceGroupData
}

/**
 * Resolved feature data used internally before serializing to frontmatter.
 *
 * @private
 */
interface ResolvedFeature {
  readonly title: string
  readonly details: string
  readonly link: string | undefined
  readonly icon: SerializedIcon | null
}

/**
 * Frontmatter-serializable feature shape for YAML output.
 *
 * @private
 */
interface FrontmatterFeature {
  readonly title: string
  readonly details: string
  readonly link?: string
  readonly icon?: SerializedIcon
}

/**
 * Convert resolved features into frontmatter-serializable objects.
 * Icon identifiers are stored as Iconify strings for YAML serialization.
 *
 * @private
 * @param features - Resolved feature data
 * @returns Frontmatter-compatible feature objects
 */
function buildFrontmatterFeatures(
  features: readonly ResolvedFeature[]
): readonly FrontmatterFeature[] {
  return features.map((f) => ({
    title: f.title,
    details: f.details,
    ...match(f.link)
      .with(P.nonNullable, (l) => ({ link: l }))
      .otherwise(() => ({})),
    ...match(f.icon)
      .with(P.nonNullable, (ic) => ({ icon: ic }))
      .otherwise(() => ({})),
  }))
}

/**
 * Convert explicit user-defined features into resolved features.
 *
 * @private
 * @param features - User-defined feature config entries
 * @returns Resolved feature data with icon identifiers
 */
function buildExplicitFeatures(features: readonly Feature[]): Promise<readonly ResolvedFeature[]> {
  return Promise.resolve(
    features.map((f) => {
      const resolved = resolveOptionalIcon(f.icon)
      const titleStr = match(f.title)
        .with(P.string, (t) => t)
        .otherwise(String)
      const descStr = f.description ?? ''
      return {
        title: titleStr,
        details: descStr,
        link: f.link,
        icon: serializeIcon(resolved) ?? null,
      }
    })
  )
}

/**
 * Parameters for building a single workspace group.
 *
 * @private
 */
interface BuildGroupDataParams {
  readonly type: 'apps' | 'packages' | 'workspaces'
  readonly heading: string
  readonly description: string
  readonly items: readonly Workspace[]
  readonly scopePrefix: string
}

/**
 * Build a single workspace group with card data.
 *
 * @private
 * @param params - Group configuration
 * @returns Group data result containing the workspace group
 */
function buildGroupData(params: BuildGroupDataParams): GroupDataResult {
  const { type, heading, description, items, scopePrefix } = params
  const cards: readonly HomeWorkspaceCardData[] = items.map((item) => {
    const resolved = resolveOptionalIcon(item.icon)
    const titleStr = match(item.title)
      .with(P.string, (t) => t)
      .otherwise(String)
    return {
      title: titleStr,
      href: item.path,
      icon: serializeIcon(resolved),
      scope: resolveScope(scopePrefix),
      description: item.description,
      tags: resolveTagLabels(item.tags),
      badge: item.badge,
    }
  })

  return {
    group: { type, heading, description, cards },
  }
}

/**
 * Find the first navigable link from the pages array.
 *
 * @private
 * @param pages - Config pages to search
 * @returns First available link path, or '/' as fallback
 */
function findFirstLink(pages: readonly Page[]): string {
  const [first] = pages
  if (!first) {
    return '/'
  }
  return first.path ?? '/'
}

/**
 * Build resolved feature data from the first 3 config pages, with
 * Iconify identifiers.
 *
 * @private
 * @param pages - Config pages to derive features from
 * @param repoRoot - Absolute path to repo root for resolving source files
 * @returns Resolved feature data for up to 3 pages
 */
function buildFeatures(
  pages: readonly Page[],
  repoRoot: string
): Promise<readonly ResolvedFeature[]> {
  return Promise.all(
    pages.slice(0, 3).map(async (section) => {
      const link = section.path ?? findFirstChildLink(section)
      const details = await extractSectionDescription(section, repoRoot)
      const resolved = resolveOptionalIcon(section.icon)
      const icon = serializeIcon(resolved) ?? null
      const titleStr = resolveSectionTitle(section)
      return { title: titleStr, details, link, icon }
    })
  )
}

/**
 * Recursively find the first child link in a page's children.
 *
 * @private
 * @param section - Page to search for child links
 * @returns First child link path, or undefined if none found
 */
function findFirstChildLink(section: Page): string | undefined {
  if (!section.pages) {
    return undefined
  }
  const first = section.pages.find((item) => item.path)
  if (first) {
    return first.path
  }
  const nested = section.pages.find((item) => findFirstChildLink(item))
  if (nested) {
    return findFirstChildLink(nested)
  }
  return undefined
}

/**
 * Extract a description for a config page.
 *
 * Priority: source file frontmatter -> config defaults -> well-known defaults -> page title.
 *
 * @private
 * @param section - Page to extract description from
 * @param repoRoot - Absolute path to repo root for resolving source files
 * @returns Description string for the page
 */
async function extractSectionDescription(section: Page, repoRoot: string): Promise<string> {
  if (isString(section.include) && !hasGlobChars(section.include)) {
    const description = await readFrontmatterDescription(path.resolve(repoRoot, section.include))
    if (description) {
      return description
    }
  }

  if (isNotNil(section.defaults) && section.defaults.description) {
    return String(section.defaults.description)
  }

  const titleStr = resolveSectionTitle(section)
  const knownDesc = DEFAULT_SECTION_DESCRIPTIONS[titleStr.toLowerCase()]
  if (knownDesc) {
    return knownDesc
  }

  return titleStr
}

/**
 * Read the `description` field from a markdown file's frontmatter.
 *
 * @private
 * @param filePath - Absolute path to the markdown file
 * @returns Description string if found, or undefined
 */
async function readFrontmatterDescription(filePath: string): Promise<string | undefined> {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    const { data } = parseFrontmatter(raw)
    return (
      match(data.description)
        .with(P.nonNullable, String)
        // oxlint-disable-next-line unicorn/no-useless-undefined -- explicit return for Result-style consistency
        .otherwise(() => undefined)
    )
  } catch {
    return undefined
  }
}

/**
 * Pass through raw tag strings. UI layer handles label resolution via TechTag.
 *
 * @private
 * @param tags - Optional array of tag strings
 * @returns Array of tag strings, or empty array if undefined
 */
function resolveTagLabels(tags: readonly string[] | undefined): readonly string[] {
  if (!tags) {
    return []
  }
  return [...tags]
}

/**
 * Resolve a scope prefix string to a display value.
 *
 * @private
 * @param scopePrefix - Scope prefix string
 * @returns Scope string if non-empty, or undefined
 */
function resolveScope(scopePrefix: string): string | undefined {
  if (scopePrefix.length > 0) {
    return scopePrefix
  }
  return undefined
}
