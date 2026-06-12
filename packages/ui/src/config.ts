import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type {
  BuiltInThemeName,
  FaviconConfig,
  HomeConfig,
  LoaderConfig,
  Paths,
  SerializedIcon,
  ThemeColors,
  ThemeName,
  CiderpressConfig,
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
import type { ThemeVariant, CiderpressTheme } from '@ciderpress/theme'
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
   * (i.e. `config.loader === false`), no loader CSS is emitted and no
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
 * `config.themes` are appended per build inside `createRspressConfig`.
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
  const gitBranch = detectGitBranch()

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
  const loaderStyle = resolveLoaderStyle(config.loader)
  const themeCss = getThemeCss(themeName, loaderStyle) + userThemesCss
  const themeRegistry: readonly ThemeRegistryEntry[] = [
    ...BUILT_IN_THEME_REGISTRY,
    ...userThemes.map(buildRegistryEntry),
  ]
  const isVscode = vscode === true
  const loaderMaxMs = resolveLoaderMaxMs(config.loader)
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

  return {
    root: paths.contentDir,
    outDir: paths.distDir,

    base: resolvedBase,
    route: { cleanUrls: true },

    llms: true,

    title: config.title ?? 'ciderpress',
    description: config.description ?? 'Documentation',

    icon: resolveFaviconPath(config.favicon),
    // `<HeaderLogo />` paints the visible brand inside `cp-header-logo`
    // by reading `config.logo` from the bundled user config, and
    // Rspress's built-in nav (`.rp-nav`) is visually hidden by CSS in
    // `ciderpress-header.css` — so this `logo` field never paints
    // pixels. Forward the static string form anyway so downstream
    // tooling that inspects the resolved Rspress config (plugins, the
    // OpenGraph image generator) sees the user's intended asset. The
    // function form is non-serialisable for that audience; pass an
    // empty string there.
    logo: match(config.logo)
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
          ...resolveFaviconLinkTags(config.favicon),
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
          __CIDERPRESS_HAS_USER_FAVICON__: JSON.stringify(config.favicon !== undefined),
          __CIDERPRESS_LOADER_MIN_MS__: JSON.stringify(resolveLoaderMinMs(config.loader)),
          __CIDERPRESS_LOADER_MAX_MS__: JSON.stringify(resolveLoaderMaxMs(config.loader)),
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
      ...({ workspaces, standaloneScopePaths } as Record<string, unknown>),
      ...({
        socialLinks: config.socialLinks,
        sidebarAbove: resolveSidebarLinks({ config, position: 'above' }),
        sidebarBelow: resolveSidebarLinks({ config, position: 'below' }),
        home: resolveHomeConfig(config),
        ciderpressFooter: config.footer,
        site: config.site,
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
 * `config.themes` are validated by their raw name (aliases only ever
 * point at built-ins).
 *
 * An unknown name — caused by a typo or by removing a custom theme without
 * updating `theme.name` — writes a warning to stderr and falls back to
 * `DEFAULT_THEME_NAME` so the build still produces working CSS.
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
    `[ciderpress] Unknown theme '${requested}' — not a built-in and not declared in config.themes. Falling back to '${DEFAULT_THEME_NAME}'.\n`
  )
  return DEFAULT_THEME_NAME
}

/**
 * Pick the theme name the consumer asked for, in precedence order:
 * CLI override > `config.theme.name` > `DEFAULT_THEME_NAME`.
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
  if (config.theme && config.theme.name) {
    return config.theme.name
  }
  return DEFAULT_THEME_NAME
}

/**
 * Build the set of theme names known to this build — built-in themes plus
 * any user themes declared in `config.themes` (each validated through
 * `defineTheme` to surface bad input before this point).
 *
 * @private
 * @param config - Ciderpress config object
 * @returns Set of registered theme names
 */
function collectRegisteredThemeNames(config: CiderpressConfig): ReadonlySet<string> {
  const builtIn = Object.keys(BUILT_IN_THEMES)
  const user = (config.themes ?? []).map((t) => t.name)
  return new Set<string>([...builtIn, ...user])
}

/**
 * Resolve the initial variant to render for the active theme.
 *
 * Precedence: CLI override > `config.theme.variant` > theme's own
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
    .with(undefined, () => {})
    .otherwise((block) => block.variant)
  const requested = params.override ?? fromConfig
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
 * Variants declared by the active theme (built-in or user). Used to
 * validate `theme.variant` overrides and to fall back to a sensible
 * default when the request is unsupported.
 *
 * @private
 * @param themeName - Resolved theme name
 * @param userThemes - Validated user themes from `config.themes`
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
 * Resolve whether the theme switcher is enabled.
 *
 * @private
 * @param config - Ciderpress config object
 * @returns True if the theme switcher is enabled
 */
function resolveThemeSwitcher(config: CiderpressConfig): boolean {
  if (config.theme && config.theme.switcher) {
    return config.theme.switcher
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
  if (config.theme && config.theme.colors) {
    return config.theme.colors
  }
  return {}
}

/**
 * Resolve theme color overrides applied to the `dark` variant,
 * defaulting to empty object.
 *
 * @private
 * @param config - Ciderpress config object
 * @returns Dark variant color overrides
 */
function resolveThemeDarkColors(config: CiderpressConfig): ThemeColors {
  if (config.theme && config.theme.darkColors) {
    return config.theme.darkColors
  }
  return {}
}

/**
 * Validate and freeze every `CiderpressThemeInput` declared in `config.themes`,
 * producing fully-typed `CiderpressTheme` instances ready for CSS emission and
 * registry serialisation.
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
  if (!config.themes) {
    return []
  }
  return config.themes.map(defineTheme)
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
  readonly position: 'above' | 'below'
}): readonly {
  text: string
  link: string
  icon?: SerializedIcon
  style?: 'brand' | 'alt' | 'ghost'
  shape?: 'square' | 'rounded' | 'circle'
}[] {
  const items = params.config.sidebar && params.config.sidebar[params.position]
  if (!items) {
    return []
  }
  return items.map((item) => ({
    text: item.text,
    link: item.link,
    icon: serializeIcon(resolveOptionalIcon(item.icon)),
    style: item.style,
    shape: item.shape,
  }))
}

/**
 * Resolve home page layout config with defaults.
 * Workspaces default to 2 columns.
 *
 * @private
 * @param config - Ciderpress config object
 * @returns Resolved home config
 */
function resolveHomeConfig(config: CiderpressConfig): HomeConfig {
  if (config.home) {
    return {
      ...config.home,
      workspaces: {
        columns: 2,
        ...config.home.workspaces,
      },
    }
  }
  return { workspaces: { columns: 2 } }
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
  // disabled (`config.loader === false`) — otherwise we'd flip
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
 * Normalize `config.loader` into the `LoaderStyle` consumed by
 * `getThemeCss`. Defaults to `'apple'` when omitted; `false` flows
 * through unchanged; `LoaderConfig` objects flow through unchanged.
 *
 * @private
 * @param loader - Raw `config.loader` value
 * @returns Resolved `LoaderStyle`
 */
function resolveLoaderStyle(
  loader: CiderpressConfig['loader']
): false | 'apple' | 'classic' | LoaderConfig {
  if (loader === undefined) {
    return 'apple'
  }
  return loader
}

/**
 * Resolve the minimum loader display time in ms.
 *
 * @private
 * @param loader - Raw `config.loader` value
 * @returns Minimum display time in ms
 */
export function resolveLoaderMinMs(loader: CiderpressConfig['loader']): number {
  if (isLoaderConfig(loader) && typeof loader.minDisplayMs === 'number') {
    return loader.minDisplayMs
  }
  return DEFAULT_LOADER_MIN_MS
}

/**
 * Resolve the forced-dismiss timeout in ms.
 *
 * @private
 * @param loader - Raw `config.loader` value
 * @returns Forced-dismiss timeout in ms
 */
export function resolveLoaderMaxMs(loader: CiderpressConfig['loader']): number {
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
 * @param loader - Raw `config.loader` value
 * @returns True when `loader` is the `LoaderConfig` object form
 */
function isLoaderConfig(loader: CiderpressConfig['loader']): loader is LoaderConfig {
  return typeof loader === 'object' && loader !== null
}

/**
 * Resolve the favicon path Rspress writes to `<link rel="icon">`.
 * Accepts the `FaviconConfig` union — string shorthand or `{ src, type }`
 * object — and returns the resolved string path.
 *
 * @private
 * @param favicon - Raw `config.favicon` value
 * @returns Favicon path string
 */
function resolveFaviconPath(favicon: FaviconConfig | undefined): string {
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
 * `config.favicon`'s `type` field. Rspress's built-in `icon` field
 * emits a `<link>` with auto-derived `type` from the file extension —
 * if the user supplied an explicit `type` we add a second link tag
 * with the exact MIME they asked for so browsers always pick it.
 *
 * @private
 * @param favicon - Raw `config.favicon` value
 * @returns Head tag entries (zero or one)
 */
function resolveFaviconLinkTags(favicon: FaviconConfig | undefined): readonly {
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
