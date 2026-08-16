import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type {
  BuiltInThemeName,
  ButtonConfig,
  CiderpressConfig,
  HomeConfig,
  ImageSource,
  LoaderConfig,
  Paths,
  SerializedIcon,
  ThemeColors,
  ThemeEntry,
  ThemeName,
} from '@ciderpress/config'
import { resolveOptionalIcon, serializeIcon } from '@ciderpress/config'
import {
  BUILT_IN_THEMES,
  DEFAULT_THEME_NAME,
  defineTheme,
  isBuiltInTheme,
  resolveDefaultVariant,
  resolveThemeAlias,
  resolveThemeVariants,
  themeToCss,
} from '@ciderpress/theme'
import type { CiderpressTheme, CiderpressThemeInput, ThemeVariant } from '@ciderpress/theme'
import type { UserConfig } from '@rspress/core'
import { match, P } from 'massaman/match'
import fileTree from 'rspress-plugin-file-tree'
import katex from 'rspress-plugin-katex'
import supersub from 'rspress-plugin-supersub'

import { getThemeCss } from './css.ts'
import { readJs } from './head/read.ts'
import { ciderpressPlugin } from './plugin.ts'
import { remarkMathToDiv } from './plugins/katex/remark-math-to-div.ts'
import { mermaidPlugin } from './plugins/mermaid/plugin.ts'
import { toPlainText } from './theme/lib/rich-text-parse.ts'

interface CreateRspressConfigOptions {
  readonly config: CiderpressConfig
  readonly paths: Paths
  readonly logLevel?: 'info' | 'warn' | 'error' | 'silent'
  readonly vscode?: boolean
  readonly themeOverride?: ThemeName
  readonly variantOverride?: ThemeVariant
}

interface HeadScriptOptions {
  readonly variant: ThemeVariant
  readonly themeName: string
  readonly vscode: boolean
  readonly registry: readonly ThemeRegistryEntry[]
  /**
   * Forced-dismiss timer (ms). Catches the case where the React bundle
   * never hydrates — the head script flips `data-cp-ready` after this
   * duration regardless of `ThemeProvider`. Ignored when `loaderEnabled`
   * is false.
   */
  readonly loaderMaxMs: number
  /**
   * Inject the dots-loader animation JS. Only relevant when `loader === 'classic'`;
   * the apple loader and custom loaders animate purely via CSS.
   */
  readonly useDotsLoader: boolean
  /**
   * Whether the inline FOUC loader is enabled at all. When `false`
   * (i.e. `brand.loader === false`), no loader CSS is emitted and no
   * forced-dismiss fallback timer is scheduled — `data-cp-ready` flips
   * are skipped entirely so user CSS hooked on the dismissal lifecycle
   * stays quiet.
   */
  readonly loaderEnabled: boolean
}

/**
 * Default minimum loader display in ms — keeps the fade from feeling
 * jittery on fast first paints.
 */
const DEFAULT_LOADER_MIN_MS = 150

/**
 * Default forced-dismiss timeout in ms. The head script flips
 * `data-cp-ready` after this duration if the React bundle never
 * hydrates, so the loader never stays stuck on static dist served over
 * plain http with no service worker.
 */
const DEFAULT_LOADER_MAX_MS = 5000

/**
 * Serialized theme registry entry consumed by the theme switcher and
 * theme provider. Carries the minimum metadata needed to render and apply
 * a theme without re-importing `@ciderpress/theme` at runtime.
 */
interface ThemeRegistryEntry {
  readonly name: string
  readonly label: string
  readonly swatch: string
  readonly variants: readonly ThemeVariant[]
  readonly defaultVariant: ThemeVariant
}

const VSCODE_SET_JS = `document.documentElement.dataset.ciderpressEnv='vscode'`
const VSCODE_NAV_JS = readJs('js/vscode-nav.js')
const LOADER_DOTS_JS = readJs('js/loader-dots.js')

/**
 * Serialized registry of built-in themes — the static portion of the
 * `__CIDERPRESS_THEME_REGISTRY__` define. User-defined themes from
 * `config.theme.themes` are appended per build inside `createRspressConfig`.
 */
const BUILT_IN_THEME_REGISTRY: readonly ThemeRegistryEntry[] =
  Object.values(BUILT_IN_THEMES).map(buildRegistryEntry)

/**
 * Translate ciderpress config + sync engine output into a complete
 * Rspress configuration object.
 *
 * @param options - Config, paths, and optional log level
 * @returns Complete Rspress UserConfig object
 */
