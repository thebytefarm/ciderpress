import fs from 'node:fs/promises'
import path from 'node:path'

import { hasGlobChars, resolveOptionalIcon, serializeIcon } from '@ciderpress/config'
import type {
  Feature,
  HomeBlock,
  HomeConfig,
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
 * Contains the markdown content and workspace data.
 */
export interface HomePageResult {
  readonly content: string
  readonly workspaces: HomeWorkspaceData
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
  const hero = match(home)
    .with(P.nonNullable, (h) => h.hero)
    .otherwise(() => undefined)
  const workspaceResult = buildWorkspaceData(config)

  // Landing-page extensions live on the typed `HomeConfig` now — no more
  // `Record<string, unknown>` casts. Destructure with a defaulted empty
  // object so optional fields surface as `undefined` cleanly.
  const label = match(hero)
    .with(P.nonNullable, (h) => h.label)
    .otherwise(() => undefined)
  const tagline = match(hero)
    .with(P.nonNullable, (h) => h.tagline)
    .otherwise(() => undefined)
  const heroActions = match(hero)
    .with(P.nonNullable, (h) => h.actions)
    .otherwise(() => undefined)
  const heroDemo = match(hero)
    .with(P.nonNullable, (h) => h.demo)
    .otherwise(() => undefined)
  const brandBanner = match(config.brand)
    .with(P.nonNullable, (b) => b.banner)
    .otherwise(() => undefined)
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
  // image/terminal variant at render time.
  const blocks = await buildHomeBlocks({ home, pages: config.pages, repoRoot })

  const frontmatterData: Record<string, unknown> = {
    pageType: 'home',
    hero: heroConfig,
    ...match(heroDemo)
      .with(P.nonNullable, (h) => ({ heroDemo: h }))
      .otherwise(() => ({})),
    ...match(blocks.length > 0)
      .with(true, () => ({ blocks }))
      .otherwise(() => ({})),
  }

  const content = stringifyFrontmatter('', frontmatterData)

  return { content, workspaces: workspaceResult.data }
}

/**
 * Framework default home deck, synthesized when `home.blocks` is omitted:
 * an auto-generated features grid (derived from the first pages) plus the
 * workspace showcase. Mirrors the pre-blocks default landing surface.
 *
 * @private
 */
const DEFAULT_HOME_BLOCKS: readonly HomeBlock[] = [{ type: 'features' }, { type: 'showcase' }]

/**
 * Parameters for {@link buildHomeBlocks}.
 *
 * @private
 */
interface BuildHomeBlocksParams {
  readonly home: HomeConfig | undefined
  readonly pages: readonly Page[]
  readonly repoRoot: string
}

/**
 * Resolve `home.blocks` into serializable frontmatter blocks, falling back
 * to the framework default deck when none are configured. Only `features`
 * blocks need async resolution (card + icon serialization); every other
 * block is plain data passed through verbatim.
 *
 * @private
 * @param params - Home config, pages, and repo root
 * @returns Ordered, frontmatter-ready block objects
 */
async function buildHomeBlocks(
  params: BuildHomeBlocksParams
): Promise<readonly Record<string, unknown>[]> {
  const { home, pages, repoRoot } = params
  const configured = match(home)
    .with(P.nonNullable, (h) => h.blocks)
    .otherwise(() => undefined)
  const blockList = match(configured)
    .with(P.nonNullable, (b) => b)
    .otherwise(() => DEFAULT_HOME_BLOCKS)
  return Promise.all(blockList.map((block) => resolveHomeBlock({ block, pages, repoRoot })))
}

/**
 * Parameters for {@link resolveHomeBlock}.
 *
 * @private
 */
interface ResolveHomeBlockParams {
  readonly block: HomeBlock
  readonly pages: readonly Page[]
  readonly repoRoot: string
}

/**
 * Resolve a single home block into a serializable frontmatter object.
 * `features` blocks resolve their cards (explicit `items` or auto-derived
 * from pages) and serialize icons; all other block types are already
 * plain data and pass through unchanged.
 *
 * @private
 * @param params - The block plus pages/repo root for feature resolution
 * @returns Frontmatter-ready block object
 */
async function resolveHomeBlock(params: ResolveHomeBlockParams): Promise<Record<string, unknown>> {
  const { block, pages, repoRoot } = params
  if (block.type !== 'features') {
    return { ...block }
  }
  const features = await match(block.items)
    .with(P.nonNullable, buildExplicitFeatures)
    .otherwise(() => buildFeatures(pages, repoRoot))
  const frontmatterFeatures = buildFrontmatterFeatures(features)
  return {
    type: 'features',
    items: frontmatterFeatures,
    ...match(block.heading)
      .with(P.nonNullable, (h) => ({ heading: h }))
      .otherwise(() => ({})),
    ...match(block.columns)
      .with(P.nonNullable, (c) => ({ columns: c }))
      .otherwise(() => ({})),
    ...match(block.truncate)
      .with(P.nonNullable, (t) => ({ truncate: t }))
      .otherwise(() => ({})),
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
 * Icon colors are cycled in the same way as auto-generated features.
 *
 * @private
 * @param features - User-defined feature config entries
 * @returns Resolved feature data with icon identifiers and colors
 */
function buildExplicitFeatures(features: readonly Feature[]): Promise<readonly ResolvedFeature[]> {
  return Promise.resolve(
    features.map((f, _index) => {
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
 * Build resolved feature data from the first 3 config pages
 * with Iconify identifiers and cycled icon colors.
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
    pages.slice(0, 3).map(async (section, _index) => {
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
