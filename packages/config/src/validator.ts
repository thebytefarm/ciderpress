import { isBuiltInTheme, THEME_NAMES } from '@ciderpress/theme'
import { uniqBy } from 'massaman/array'
import { match, P } from 'massaman/match'
import { either, isNotNil, isString } from 'massaman/predicate'

import { configError, configErrorFromZod } from './errors.ts'
import type { ConfigError, ConfigResult } from './errors.ts'
import { hasAnyGlobInclude, isSingleFileInclude } from './glob.ts'
import { ciderpressConfigSchema } from './schema.ts'
import type {
  CiderpressConfig,
  Feature,
  IconConfig,
  OpenAPISpec,
  Page,
  ThemeColors,
  ThemeEntry,
  ThemeSettings,
  Workspace,
  WorkspaceGroup,
} from './types.ts'
import { collectAllWorkspaceItems } from './workspace.ts'

/**
 * Validate a ciderpress config — Zod schema parse followed by semantic checks.
 *
 * 1. Schema parse via Zod (shape, types, required fields).
 * 2. Cross-field semantic validation (workspace path uniqueness, OpenAPI
 *    nesting, include/path coupling, landing/island requirements, icon
 *    identifier format, theme name validity).
 *
 * @param config - Raw config object to validate (typically loaded from `ciderpress.config.ts`)
 * @returns `ConfigResult` tuple — `[null, config]` on success or `[ConfigError, null]` on failure
 */
export function validateConfig(config: unknown): ConfigResult<CiderpressConfig> {
  const parsed = ciderpressConfigSchema.safeParse(config)
  if (!parsed.success) {
    return [configErrorFromZod(parsed.error), null]
  }

  const validated = parsed.data as CiderpressConfig
  const [semanticErr] = validateSemantics(validated)
  if (semanticErr) {
    return [semanticErr, null]
  }

  return [null, validated]
}

/**
 * Run all semantic checks across the parsed config.
 *
 * @private
 * @param config - Schema-validated config
 * @returns First semantic error encountered, or success
 */
function validateSemantics(config: CiderpressConfig): ConfigResult<true> {
  if (!config.pages || config.pages.length === 0) {
    return [configError('empty_sections', 'config.pages must have at least one entry'), null]
  }

  const [appsErr] = validateWorkspaces(config.apps ?? [])
  if (appsErr) {
    return [appsErr, null]
  }

  const [pkgsErr] = validateWorkspaces(config.packages ?? [])
  if (pkgsErr) {
    return [pkgsErr, null]
  }

  const [groupErr] = validateWorkspaceGroups(config.workspaces ?? [])
  if (groupErr) {
    return [groupErr, null]
  }

  const allWorkspaceItems = collectAllWorkspaceItems(config)
  const [wsErr] = validateWorkspaces(allWorkspaceItems)
  if (wsErr) {
    return [wsErr, null]
  }

  const [openapiErr] = validateAllOpenAPI(config.pages, allWorkspaceItems)
  if (openapiErr) {
    return [openapiErr, null]
  }

  const pageErrors = firstErrorOf(config.pages, (page) => {
    const [pageErr] = validatePage(page)
    return pageErr
  })

  if (pageErrors) {
    return [pageErrors, null]
  }

  const [placementErr] = validateTopLevelPlacement(config.pages)
  if (placementErr) {
    return [placementErr, null]
  }

  const featureItems = readFeatureItems(config)
  const [featErr] = validateFeatures(featureItems)
  if (featErr) {
    return [featErr, null]
  }

  const [themeErr] = validateTheme(config.theme)
  if (themeErr) {
    return [themeErr, null]
  }

  return [null, true]
}

/**
 * Read the feature items from the new home.features.items position.
 *
 * @private
 */
function readFeatureItems(config: CiderpressConfig): readonly Feature[] | undefined {
  const home = config.home
  if (home === undefined) {
    return undefined
  }
  const features = home.features
  if (features === undefined) {
    return undefined
  }
  return features.items
}