export function createRspressConfig(options: CreateRspressConfigOptions): UserConfig {
  const { config, paths, logLevel, vscode } = options

  const workspaces = loadGenerated({
    contentDir: paths.contentDir,
    name: 'workspaces.json',
    fallback: [],
  })
  const standaloneScopePaths = loadGenerated<readonly string[]>({
    contentDir: paths.contentDir,
    name: 'scopes.json',
    fallback: [],
  })
  const pageBadges = loadGenerated<Record<string, unknown>>({
    contentDir: paths.contentDir,
    name: 'badges.json',
    fallback: {},
  })
  const gitBranch = detectGitBranch()

  const brand = config.brand
  const home = config.home
  const editLink = config.editLink
  const reportLink = config.reportLink
  const topbar = config.topbar
  const sidebar = config.sidebar
  const footer = config.footer
  const favicon = brand && brand.favicon
  const loaderRaw = brand && brand.loader
  const logoRaw = brand && brand.logo

  const themeName = resolveThemeName(config, options.themeOverride)
  const userThemes = resolveUserThemes(config)
  const variant = resolveActiveVariant({
    config,
    themeName,
    override: options.variantOverride,
    userThemes,
  })
  const themeSwitcher = resolveThemeSwitcher(config)
  const themeColors = resolveThemeColors(config)
  const themeDarkColors = resolveThemeDarkColors(config)

  const userThemesCss = userThemes.map(themeToCss).join('')
  const loaderStyle = resolveLoaderStyle(loaderRaw)
  const themeCss = getThemeCss(themeName, loaderStyle) + userThemesCss
  const themeRegistry: readonly ThemeRegistryEntry[] = [
    ...BUILT_IN_THEME_REGISTRY,
    ...userThemes.map(buildRegistryEntry),
  ]
  const isVscode = vscode === true
  const loaderMaxMs = resolveLoaderMaxMs(loaderRaw)
  const headScriptBody = buildHeadScriptBody({
    variant,
    themeName,
    vscode: isVscode,
    registry: themeRegistry,
    loaderMaxMs,
    useDotsLoader: loaderStyle === 'classic',
    loaderEnabled: loaderStyle !== false,
  })

  // Force a single React instance across all compiled theme components.
  // Without this alias, Rspress's rspack may resolve react from the
  // @ciderpress/ui dist/theme directory (deep inside pnpm's .pnpm store),
  // producing a second copy that triggers "Invalid hook call" errors.
  // Resolve from this package's context (react is a peer dep of @ciderpress/ui).
  const selfRequire = createRequire(import.meta.url)
  const reactAlias = path.dirname(selfRequire.resolve('react/package.json'))
  const reactDomAlias = path.dirname(selfRequire.resolve('react-dom/package.json'))

  // Bundle the user's ciderpress.config.{ts,js,...} into the browser graph so
  // function-form fields (e.g. `logo: ({ theme }) => <CiderpressLogo />`) can
  // run at render time. The slot component imports from this alias; the
  // shim falls back to an empty object so the import always resolves even
  // when the user has no config file or only data fields.
  const userConfigAlias = resolveUserConfigAlias(paths.repoRoot)

  // `CIDERPRESS_BASE` env var wins over the config field so a build
  // orchestrator (e.g. `scripts/build.lauf.ts`) can inject per-child
  // mount paths without editing each example site's own config.
  const envBase = process.env.CIDERPRESS_BASE
  const resolvedBase = match([envBase, config.base])
    .with([P.string.minLength(1), P._], ([b]) => b)
    .with([P._, P.string.minLength(1)], ([, b]) => b)
    .otherwise(() => '/')

  // Promoted into a serialized "site" block so theme-side components can
  // continue to reach for site.{edit,report,topbarCta,sidebarPromo,announcement,footer,version}
  // without re-deriving the layout from the unified config shape on every render.
  const siteBlock = buildSiteBlock({
    config,
    editLink,
    reportLink,
    feedback: config.feedback,
    topbar,
    sidebar,
    footer,
  })

  return {
    root: paths.contentDir,
    outDir: paths.distDir,

    base: resolvedBase,
    route: { cleanUrls: true },

    llms: true,

    // Markup is allowed in config copy, but these land in `<title>`
    // and `<meta name="description">`, which take bare text.
    title: toPlainText(config.title ?? 'ciderpress'),
    description: toPlainText(config.description ?? 'Documentation'),

    icon: resolveFaviconPath(favicon),
    // `<HeaderLogo />` paints the visible brand inside `cp-header-logo`
    // by reading `brand.logo` from the bundled user config, and
    // Rspress's built-in nav (`.rp-nav`) is visually hidden by CSS in
    // `ciderpress-header.css` — so this `logo` field never paints
    // pixels. Forward the static string form anyway so downstream
    // tooling that inspects the resolved Rspress config (plugins, the
    // OpenGraph image generator) sees the user's intended asset. The
    // function form is non-serialisable for that audience; pass an
    // empty string there.
    logo: match(logoRaw)
      .with(P.string, (l) => l)
      .otherwise(() => ''),
    logoText: '',

    themeDir: path.resolve(import.meta.dirname, 'theme'),

    plugins: [
      ciderpressPlugin(),
      mermaidPlugin(),
      fileTree({ initialExpandDepth: 1 }),
      supersub(),
      katex(),
    ],

    markdown: {
      remarkPlugins: [remarkMathToDiv],
      // Skip dead-link checks for `/examples/<name>/` URLs — those are
      // sub-mounted by the `scripts/build.lauf.ts` orchestrator (copied
      // from each example's own dist) and aren't routes in this Rspress
      // build. Without this, the link checker fails on the auto-
      // generated `docs/examples/index.mdx` cards. Internal routes
      // still get checked exhaustively.
      link: {
        checkDeadLinks: {
          excludes: (url: string) => url.startsWith('/examples/'),
        },
      },
    },

    builderConfig: {
      ...(() => {
        if (logLevel) {
          return { logLevel }
        }
        return {}
      })(),
      html: {
        tags: [
          ...resolveFaviconLinkTags(favicon),
          {
            tag: 'style',
            children: themeCss,
            attrs: { 'data-ciderpress-theme-css': true },
            append: false,
            head: true,
          },
          {
            tag: 'script',
            children: `(function(){${headScriptBody}})()`,
            append: false,
            head: true,
          },
        ],
      },
      resolve: {
        alias: {
          // Deduplicate React — pnpm isolation can cause rspack to resolve
          // different physical copies from theme components vs Rspress internals.
          react: reactAlias,
          'react-dom': reactDomAlias,
          // Allow generated MDX files in .ciderpress/content/ to import
          // ciderpress React components used in landing pages.
          '@ciderpress/ui/theme': path.resolve(import.meta.dirname, 'theme', 'index.tsx'),
          // Bridge the user's ciderpress.config.* into the browser bundle so
          // function-form fields (e.g. `logo`) can run at render time.
          // Falls back to a stub re-exporting `{}` when no config file exists.
          '@ciderpress/internal/user-config': userConfigAlias,
          // The user's `ciderpress.config.ts` imports `defineConfig`/`defineTheme`
          // from `ciderpress`. When Rspress's webpack bundles that config into
          // the client (via the alias above), it needs to resolve `ciderpress`
          // — and pnpm's symlinked layout doesn't always work from Rspress's
          // resolve context. Point the alias at the kit's main entry directly.
          // Uses `import.meta.resolve` (not CJS `require.resolve`) so the
          // package's `"import"` export condition is honored.
          ciderpress: fileURLToPath(import.meta.resolve('ciderpress')),
          // `ciderpress/dist/index.mjs` re-exports `CiderpressLogo` from bare
          // `@ciderpress/ui`, and user MDX may also import components directly
          // from `@ciderpress/ui`. Both paths hit the same CJS/ESM exports gap
          // (`@ciderpress/ui` declares only the `"import"` condition), so alias
          // the bare specifier the same way `ciderpress` is handled above.
          '@ciderpress/ui$': fileURLToPath(import.meta.resolve('@ciderpress/ui')),
        },
      },
      source: {
        define: {
          __CIDERPRESS_GIT_BRANCH__: JSON.stringify(gitBranch),
          __CIDERPRESS_THEME_NAME__: JSON.stringify(themeName),
          __CIDERPRESS_DEFAULT_VARIANT__: JSON.stringify(variant),
          __CIDERPRESS_THEME_COLORS__: JSON.stringify(JSON.stringify(themeColors)),
          __CIDERPRESS_THEME_DARK_COLORS__: JSON.stringify(JSON.stringify(themeDarkColors)),
          __CIDERPRESS_THEME_SWITCHER__: JSON.stringify(themeSwitcher),
          __CIDERPRESS_THEME_REGISTRY__: JSON.stringify(JSON.stringify(themeRegistry)),
          __CIDERPRESS_VSCODE__: JSON.stringify(isVscode),
          __CIDERPRESS_HAS_USER_FAVICON__: JSON.stringify(favicon !== undefined),
          __CIDERPRESS_LOADER_MIN_MS__: JSON.stringify(resolveLoaderMinMs(loaderRaw)),
          __CIDERPRESS_LOADER_MAX_MS__: JSON.stringify(resolveLoaderMaxMs(loaderRaw)),
          __CIDERPRESS_HAS_VARIANT_TOGGLE__: JSON.stringify(
            resolveHasVariantToggle({ themeName, themeSwitcher, registry: themeRegistry })
          ),
        },
      },
      output: {
        distPath: {
          root: paths.distDir,
        },
      },
    },

    themeConfig: {
      // Rspress's sun/moon toggle is shown when the active theme exposes
      // more than one variant — when there's only one, the toggle is
      // visually irrelevant. CSS in
      // `packages/ui/src/theme/styles/overrides/rspress.css` hides it on
      // single-variant themes via `[data-cp-variants]`.
      darkMode: true,
      search: true,
      // Route Rspress's auto-rendered LLMs UI to the outline placement
      // (away from the H1) — Ciderpress mounts its own LlmsContainer in
      // <CiderpressDocsBar />, and a CSS rule hides the outline render
      // so we keep a single source of truth. `placement: 'outline'`
      // also keeps the page itself clean natively without relying on a
      // `display: none` over the H1 cluster.
      llmsUI: { placement: 'outline' },
      // Custom ciderpress data injected alongside standard Rspress themeConfig.
      // Accessed at runtime via useSite().site.themeConfig cast to unknown.
      ...({ workspaces, standaloneScopePaths, pageBadges } as Record<string, unknown>),
      ...({
        socialLinks: serializeSocials(config.socials),
        sidebarAbove: resolveSidebarLinks({ config, position: 'top' }),
        sidebarBelow: resolveSidebarLinks({ config, position: 'bottom' }),
        home: resolveHomeConfig(home),
        ciderpressFooter: footer,
        site: siteBlock,
      } as Record<string, unknown>),
    },
  }
}

