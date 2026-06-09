import { isBuiltInTheme, THEME_NAMES, THEME_VARIANTS } from '@ciderpress/theme'
import { uniqBy } from 'massaman/array'
import { match, P } from 'massaman/match'
import { either, isNotNil, isString } from 'massaman/predicate'

import { configError, configErrorFromZod } from './errors.ts'
import type { ConfigError, ConfigResult } from './errors.ts'
import { hasAnyGlobInclude, isSingleFileInclude } from './glob.ts'
import { ciderpressConfigSchema } from './schema.ts'
import type {
  Feature,
  IconConfig,
  OpenAPIConfig,
  Section,
  ThemeColors,
  ThemeConfig,
  Workspace,
  WorkspaceGroup,
  CiderpressConfig,
} from './types.ts'
import { collectAllWorkspaceItems } from './workspace.ts'

/**
 * Validate a ciderpress config — Zod schema parse followed by semantic checks.
 *
 * 1. Schema parse via Zod (shape, types, required fields).
 * 2. Cross-field semantic validation (workspace path uniqueness, OpenAPI
 *    nesting, include/path coupling, landing/standalone requirements, icon
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
  if (!config.sections || config.sections.length === 0) {
    return [configError('empty_sections', 'config.sections must have at least one section'), null]
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

  const [openapiErr] = validateAllOpenAPI(config.openapi, allWorkspaceItems)
  if (openapiErr) {
    return [openapiErr, null]
  }

  const sectionErrors = firstErrorOf(config.sections, (section) => {
    const [sectionErr] = validateSection(section)
    return sectionErr
  })

  if (sectionErrors) {
    return [sectionErrors, null]
  }

  const [featErr] = validateFeatures(config.features)
  if (featErr) {
    return [featErr, null]
  }

  const userThemeNames = (config.themes ?? []).map((t) => t.name)
  const [themeErr] = validateTheme(config.theme, userThemeNames)
  if (themeErr) {
    return [themeErr, null]
  }

  return [null, true]
}

/**
 * Check if include contains a recursive glob pattern ('**').
 *
 * @private
 */