/**
 * Check if include contains a recursive glob pattern ('**').
 *
 * @private
 */
function includeHasRecursive(include: Page['include']): boolean {
  if (include === null || include === undefined) {
    return false
  }
  if (isString(include)) {
    return include.includes('**')
  }
  return include.some((p: string) => p.includes('**'))
}

/**
 * Validate workspaces have required fields and no duplicate paths.
 *
 * Split into two passes:
 *   1. Per-item shape check (`firstErrorOf` + `validateWorkspaceItem`) for
 *      `title`, `description`, `path`, and `icon` fields.
 *   2. Path-uniqueness check via `uniqBy` — if `uniqBy(items, w => w.path)`
 *      shortens the list, at least one duplicate exists; locate the first
 *      and report it.
 *
 * @private
 */
function validateWorkspaces(items: readonly Workspace[]): ConfigResult<true> {
  const shapeError = firstErrorOf(items, validateWorkspaceItem)
  if (shapeError) {
    return [shapeError, null]
  }

  const uniquePaths = uniqBy(items, (w) => w.path)
  if (uniquePaths.length === items.length) {
    return [null, true]
  }

  const duplicate = findFirstDuplicateByPath(items)
  if (duplicate === null) {
    return [null, true]
  }
  return [
    configError(
      'duplicate_prefix',
      `Workspace "${stringifyTitle(duplicate.title)}": duplicate path "${duplicate.path}"`
    ),
    null,
  ]
}

/**
 * Per-item shape check for a single `Workspace`.
 *
 * @private
 */
function validateWorkspaceItem(item: Workspace): ConfigError | null {
  const titleStr = stringifyTitle(item.title)
  if (!item.title) {
    return configError('missing_field', 'Workspace: "title" is required')
  }
  if (!item.description) {
    return configError('missing_field', `Workspace "${titleStr}": "description" is required`)
  }
  if (!item.path) {
    return configError('missing_field', `Workspace "${titleStr}": "path" is required`)
  }
  const [iconErr] = validateIconConfig(item.icon, `Workspace "${titleStr}"`)
  if (iconErr) {
    return iconErr
  }
  return null
}

/**
 * Locate the first workspace whose `path` repeats an earlier entry's `path`.
 * Returns `null` when every path is unique — only reached after `uniqBy`
 * has signalled a duplicate exists.
 *
 * @private
 */
function findFirstDuplicateByPath(items: readonly Workspace[]): Workspace | null {
  const duplicate = items
    .map((item, index) => ({ item, index }))
    .find(({ item, index }) => items.slice(0, index).some((earlier) => earlier.path === item.path))
  if (duplicate === undefined) {
    return null
  }
  return duplicate.item
}

/**
 * Validate workspace groups have required fields and non-empty items.
 *
 * @private
 */
function validateWorkspaceGroups(groups: readonly WorkspaceGroup[]): ConfigResult<true> {
  const categoryError = firstErrorOf(groups, validateWorkspaceGroup)
  if (categoryError) {
    return [categoryError, null]
  }
  return [null, true]
}

/**
 * Per-group shape check for a single `WorkspaceGroup`.
 *
 * @private
 */
function validateWorkspaceGroup(group: WorkspaceGroup): ConfigError | null {
  if (!group.title) {
    return configError('missing_field', 'WorkspaceGroup: "title" is required')
  }
  if (!group.icon) {
    return configError('missing_field', `WorkspaceGroup "${group.title}": "icon" is required`)
  }
  if (!group.items || group.items.length === 0) {
    return configError(
      'missing_field',
      `WorkspaceGroup "${group.title}": "items" must be a non-empty array`
    )
  }
  return null
}

/**
 * Validate a single page node (recursive).
 *
 * @private
 */