/**
 * Load a generated JSON file from the sync engine output, falling back
 * to a default value if the file does not exist yet.
 *
 * @private
 * @param params - Content directory, file name, and fallback value
 * @returns Parsed JSON content or the fallback value
 */
function loadGenerated<T>(params: {
  readonly contentDir: string
  readonly name: string
  readonly fallback: T
}): T {
  const p = path.resolve(params.contentDir, '.generated', params.name)
  // oxlint-disable-next-line security/detect-non-literal-fs-filename -- safe: derived from known output directory
  if (!existsSync(p)) {
    process.stderr.write(
      `[ciderpress] Generated file not found: ${params.name} — run "ciderpress sync" first\n`
    )
    return params.fallback
  }
  try {
    // oxlint-disable-next-line security/detect-non-literal-fs-filename -- safe: derived from known output directory
    return JSON.parse(readFileSync(p, 'utf8')) as T
  } catch {
    process.stderr.write(`[ciderpress] Failed to parse ${params.name} — returning fallback\n`)
    return params.fallback
  }
}

/**
 * Detect current git branch at build time — falls back to empty string.
 *
 * @private
 * @returns Current git branch name or empty string
 */
function detectGitBranch(): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', stdio: 'pipe' }).trim()
  } catch {
    return ''
  }
}

/**
 * Resolve the theme name from config, defaulting to `DEFAULT_THEME_NAME`.
 *
 * The requested name is normalized through `resolveThemeAlias` so legacy
 * slugs (e.g. `'default'`) map to their canonical apple-named built-in
 * before registry membership is checked. Custom themes declared in
 * `theme.themes` are validated by their raw name (aliases only ever
 * point at built-ins).
 *
 * An unknown name — caused by a typo or by removing a custom theme without
 * updating the default marker — writes a warning to stderr and falls back
 * to `DEFAULT_THEME_NAME` so the build still produces working CSS.
 *
 * @private
 * @param config - Ciderpress config object
 * @param override - Optional CLI override (e.g. `--theme=midnight`)
 * @returns Resolved theme name
 */