function includeHasRecursive(include: Section['include']): boolean {
  if (include === null || include === undefined) {
    return false
  }
  if (isString(include)) {
    return include.includes('**')
  }
  return include.some((p) => p.includes('**'))
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
      `Workspace "${duplicate.title}": duplicate path "${duplicate.path}"`
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
  if (!item.title) {
    return configError('missing_field', 'Workspace: "title" is required')
  }
  if (!item.description) {
    return configError('missing_field', `Workspace "${item.title}": "description" is required`)
  }
  if (!item.path) {
    return configError('missing_field', `Workspace "${item.title}": "path" is required`)
  }
  const [iconErr] = validateIconConfig(item.icon, `Workspace "${item.title}"`)
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
 * Validate a single section node (recursive).
 *
 * @private
 */
function validateSection(section: Section): ConfigResult<true> {
  const titleStr = match(section.title)
    .with(P.string, (t) => t)
    .otherwise(() => 'Section')

  if (section.include && section.content) {
    return [
      configError(
        'invalid_section',
        `Section "${titleStr}": 'include' and 'content' are mutually exclusive`
      ),
      null,
    ]
  }

  if (section.path && !section.include && !section.content && !section.items) {
    return [
      configError(
        'invalid_section',
        `Section "${titleStr}": page with 'path' must have 'include', 'content', or 'items'`
      ),
      null,
    ]
  }

  if (isSingleFileInclude(section.include) && !section.items && !section.path) {
    return [
      configError(
        'invalid_section',
        `Section "${titleStr}": single-file 'include' requires 'path'`
      ),
      null,
    ]
  }

  if (hasAnyGlobInclude(section.include) && !section.path) {
    return [
      configError('invalid_section', `Section "${titleStr}": glob 'include' requires 'path'`),
      null,
    ]
  }

  if (section.recursive && !includeHasRecursive(section.include)) {
    return [
      configError(
        'invalid_section',
        `Section "${titleStr}": 'recursive' requires a recursive glob pattern (e.g. "**/*.md")`
      ),
      null,
    ]
  }

  if (section.recursive && !section.path) {
    return [
      configError('invalid_section', `Section "${titleStr}": 'recursive' requires 'path'`),
      null,
    ]
  }

  if (section.landing !== undefined && !section.items) {
    return [
      configError(
        'invalid_section',
        `Section "${titleStr}": 'landing' only applies to sections with 'items'`
      ),
      null,
    ]
  }

  if (section.landing === true && !section.path) {
    return [
      configError('invalid_section', `Section "${titleStr}": 'landing' requires 'path' to be set`),
      null,
    ]
  }

  if (section.standalone && !section.path) {
    return [
      configError(
        'invalid_section',
        `Section "${titleStr}": 'standalone' requires 'path' to be set`
      ),
      null,
    ]
  }

  if (section.items) {
    const childErr = firstErrorOf(section.items, (child) => {
      const [err] = validateSection(child)
      return err
    })

    if (childErr) {
      return [childErr, null]
    }
  }

  return [null, true]
}

/**
 * Validate explicit features when provided.
 *
 * @private
 */
function validateFeatures(features: CiderpressConfig['features']): ConfigResult<true> {
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
 * Validate a single OpenAPI config.
 *
 * @private
 */
function validateOpenAPI(openapi: OpenAPIConfig, context: string): ConfigResult<true> {
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
 * Validate all OpenAPI configs from root and workspace items.
 *
 * @private
 */
function validateAllOpenAPI(
  rootOpenapi: OpenAPIConfig | undefined,
  workspaces: readonly Workspace[]
): ConfigResult<true> {
  const rootConfigs: readonly { readonly config: OpenAPIConfig; readonly context: string }[] =
    match(rootOpenapi)
      .with(P.nonNullable, (o) => [{ config: o, context: 'openapi' }])
      .otherwise(() => [])

  const workspaceConfigs = workspaces
    .filter(
      (ws): ws is Workspace & { readonly openapi: OpenAPIConfig } =>
        ws.openapi !== null && ws.openapi !== undefined
    )
    .map((ws) => ({
      config: ws.openapi,
      context: `Workspace "${String(ws.title)}".openapi`,
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
  readonly config: OpenAPIConfig
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
  entries: readonly { readonly config: OpenAPIConfig; readonly context: string }[]
): { readonly config: OpenAPIConfig; readonly context: string } | null {
  const duplicate = entries.find((entry, index) =>
    entries.slice(0, index).some((earlier) => earlier.config.path === entry.config.path)
  )
  if (duplicate === undefined) {
    return null
  }
  return duplicate
}

/**
 * Validate a single ThemeColors object.
 *
 * @private
 */
function validateThemeColors(colors: ThemeColors, label: string): ConfigResult<true> {
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
 * Validate theme configuration when provided.
 *
 * @private
 */
function validateTheme(
  theme: ThemeConfig | undefined,
  userThemeNames: readonly string[]
): ConfigResult<true> {
  if (theme === undefined) {
    return [null, true]
  }

  const isKnownThemeName = either(isBuiltInTheme, (name: string) => userThemeNames.includes(name))
  if (theme.name !== undefined && !isKnownThemeName(theme.name)) {
    return [
      configError(
        'invalid_theme',
        `theme.name: "${theme.name}" is not a valid theme (use ${formatKnownThemeNames(userThemeNames)})`
      ),
      null,
    ]
  }

  if (theme.variant !== undefined && !THEME_VARIANTS.includes(theme.variant)) {
    return [
      configError(
        'invalid_theme',
        `theme.variant: "${theme.variant}" is not valid (use ${THEME_VARIANTS.map((m) => `"${m}"`).join(', ')})`
      ),
      null,
    ]
  }

  if (theme.colors) {
    const [colorsErr] = validateThemeColors(theme.colors, 'colors')
    if (colorsErr) {
      return [colorsErr, null]
    }
  }

  if (theme.darkColors) {
    const [darkErr] = validateThemeColors(theme.darkColors, 'darkColors')
    if (darkErr) {
      return [darkErr, null]
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
 * are <100 sections / workspaces, validation work is constant per item, and
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
 * @param userThemeNames - Names of themes registered via `config.themes`
 * @returns Comma-separated, double-quoted list (e.g. `'"mulled", "honeycrisp"'`)
 */
function formatKnownThemeNames(userThemeNames: readonly string[]): string {
  return [...THEME_NAMES, ...userThemeNames].map((n) => `"${n}"`).join(', ')
}