function validatePage(page: Page): ConfigResult<true> {
  const titleStr = stringifyTitle(page.title)

  if (page.include && page.content) {
    return [
      configError(
        'invalid_section',
        `Page "${titleStr}": 'include' and 'content' are mutually exclusive`
      ),
      null,
    ]
  }

  if (page.path && !page.include && !page.content && !page.pages && !page.openapi) {
    return [
      configError(
        'invalid_section',
        `Page "${titleStr}": page with 'path' must have 'include', 'content', 'pages', or 'openapi'`
      ),
      null,
    ]
  }

  if (isSingleFileInclude(page.include) && !page.pages && !page.path) {
    return [
      configError('invalid_section', `Page "${titleStr}": single-file 'include' requires 'path'`),
      null,
    ]
  }

  if (hasAnyGlobInclude(page.include) && !page.path) {
    return [
      configError('invalid_section', `Page "${titleStr}": glob 'include' requires 'path'`),
      null,
    ]
  }

  const discover = page.discover
  const recursiveFlag = match(discover)
    .with(P.nonNullable, (d) => d.recursive)
    .otherwise(() => undefined)

  if (recursiveFlag && !includeHasRecursive(page.include)) {
    return [
      configError(
        'invalid_section',
        `Page "${titleStr}": 'discover.recursive' requires a recursive glob pattern (e.g. "**/*.md")`
      ),
      null,
    ]
  }

  if (recursiveFlag && !page.path) {
    return [
      configError('invalid_section', `Page "${titleStr}": 'discover.recursive' requires 'path'`),
      null,
    ]
  }

  if (page.landing !== undefined && !page.pages) {
    return [
      configError(
        'invalid_section',
        `Page "${titleStr}": 'landing' only applies to pages with 'pages'`
      ),
      null,
    ]
  }

  if (page.landing === true && !page.path) {
    return [
      configError('invalid_section', `Page "${titleStr}": 'landing' requires 'path' to be set`),
      null,
    ]
  }

  const nav = page.nav
  const isIsland = match(nav)
    .with(P.nonNullable, (n) => n.island === true)
    .otherwise(() => false)

  if (isIsland && !page.path) {
    return [
      configError('invalid_section', `Page "${titleStr}": 'nav.island' requires 'path' to be set`),
      null,
    ]
  }

  if (page.pages) {
    const childErr = firstErrorOf(page.pages, (child) => {
      const [err] = validatePage(child)
      return err
    })

    if (childErr) {
      return [childErr, null]
    }
  }

  return [null, true]
}

/**
 * Validate placement of direct top-level pages.
 *
 * A visible leaf page (no `pages`) placed directly in `config.pages` becomes a
 * top-level sidebar entry, which resolves to a file at the content root. A
 * nested `path` (e.g. `/guides/intro`) files the page a directory deep, so the
 * root `_meta.json` entry points at a file that isn't there — a silent dead
 * link. Reject it with an actionable message rather than shipping a broken
 * sidebar. Only direct children of `config.pages` are checked; nested leaves
 * are expected to carry deeper paths.
 *
 * @private
 * @param pages - Top-level page entries from `config.pages`
 * @returns First placement error encountered, or success
 */
function validateTopLevelPlacement(pages: readonly Page[]): ConfigResult<true> {
  const offending = pages.find(isMisplacedTopLevelLeaf)
  if (offending) {
    const titleStr = stringifyTitle(offending.title)
    const offendingPath = offending.path as string
    return [
      configError(
        'invalid_section',
        `Page "${titleStr}": a top-level page with the nested path '${offendingPath}' can't render as a top-level sidebar link. Use a single-segment path (e.g. '/${pathSegments(offendingPath).at(-1)}') or nest it under a section with 'pages'.`
      ),
      null,
    ]
  }
  return [null, true]
}

/**
 * Determine whether a top-level page is a visible leaf whose nested path would
 * produce a dead top-level sidebar link.
 *
 * Sections (`pages`), OpenAPI mounts, and pages excluded from the main sidebar
 * (`nav.hidden` / `nav.island`) never emit a root file item, so they are exempt.
 *
 * @private
 * @param page - Top-level page entry
 * @returns True when the page is a misplaced top-level leaf
 */