function resolveThemeName(config: CiderpressConfig, override?: ThemeName): ThemeName {
  const registeredNames = collectRegisteredThemeNames(config)
  const requested = resolveThemeAlias(resolveRequestedThemeName(config, override))
  if (registeredNames.has(requested)) {
    return requested
  }
  process.stderr.write(
    `[ciderpress] Unknown theme '${requested}' — not a built-in and not declared in theme.themes. Falling back to '${DEFAULT_THEME_NAME}'.\n`
  )
  return DEFAULT_THEME_NAME
}

/**
 * Pick the theme name the consumer asked for, in precedence order:
 * CLI override > default entry in `theme.themes` > first entry in
 * `theme.themes` > `DEFAULT_THEME_NAME`.
 *
 * @private
 * @param config - Ciderpress config object
 * @param override - Optional CLI override
 * @returns Requested theme name (not yet alias-normalized or validated)
 */
function resolveRequestedThemeName(config: CiderpressConfig, override?: ThemeName): ThemeName {
  if (override) {
    return override
  }
  const fromThemes = resolveDefaultEntryName(config.theme && config.theme.themes)
  if (fromThemes !== undefined) {
    return fromThemes
  }
  return DEFAULT_THEME_NAME
}

/**
 * Pick the active theme name from a `ThemeEntry[]` array — the entry
 * carrying `default: true` wins; otherwise the first entry; otherwise
 * `undefined`.
 *
 * @private
 * @param themes - Optional themes array from `theme.themes`
 * @returns Active theme name, or `undefined` when the array is empty / absent
 */
function resolveDefaultEntryName(themes: readonly ThemeEntry[] | undefined): string | undefined {
  if (themes === undefined || themes.length === 0) {
    return undefined
  }
  const marked = themes.find(isDefaultMarked)
  if (marked !== undefined) {
    return readThemeEntryName(marked)
  }
  return readThemeEntryName(themes[0])
}

/**
 * Type-guard: a `ThemeEntry` carries an explicit `default: true` marker.
 *
 * @private
 * @param entry - Theme entry to test
 * @returns True when the entry is marked default
 */
function isDefaultMarked(entry: ThemeEntry): boolean {
  if (typeof entry === 'string') {
    return false
  }
  const obj = entry as { readonly default?: boolean }
  return obj.default === true
}

/**
 * Read the `name` off any `ThemeEntry` shape — bare built-in name,
 * `{ name }` wrapper, or full custom-theme input.
 *
 * @private
 * @param entry - Theme entry to read
 * @returns The entry's resolved name
 */
function readThemeEntryName(entry: ThemeEntry): string {
  if (typeof entry === 'string') {
    return entry
  }
  const obj = entry as { readonly name?: string }
  if (typeof obj.name === 'string') {
    return obj.name
  }
  return ''
}

/**
 * Build the set of theme names known to this build — built-in themes plus
 * any user themes declared in `theme.themes` (each validated through
 * `defineTheme` to surface bad input before this point).
 *
 * @private
 * @param config - Ciderpress config object
 * @returns Set of registered theme names
 */
function collectRegisteredThemeNames(config: CiderpressConfig): ReadonlySet<string> {
  const builtIn = Object.keys(BUILT_IN_THEMES)
  const user = resolveUserThemeInputs(config).map((t) => t.name)
  return new Set<string>([...builtIn, ...user])
}

/**
 * Resolve the initial variant to render for the active theme.
 *
 * Precedence: CLI override > `theme.defaultVariant` > theme's own
 * `defaultVariant`. When the requested variant is not declared by the
 * active theme, falls back to the theme's `defaultVariant` (and writes
 * a warning to stderr).
 *
 * @private
 * @param params - Config, resolved theme name, optional CLI override, resolved user themes
 * @returns Variant to apply on first render
 */
function resolveActiveVariant(params: {
  readonly config: CiderpressConfig
  readonly themeName: ThemeName
  readonly override?: ThemeVariant
  readonly userThemes: readonly CiderpressTheme[]
}): ThemeVariant {
  const supported = resolveSupportedVariants(params.themeName, params.userThemes)
  const themeBlock = params.config.theme
  const fromConfig = match(themeBlock)
    .with(undefined, () => undefined)
    .otherwise((block) => block.defaultVariant)
  const requested = match(params.override)
    .with(P.nonNullable, (o) => o)
    .otherwise(() => normaliseConfigVariant(fromConfig))
  if (requested !== undefined && supported.includes(requested)) {
    return requested
  }
  if (requested !== undefined) {
    process.stderr.write(
      `[ciderpress] Theme '${params.themeName}' does not declare variant '${requested}'. Falling back to its default variant.\n`
    )
  }
  if (isBuiltInTheme(params.themeName)) {
    return resolveDefaultVariant(params.themeName as BuiltInThemeName)
  }
  const userTheme = params.userThemes.find((t) => t.name === params.themeName)
  if (userTheme) {
    return userTheme.defaultVariant
  }
  return 'dark'
}

/**
 * Coerce a `ThemeSettings.defaultVariant` value (which accepts `'system'`)
 * into a concrete `ThemeVariant`. `'system'` defers to the theme's own
 * declared default, so it is treated as `undefined` here.
 *
 * @private
 * @param raw - Raw default-variant value from config
 * @returns Concrete `ThemeVariant` or `undefined`
 */
function normaliseConfigVariant(
  raw: 'light' | 'dark' | 'system' | undefined
): ThemeVariant | undefined {
  if (raw === 'light' || raw === 'dark') {
    return raw
  }
  return undefined
}

/**
 * Variants declared by the active theme (built-in or user). Used to
 * validate `theme.defaultVariant` overrides and to fall back to a
 * sensible default when the request is unsupported.
 *
 * @private
 * @param themeName - Resolved theme name
 * @param userThemes - Validated user themes from `theme.themes`
 * @returns Variants the theme supports
 */
