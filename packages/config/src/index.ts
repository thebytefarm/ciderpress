// ─── Config types ────────────────────────────────────────────────────────
export type {
  CiderpressConfig,
  ThemeName,
  IconColor,
  IconPrefix,
  IconId,
  IconConfig,
  ThemeColors,
  ThemeConfig,
  CiderpressThemeInput,
  Frontmatter,
  NavItem,
  CardConfig,
  Section,
  Workspace,
  WorkspaceGroup,
  TitleConfig,
  HeroAction,
  SidebarConfig,
  SidebarLink,
  ResolvedPage,
  ResolvedSection,
  Feature,
  OpenAPIConfig,
  HomeConfig,
  HomeTrustConfig,
  HomeCtaConfig,
  SocialLinkIcon,
  SocialLink,
  FooterConfig,
  HomeGridConfig,
  TruncateConfig,
  AnnouncementConfig,
  SiteConfig,
  SiteEditConfig,
  SiteReportConfig,
  SiteSidebarPromoConfig,
  SiteCtaConfig,
  SiteFooterColumn,
  SiteFooterConfig,
  LogoConfig,
  LogoContext,
  LogoFn,
  LogoImage,
  Paths,
  Result,
} from './types.ts'

// ─── Define / validate ───────────────────────────────────────────────────
export { defineConfig } from './define-config.ts'
export { validateConfig } from './validator.ts'
export { ciderpressConfigSchema, pathsSchema } from './schema.ts'

// ─── Errors ──────────────────────────────────────────────────────────────
export { configError, configErrorFromZod, configWarning } from './errors.ts'
export type {
  ConfigError,
  ConfigErrorType,
  ConfigResult,
  ConfigWarning,
  ConfigWarningType,
} from './errors.ts'

// ─── Icon helpers (resolve/serialize IconConfig values) ──────────────────
export { resolveIcon, resolveOptionalIcon, serializeIcon } from './icon.ts'
export type { ResolvedIcon } from './icon.ts'

// ─── Icon registry (generated from @iconify-json/*) ──────────────────────
export { ICON_PREFIXES, VALID_ICON_IDS } from './icons.generated.ts'

// ─── Include / glob helpers ──────────────────────────────────────────────
export { hasGlobChars, normalizeInclude, isSingleFileInclude, hasAnyGlobInclude } from './glob.ts'

// ─── Workspace helpers ───────────────────────────────────────────────────
export { collectAllWorkspaceItems } from './workspace.ts'

// ─── Theme re-exports ────────────────────────────────────────────────────
export {
  THEME_NAMES,
  ICON_COLORS,
  isBuiltInTheme,
  isBuiltInIconColor,
  defineTheme,
} from '@ciderpress/theme'
export type { BuiltInThemeName, BuiltInIconColor } from '@ciderpress/theme'

// ─── Loader (Node-only) ──────────────────────────────────────────────────
// NOTE: `loadConfig` is exported separately at `@ciderpress/config/loader` to keep
// the main entry client-safe. See package.json `exports`.
export type { LoadConfigOptions } from './loader.ts'