function isMisplacedTopLevelLeaf(page: Page): boolean {
  if (page.pages || page.openapi) {
    return false
  }
  const nav = page.nav
  const excludedFromMainSidebar = match(nav)
    .with(P.nonNullable, (n) => n.hidden === true || n.island === true)
    .otherwise(() => false)
  if (excludedFromMainSidebar) {
    return false
  }
  const offendingPath = page.path
  if (!offendingPath) {
    return false
  }
  return pathSegments(offendingPath).length > 1
}

/**
 * Split a URL path into its non-empty segments.
 *
 * @private
 * @param path - URL path (e.g. `/guides/intro`)
 * @returns Non-empty path segments (e.g. `['guides', 'intro']`)
 */
function pathSegments(path: string): readonly string[] {
  return path.split('/').filter(Boolean)
}

/**
 * Stringify a `TitleConfig` for use in error messages.
 *
 * @private
 */
function stringifyTitle(title: Page['title'] | Workspace['title']): string {
  return match(title)
    .with(P.string, (t) => t)
    .otherwise(() => 'Untitled')
}

/**
 * Validate explicit features when provided.
 *
 * @private
 */
function validateFeatures(features: readonly Feature[] | undefined): ConfigResult<true> {
  if (features === undefined) {
    return [null, true]
  }

  const featureError = firstErrorOf(features, validateFeature)

  if (featureError) {
    return [featureError, null]
  }
  return [null, true]
}

/**
 * Validate a single feature has required fields and valid icon format.
 *
 * @private
 */
function validateFeature(feature: Feature): ConfigError | null {
  if (!feature.title) {
    return configError('missing_field', 'Feature: "title" is required')
  }

  if (!feature.description) {
    return configError('missing_field', `Feature "${feature.title}": "description" is required`)
  }

  const [iconErr] = validateIconConfig(feature.icon, `Feature "${feature.title}"`)
  if (iconErr) {
    return iconErr
  }

  return null
}

/**
 * Validate an IconConfig value (string or object form).
 *
 * @private
 */
function validateIconConfig(icon: IconConfig | undefined, context: string): ConfigResult<true> {
  if (icon === undefined) {
    return [null, true]
  }

  if (isString(icon)) {
    if (!icon.includes(':')) {
      return [
        configError(
          'invalid_icon',
          `${context}: icon must be an Iconify identifier (e.g. "devicon:hono")`
        ),
        null,
      ]
    }
    return [null, true]
  }

  // Image form — `{ src, alt? }`. Accepted as-is; the renderer pipes
  // `src` straight into an `<img>` element.
  if ('src' in icon) {
    if (typeof icon.src !== 'string' || icon.src.length === 0) {
      return [configError('invalid_icon', `${context}: icon.src must be a non-empty string`), null]
    }
    return [null, true]
  }

  if (!icon.id || !icon.id.includes(':')) {
    return [
      configError(
        'invalid_icon',
        `${context}: icon.id must be an Iconify identifier (e.g. "devicon:hono")`
      ),
      null,
    ]
  }

  return [null, true]
}

/**
 * Validate a single OpenAPI spec.
 *
 * @private
 */
function validateOpenAPI(openapi: OpenAPISpec, context: string): ConfigResult<true> {
  if (!openapi.spec || openapi.spec.length === 0) {
    return [configError('invalid_openapi', `${context}: "spec" must be a non-empty string`), null]
  }

  const validExtensions = ['.json', '.yaml', '.yml']
  const hasValidExtension = validExtensions.some((ext) => openapi.spec.endsWith(ext))
  if (!hasValidExtension) {
    return [
      configError(
        'invalid_openapi',
        `${context}: "spec" ("${openapi.spec}") must end with ${validExtensions.join(', ')}`
      ),
      null,
    ]
  }

  if (!openapi.path || !openapi.path.startsWith('/')) {
    return [configError('invalid_openapi', `${context}: "path" must start with "/"`), null]
  }

  return [null, true]
}