function resolveSupportedVariants(
  themeName: ThemeName,
  userThemes: readonly CiderpressTheme[]
): readonly ThemeVariant[] {
  if (isBuiltInTheme(themeName)) {
    return resolveThemeVariants(themeName as BuiltInThemeName)
  }
  const userTheme = userThemes.find((t) => t.name === themeName)
  if (userTheme) {
    return (Object.keys(userTheme.variants) as ThemeVariant[]).filter(
      (v) => userTheme.variants[v] !== undefined
    )
  }
  return ['dark']
}

/**
 * Resolve whether the named-theme switcher is enabled.
 *
 * Defaults to `true` when more than one theme is declared in
 * `theme.themes`, since the picker becomes visually meaningful then;
 * explicit `theme.themeSwitcher` always wins.
 *
 * @private
 * @param config - Ciderpress config object
 * @returns True if the theme switcher is enabled
 */
function resolveThemeSwitcher(config: CiderpressConfig): boolean {
  const themeBlock = config.theme
  if (themeBlock === undefined) {
    return false
  }
  if (themeBlock.themeSwitcher !== undefined) {
    return themeBlock.themeSwitcher
  }
  const themes = themeBlock.themes
  if (themes !== undefined && themes.length > 1) {
    return true
  }
  return false
}

/**
 * Resolve theme color overrides applied to the `light` variant,
 * defaulting to empty object.
 *
 * @private
 * @param config - Ciderpress config object
 * @returns Theme color overrides
 */
function resolveThemeColors(config: CiderpressConfig): ThemeColors {
  if (config.theme && config.theme.overrides) {
    return config.theme.overrides
  }
  return {}
}

/**
 * Resolve theme color overrides applied to the `dark` variant.
 *
 * The new `ThemeSettings` block flattens light/dark overrides into a
 * single `overrides` field; the per-variant split that used to live on
 * `theme.darkColors` is gone. Return an empty object so the runtime
 * never tries to apply a dark-only set.
 *
 * @private
 * @param _config - Ciderpress config object
 * @returns Empty `ThemeColors` object
 */
function resolveThemeDarkColors(_config: CiderpressConfig): ThemeColors {
  return {}
}

/**
 * Extract the custom-theme inputs from a `ThemeEntry[]` array — bare
 * built-in names are skipped; `{ name }` wrappers without a full custom
 * theme are skipped; full custom theme definitions (with or without a
 * `default` marker) are stripped of that marker and returned.
 *
 * @private
 * @param config - Ciderpress config object
 * @returns Plain custom-theme inputs in declaration order
 */
function resolveUserThemeInputs(config: CiderpressConfig): readonly CiderpressThemeInput[] {
  const themes = config.theme && config.theme.themes
  if (!themes) {
    return []
  }
  return themes.flatMap((entry) => {
    if (typeof entry === 'string') {
      return []
    }
    const obj = entry as Record<string, unknown>
    // Full custom themes carry a `variants` field; the `{ name }` shorthand does not.
    if (!('variants' in obj)) {
      return []
    }
    // Strip the optional `default` marker before handing to `defineTheme`.
    const { default: _default, ...rest } = obj as { readonly default?: boolean } & Record<
      string,
      unknown
    >
    return [rest as unknown as CiderpressThemeInput]
  })
}

/**
 * Validate and freeze every `CiderpressThemeInput` declared in
 * `theme.themes`, producing fully-typed `CiderpressTheme` instances
 * ready for CSS emission and registry serialisation.
 *
 * Each input flows through `defineTheme`, which runs each variant's token
 * tree through `tokensSchema` — surfaced validation errors are intentional
 * config-time failures (same contract as `defineTheme` in `@ciderpress/theme`).
 *
 * @private
 * @param config - Ciderpress config object
 * @returns Resolved user theme definitions, in declaration order
 */
function resolveUserThemes(config: CiderpressConfig): readonly CiderpressTheme[] {
  return resolveUserThemeInputs(config).map(defineTheme)
}

/**
 * Resolve sidebar link items for a given position, defaulting to empty array.
 *
 * @private
 * @param params - Config and sidebar position
 * @returns Array of sidebar link items
 */
function resolveSidebarLinks(params: {
  readonly config: CiderpressConfig
  readonly position: 'top' | 'bottom'
}): readonly {
  text: string
  link: string
  icon?: SerializedIcon
  style?: 'brand' | 'alt' | 'ghost'
  shape?: 'square' | 'rounded' | 'circle'
}[] {
  const sidebar = params.config.sidebar
  if (sidebar === undefined) {
    return []
  }
  const items = sidebar[params.position]
  if (!items) {
    return []
  }
  return items.map((item) => ({
    text: item.text,
    link: item.href,
    icon: serializeIcon(resolveOptionalIcon(item.icon)),
    style: mapButtonVariantToStyle(item.variant),
    shape: item.shape,
  }))
}

/**
 * Map the unified `ButtonConfig.variant` vocabulary back into the
 * legacy `style` string the runtime theme components were authored
 * against. `'primary'` → `'brand'`, `'secondary'` → `'alt'`, `'ghost'`
 * passes through unchanged.
 *
 * @private
 * @param variant - Optional button variant from the unified config
 * @returns Legacy `style` token consumed by the runtime
 */
function mapButtonVariantToStyle(
  variant: ButtonConfig['variant']
): 'brand' | 'alt' | 'ghost' | undefined {
  return match(variant)
    .with(undefined, () => undefined)
    .with('primary', () => 'brand' as const)
    .with('secondary', () => 'alt' as const)
    .with('ghost', () => 'ghost' as const)
    .exhaustive()
}

/**
 * Serialize the unified `SocialLink[]` carried at the top level of
 * `CiderpressConfig` into a plain `{ icon, url, label }` shape consumed
 * at runtime by `<CiderpressNavSocialLinks />`. The legacy Rspress
 * `mode` / `content` discriminator is gone — every link is rendered as
 * a plain anchor.
 *
 * @private
 * @param socials - Optional socials array from the top-level config
 * @returns Serialised social-link records
 */
function serializeSocials(socials: CiderpressConfig['socials']): readonly {
  readonly icon: unknown
  readonly url: string
  readonly label: string | undefined
}[] {
  if (socials === undefined) {
    return []
  }
  return socials.map((entry) => ({
    icon: entry.icon,
    url: entry.url,
    label: entry.label,
  }))
}

/**
 * Promoted `Site*`-style block surfaced to the runtime — kept distinct
 * from the unified `CiderpressConfig` shape so the React layer can keep
 * reading `site.{edit,report,topbarCta,sidebarPromo,announcement,footer,version}`
 * without re-deriving every render.
 */
interface SiteBlock {
  readonly version: string | undefined
  readonly edit:
    | {
        readonly repo: string
        readonly branch?: string
        readonly directory?: string
        readonly label?: string
      }
    | undefined
  readonly report:
    | {
        readonly repo: string
        readonly branch?: string
        readonly directory?: string
        readonly label?: string
      }
    | undefined
  readonly topbarCta: { readonly text: string; readonly href: string } | undefined
  readonly sidebarPromo:
    | {
        readonly title: string
        readonly body: string
        readonly cta: { readonly text: string; readonly href: string }
      }
    | undefined
  readonly announcement:
    | {
        readonly id?: string
        readonly lead?: string
        readonly message: string
        readonly cta?: { readonly href: string; readonly label: string }
        readonly persistent?: boolean
      }
    | undefined
  readonly footer:
    | {
        readonly columns?: readonly {
          readonly heading: string
          readonly links: readonly { readonly text: string; readonly href: string }[]
        }[]
        readonly tagline?: string
        readonly brandMark?: string
      }
    | undefined
  readonly feedback: {
    readonly enabled: boolean
    readonly question: string | undefined
  }
}

/**
 * Project the unified config into the runtime `SiteBlock`. The new
 * config shape promotes `version` to top-level, replaces `site.edit`
 * with `editLink`, splits `topbar` / `sidebar` / `footer` into their
 * own blocks, and removes the `site` wrapper entirely; the React layer
 * still reads through `site.*`, so we rebuild that view here.
 *
 * @private
 * @param params - Slices of the unified config relevant to the runtime view
 * @returns Serialised `Site`-shape consumed by theme components
 */
function buildSiteBlock(params: {
  readonly config: CiderpressConfig
  readonly editLink: CiderpressConfig['editLink']
  readonly reportLink: CiderpressConfig['reportLink']
  readonly feedback: CiderpressConfig['feedback']
  readonly topbar: CiderpressConfig['topbar']
  readonly sidebar: CiderpressConfig['sidebar']
  readonly footer: CiderpressConfig['footer']
}): SiteBlock {
  const editBlock = match(params.editLink)
    .with(undefined, () => undefined)
    .with(false, () => undefined)
    .otherwise((e) => {
      if (e.repo === undefined) {
        return undefined
      }
      return {
        repo: e.repo,
        branch: e.branch,
        directory: e.directory,
        label: e.label,
      }
    })

  const reportBlock = match(params.reportLink)
    .with(undefined, () => undefined)
    .with(false, () => undefined)
    .otherwise((r) => {
      if (r.repo === undefined) {
        return undefined
      }
      return {
        repo: r.repo,
        branch: r.branch,
        directory: r.directory,
        label: r.label,
      }
    })

  const topbar = params.topbar
  const topbarCta = match(topbar)
    .with(undefined, () => undefined)
    .otherwise((t) => {
      const cta = t.cta
      if (cta === undefined) {
        return undefined
      }
      return { text: cta.text, href: cta.href }
    })

  const announcement = match(topbar)
    .with(undefined, () => undefined)
    .otherwise((t) => t.announcement)

  const sidebar = params.sidebar
  const sidebarPromo = match(sidebar)
    .with(undefined, () => undefined)
    .otherwise((s) => s.promo)

  const footer = params.footer
  const footerBlock = match(footer)
    .with(undefined, () => undefined)
    .otherwise((f) => ({
      columns: f.columns,
      tagline: f.tagline,
      brandMark: f.brandMark,
    }))

  const feedbackBlock = match(params.feedback)
    .with(true, () => ({ enabled: true, question: undefined }))
    .with(P.union(false, undefined), () => ({ enabled: false, question: undefined }))
    .otherwise((f) => ({ enabled: true, question: f.question }))

  return {
    version: params.config.version,
    edit: editBlock,
    report: reportBlock,
    topbarCta,
    sidebarPromo,
    announcement,
    footer: footerBlock,
    feedback: feedbackBlock,
  }
}

/**
 * Resolve home page config, defaulting to an empty hero when omitted.
 * Per-block layout defaults (e.g. showcase columns) are applied at render
 * time by the individual block components.
 *
 * @private
 * @param home - Raw home config from the user
 * @returns Resolved home config
 */
function resolveHomeConfig(home: HomeConfig | undefined): HomeConfig {
  if (home === undefined) {
    return { hero: {} }
  }
  return home
}

/**
 * Build the raw JS body for the inline head script (no wrapping tags).
 *
 * Resolves the active theme and variant **once** in a single IIFE so
 * `data-cp-theme`, `data-cp-variant`, `.rp-dark`, and Rspress's
 * `localStorage['rspress-theme-appearance']` are all consistent before
 * React hydrates. The script intersects persisted values from
 * `localStorage` against the embedded registry — stale or unsupported
 * values fall through to the build-time defaults rather than poisoning
 * first paint.
 *
 * Keep the persistence keys and resolution ladder in sync with:
 *   - `theme/components/theme-provider.tsx` → `resolveActiveVariant`
 *   - `theme/components/nav/theme-switcher.tsx` → `applyTheme`
 * Any divergence between the three causes a flash between first paint,
 * React hydration, and user-triggered theme switches.
 *
 * @private
 * @param options - Variant, theme name, vscode flag, and registry
 * @returns Concatenated inline JS string
 */