/**
 * Validate all OpenAPI specs collected from top-level pages and workspaces.
 *
 * Top-level `config.openapi` is gone — each `Page.openapi` (top-level pages
 * only) substitutes for the old single root spec. Workspace-level
 * `Workspace.openapi` continues to participate in the duplicate-path and
 * nesting checks.
 *
 * @private
 */
function validateAllOpenAPI(
  pages: readonly Page[],
  workspaces: readonly Workspace[]
): ConfigResult<true> {
  const rootConfigs: readonly { readonly config: OpenAPISpec; readonly context: string }[] = pages
    .filter((p): p is Page & { readonly openapi: OpenAPISpec } => p.openapi !== undefined)
    .map((p) => ({
      config: p.openapi,
      context: `Page "${stringifyTitle(p.title)}".openapi`,
    }))

  const workspaceConfigs = workspaces
    .filter(
      (ws): ws is Workspace & { readonly openapi: OpenAPISpec } =>
        ws.openapi !== null && ws.openapi !== undefined
    )
    .map((ws) => ({
      config: ws.openapi,
      context: `Workspace "${stringifyTitle(ws.title)}".openapi`,
      workspacePath: ws.path,
    }))

  const allConfigs = [...rootConfigs, ...workspaceConfigs]

  const individualError = firstErrorOf(allConfigs, (entry) => {
    const [err] = validateOpenAPI(entry.config, entry.context)
    return err
  })

  if (individualError) {
    return [individualError, null]
  }

  const scopeError = firstErrorOf(workspaceConfigs, checkOpenApiNesting)
  if (scopeError) {
    return [scopeError, null]
  }

  const uniqueByPath = uniqBy(allConfigs, (entry) => entry.config.path)
  if (uniqueByPath.length === allConfigs.length) {
    return [null, true]
  }

  const duplicate = findFirstDuplicateOpenApi(allConfigs)
  if (duplicate === null) {
    return [null, true]
  }
  return [
    configError(
      'invalid_openapi',
      `${duplicate.context}: duplicate OpenAPI path "${duplicate.config.path}"`
    ),
    null,
  ]
}

/**
 * Per-workspace OpenAPI scope check — ensures the workspace's `openapi.path`
 * is nested under its `workspacePath`.
 *
 * @private
 */
function checkOpenApiNesting(entry: {
  readonly config: OpenAPISpec
  readonly context: string
  readonly workspacePath: string
}): ConfigError | null {
  const workspaceRoot = match(entry.workspacePath.endsWith('/'))
    .with(true, () => entry.workspacePath)
    .otherwise(() => `${entry.workspacePath}/`)
  if (!entry.config.path.startsWith(workspaceRoot)) {
    return configError(
      'invalid_openapi',
      `${entry.context}: "path" ("${entry.config.path}") must be nested under "${workspaceRoot}"`
    )
  }
  return null
}

/**
 * Locate the first OpenAPI config entry whose `config.path` repeats an
 * earlier entry's path. Returns `null` only when every path is unique —
 * after `uniqBy` has signalled a duplicate exists.
 *
 * @private
 */
function findFirstDuplicateOpenApi(
  entries: readonly { readonly config: OpenAPISpec; readonly context: string }[]
): { readonly config: OpenAPISpec; readonly context: string } | null {
  const duplicate = entries.find((entry, index) =>
    entries.slice(0, index).some((earlier) => earlier.config.path === entry.config.path)
  )
  if (duplicate === undefined) {
    return null
  }
  return duplicate
}

/**
 * Validate a single ThemeColors override object.
 *
 * @private
 */