function buildHeadScriptBody(options: HeadScriptOptions): string {
  // Minimal registry for the head script — only `name → variants[]` plus
  // each theme's default variant. Anything else is dead weight in the
  // critical-path script.
  const minimalRegistry = options.registry.map((entry) => ({
    name: entry.name,
    variants: [...entry.variants],
    defaultVariant: entry.defaultVariant,
  }))

  const resolveJs = `(function(){
    var R = ${JSON.stringify(minimalRegistry)};
    var buildTheme = ${JSON.stringify(options.themeName)};
    var buildVariant = ${JSON.stringify(options.variant)};
    function readLS(k){try{return localStorage.getItem(k)}catch(_){return null}}
    var name = (function(){
      var s = readLS('ciderpress-theme');
      for (var i = 0; i < R.length; i++) { if (R[i].name === s) { return s; } }
      return buildTheme;
    })();
    var entry = R.find(function(e){return e.name===name});
    var supported = entry ? entry.variants : ['dark'];
    var themeDefault = entry ? entry.defaultVariant : buildVariant;
    var variant = (function(){
      var s = readLS('ciderpress-variant');
      if ((s === 'dark' || s === 'light') && supported.indexOf(s) !== -1) { return s; }
      if (supported.indexOf(themeDefault) !== -1) { return themeDefault; }
      if (supported.indexOf(buildVariant) !== -1) { return buildVariant; }
      return supported[0] || 'dark';
    })();
    var d = document.documentElement;
    d.dataset.cpTheme = name;
    d.dataset.cpVariant = variant;
    d.dataset.cpVariants = supported.join(' ');
    if (variant === 'dark') {
      d.classList.add('rp-dark', 'dark');
      d.dataset.dark = 'true';
    } else {
      d.classList.remove('rp-dark', 'dark');
      d.dataset.dark = 'false';
    }
    try { localStorage.setItem('rspress-theme-appearance', variant); } catch (_) {}
  })()`

  const vscodeJs: string = (() => {
    if (options.vscode) {
      return [VSCODE_SET_JS, VSCODE_NAV_JS].join(';')
    }
    return ''
  })()

  // Forced-dismiss fallback. The React bundle's `ThemeProvider` is the
  // primary dismissal path; this timer is a belt-and-suspenders cover
  // for the case where hydration never runs (static dist served over
  // plain http with no service worker, an errored bundle, etc.). The
  // setTimeout flips `data-cp-ready` after `loaderMaxMs` so the loader
  // can't get visually stuck. Skipped entirely when the loader is
  // disabled (`brand.loader === false`) — otherwise we'd flip
  // `data-cp-ready` on pages that have no loader to dismiss, which
  // would still fire user CSS hooked on that attribute.
  const fallbackJs = match(options.loaderEnabled)
    .with(
      true,
      () =>
        `setTimeout(function(){var d=document.documentElement;if(d.dataset.cpReady!=='true'){d.classList.add('cp-loader-fade');setTimeout(function(){d.dataset.cpReady='true'},220)}},${options.loaderMaxMs})`
    )
    .otherwise(() => '')

  const loaderJs = match(options.useDotsLoader)
    .with(true, () => LOADER_DOTS_JS)
    .otherwise(() => '')
  return [resolveJs, vscodeJs, loaderJs, fallbackJs].filter(Boolean).join(';')
}

/**
 * Raw loader value pulled from `config.brand.loader`. The new `BrandConfig`
 * union accepts `false`, `'apple' | 'classic'`, a static-glyph object, or a
 * React-component object.
 */
type BrandLoaderRaw = false | 'apple' | 'classic' | LoaderConfig | undefined

/**
 * Normalize `brand.loader` into the `LoaderStyle` consumed by
 * `getThemeCss`. Defaults to `'apple'` when omitted; `false` flows
 * through unchanged; `LoaderConfig` objects flow through unchanged.
 *
 * @private
 * @param loader - Raw `brand.loader` value
 * @returns Resolved `LoaderStyle`
 */
function resolveLoaderStyle(loader: BrandLoaderRaw): false | 'apple' | 'classic' | LoaderConfig {
  if (loader === undefined) {
    return 'apple'
  }
  return loader
}

/**
 * Resolve the minimum loader display time in ms.
 *
 * @private
 * @param loader - Raw `brand.loader` value
 * @returns Minimum display time in ms
 */
export function resolveLoaderMinMs(loader: BrandLoaderRaw): number {
  if (isLoaderConfig(loader) && typeof loader.minDisplayMs === 'number') {
    return loader.minDisplayMs
  }
  return DEFAULT_LOADER_MIN_MS
}

/**
 * Resolve the forced-dismiss timeout in ms.
 *
 * @private
 * @param loader - Raw `brand.loader` value
 * @returns Forced-dismiss timeout in ms
 */
export function resolveLoaderMaxMs(loader: BrandLoaderRaw): number {
  if (isLoaderConfig(loader) && typeof loader.maxDisplayMs === 'number') {
    return loader.maxDisplayMs
  }
  return DEFAULT_LOADER_MAX_MS
}

/**
 * Type guard for the `LoaderConfig` object form. Used to safely read
 * `minDisplayMs` / `maxDisplayMs` off raw config values.
 *
 * @private
 * @param loader - Raw `brand.loader` value
 * @returns True when `loader` is the `LoaderConfig` object form
 */
function isLoaderConfig(loader: BrandLoaderRaw): loader is LoaderConfig {
  return typeof loader === 'object' && loader !== null
}

/**
 * Resolve the favicon path Rspress writes to `<link rel="icon">`.
 * Accepts the `ImageSource` union — string shorthand or `{ src, type }`
 * object — and returns the resolved string path.
 *
 * @private
 * @param favicon - Raw `brand.favicon` value
 * @returns Favicon path string
 */
function resolveFaviconPath(favicon: ImageSource | undefined): string {
  if (favicon === undefined) {
    return '/icon.svg'
  }
  if (typeof favicon === 'string') {
    return favicon
  }
  return favicon.src
}

/**
 * Build any extra `<link rel="icon">` head tags needed to honour
 * `brand.favicon`'s `type` field. Rspress's built-in `icon` field
 * emits a `<link>` with auto-derived `type` from the file extension —
 * if the user supplied an explicit `type` we add a second link tag
 * with the exact MIME they asked for so browsers always pick it.
 *
 * @private
 * @param favicon - Raw `brand.favicon` value
 * @returns Head tag entries (zero or one)
 */
function resolveFaviconLinkTags(favicon: ImageSource | undefined): readonly {
  readonly tag: string
  readonly attrs: Record<string, string>
  readonly head: true
  readonly append: false
}[] {
  if (favicon === undefined || typeof favicon === 'string') {
    return []
  }
  if (favicon.type === undefined) {
    return []
  }
  return [
    {
      tag: 'link',
      attrs: { rel: 'icon', href: favicon.src, type: favicon.type },
      head: true,
      append: false,
    },
  ]
}

/**
 * Decide whether the `<VariantToggle />` will ever be visible in the
 * topbar — drives the trailing-cluster divider in `CiderpressHeader`.
 *
 * - If the theme switcher is enabled, the user can swap to any
 *   registered theme at runtime — assume the toggle COULD appear and
 *   render the divider.
 * - Otherwise, the build-time theme is the only one ever painted; the
 *   toggle is hidden by CSS when that theme declares one variant.
 *
 * @private
 * @param params - Active theme name, switcher flag, and the registry
 *   entries (built-in + user themes).
 * @returns True when the divider before the toggle should be rendered.
 */
function resolveHasVariantToggle(params: {
  readonly themeName: string
  readonly themeSwitcher: boolean
  readonly registry: readonly ThemeRegistryEntry[]
}): boolean {
  if (params.themeSwitcher) {
    return true
  }
  const entry = params.registry.find((e) => e.name === params.themeName)
  if (entry === undefined) {
    return false
  }
  return entry.variants.length > 1
}

/**
 * Map a `CiderpressTheme` to its serialized registry entry. The swatch is the
 * default variant's `colors.brand.primary` — the single hex value the
 * theme switcher paints into each option's swatch dot.
 *
 * @private
 * @param theme - Built-in or user theme definition
 * @returns Registry entry consumed by the theme switcher and provider
 */
function buildRegistryEntry(theme: CiderpressTheme): ThemeRegistryEntry {
  const defaultTokens = theme.variants[theme.defaultVariant]
  const swatch = match(defaultTokens)
    .with(undefined, () => '')
    .otherwise((tokens) => tokens.colors.brand.primary)
  const variants = (Object.keys(theme.variants) as ThemeVariant[]).filter(
    (v) => theme.variants[v] !== undefined
  )
  return {
    name: theme.name,
    label: toLabel(theme.name),
    swatch,
    variants,
    defaultVariant: theme.defaultVariant,
  }
}

/**
 * Capitalize the first character of a theme name for display in the switcher.
 * Built-in theme names are single lowercase tokens (`default`, `midnight`,
 * `arcade`) so a simple capitalization is sufficient — no spaces or casing
 * tricks needed.
 *
 * @private
 * @param name - Theme identifier
 * @returns Display label
 */
function toLabel(name: string): string {
  if (name.length === 0) {
    return name
  }
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/**
 * Extensions in priority order — first match wins. Mirrors `c12`'s
 * default ciderpress.config resolution so the alias points at the same file
 * c12 loaded server-side.
 */
const USER_CONFIG_EXTENSIONS: readonly string[] = Object.freeze([
  '.ts',
  '.mts',
  '.cts',
  '.js',
  '.mjs',
  '.cjs',
])

/**
 * Path to the empty stub re-exported when the user has no ciderpress.config
 * file at the standard location (or only has a non-bundleable variant
 * like `.json` / `.yaml`). Keeps the `@ciderpress/internal/user-config` alias
 * resolvable so the slot component's import never breaks the build.
 */
const USER_CONFIG_STUB_PATH = path.resolve(
  import.meta.dirname,
  'theme',
  'lib',
  'user-config-stub.ts'
)

/**
 * Resolve the absolute path used by the `@ciderpress/internal/user-config`
 * webpack alias.
 *
 * Looks for a bundleable user config (`ciderpress.config.{ts,mts,cts,js,mjs,cjs}`)
 * in `repoRoot`; falls back to a stub that re-exports `{}` so the slot
 * component's import always resolves.
 *
 * JSON / YAML configs are intentionally not aliased — they can't carry
 * function values (which is the whole point of the bridge), and Rspress's
 * `logo` string field already handles their static `logo` paths.
 *
 * @private
 * @param repoRoot - Project root directory (`paths.repoRoot`)
 * @returns Absolute path to the user's config file or the empty stub
 */
function resolveUserConfigAlias(repoRoot: string): string {
  const candidates = USER_CONFIG_EXTENSIONS.map((ext) =>
    path.resolve(repoRoot, `ciderpress.config${ext}`)
  )
  // oxlint-disable-next-line security/detect-non-literal-fs-filename -- candidates derived from trusted repoRoot + known extension list
  const found = candidates.find((p) => existsSync(p))
  if (found !== undefined) {
    return found
  }
  return USER_CONFIG_STUB_PATH
}