function validateThemeColors(colors: Partial<ThemeColors>, label: string): ConfigResult<true> {
  const colorPattern = /^(?:#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})|rgba?\([^)]*\))$/
  const keys: readonly (keyof ThemeColors)[] = [
    'brand',
    'brandLight',
    'brandDark',
    'brandSoft',
    'bg',
    'bgAlt',
    'bgElv',
    'bgSoft',
    'text1',
    'text2',
    'text3',
    'divider',
    'border',
    'homeBg',
  ]

  const firstError = firstErrorOf(keys, (key) => {
    const value = colors[key]
    if (value !== undefined && !colorPattern.test(value)) {
      return configError(
        'invalid_theme',
        `theme.${label}.${key}: "${value}" is not a valid color (use hex #xxx/#xxxxxx or rgba())`
      )
    }
    return null
  })

  if (firstError) {
    return [firstError, null]
  }
  return [null, true]
}

/**
 * Pull the name out of a ThemeEntry — bare string, `{ name }` object, or a
 * custom `defineTheme`-style envelope.
 *
 * @private
 */
function themeEntryName(entry: ThemeEntry): string | undefined {
  if (typeof entry === 'string') {
    return entry
  }
  if (entry !== null && typeof entry === 'object' && 'name' in entry) {
    const candidate = entry.name
    if (typeof candidate === 'string') {
      return candidate
    }
  }
  return undefined
}

/**
 * Decide whether a ThemeEntry registers a custom theme (carries `variants`)
 * vs references a built-in by name.
 *
 * @private
 */
function isCustomThemeEntry(entry: ThemeEntry): boolean {
  return entry !== null && typeof entry === 'object' && 'variants' in entry
}

/**
 * Validate theme settings when provided.
 *
 * @private
 */
function validateTheme(theme: ThemeSettings | undefined): ConfigResult<true> {
  if (theme === undefined) {
    return [null, true]
  }

  const userThemeNames = theme.themes
    .filter(isCustomThemeEntry)
    .map((entry) => themeEntryName(entry))
    .filter(isNotNil)

  const isKnownThemeName = either(isBuiltInTheme, (name: string) => userThemeNames.includes(name))

  const entryError = firstErrorOf(theme.themes, (entry: ThemeEntry) => {
    if (isCustomThemeEntry(entry)) {
      return null
    }
    const name = themeEntryName(entry)
    if (name === undefined) {
      return configError(
        'invalid_theme',
        `theme.themes: entry must be a theme name string or a theme definition object`
      )
    }
    if (!isKnownThemeName(name)) {
      return configError(
        'invalid_theme',
        `theme.themes: "${name}" is not a valid theme (use ${formatKnownThemeNames(userThemeNames)})`
      )
    }
    return null
  })

  if (entryError) {
    return [entryError, null]
  }

  if (theme.overrides) {
    const [colorsErr] = validateThemeColors(theme.overrides, 'overrides')
    if (colorsErr) {
      return [colorsErr, null]
    }
  }

  return [null, true]
}

/**
 * Run `check` over every item until the first non-null error appears.
 *
 * Replaces the hand-rolled `.reduce<ConfigError | null>((acc, x) => acc ? acc : check(x), null)`
 * pattern that previously appeared at eight sites in this module.
 *
 * The full sweep with `.map().find()` is fine in practice — typical inputs
 * are <100 pages / workspaces, validation work is constant per item, and
 * eager evaluation keeps the code dead-simple.
 *
 * @private
 * @param items - Items to check
 * @param check - Per-item check that returns either a `ConfigError` or `null`
 * @returns The first non-null error, or `null` when every item passes
 */
function firstErrorOf<T>(
  items: readonly T[],
  check: (item: T) => ConfigError | null
): ConfigError | null {
  return items.map(check).find(isNotNil) ?? null
}

/**
 * Format the set of valid theme names for the `invalid_theme` error message.
 * Built-in names come first (declared order), then any user-registered names.
 *
 * @private
 * @param userThemeNames - Names of themes registered via `theme.themes` (custom defs)
 * @returns Comma-separated, double-quoted list (e.g. `'"mulled", "honeycrisp"'`)
 */
function formatKnownThemeNames(userThemeNames: readonly string[]): string {
  return [...THEME_NAMES, ...userThemeNames].map((n) => `"${n}"`).join(', ')
}
