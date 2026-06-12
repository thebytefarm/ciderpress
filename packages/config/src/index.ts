export type {
  CiderpressConfig,
  ThemeName,
  IconColor,
  IconPrefix,
  IconId,
  IconConfig,
  IconImage,
  FaviconConfig,
  LoaderConfig,
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
  HomeFeaturesConfig,
  HomeSectionHeading,
  HomeTrustConfig,
  HomeCtaConfig,
  HeroDemoConfig,
  HeroDemoImage,
  HeroDemoTerminal,
  HeroDemoLine,
  SplitConfig,
  SplitVisual,
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

export { defineConfig } from './define-config.ts'
export { validateConfig } from './validator.ts'
export { ciderpressConfigSchema, pathsSchema } from './schema.ts'

export { configError, configErrorFromZod, configWarning } from './errors.ts'
export type {
  ConfigError,
  ConfigErrorType,
  ConfigResult,
  ConfigWarning,
  ConfigWarningType,
} from './errors.ts'

export { resolveIcon, resolveOptionalIcon, serializeIcon } from './icon.ts'
export type {
  ResolvedIcon,
  ResolvedIconifyIcon,
  ResolvedImageIcon,
  SerializedIcon,
} from './icon.ts'

export { ICON_PREFIXES, VALID_ICON_IDS } from './icons.generated.ts'

export { hasGlobChars, normalizeInclude, isSingleFileInclude, hasAnyGlobInclude } from './glob.ts'

export { collectAllWorkspaceItems } from './workspace.ts'

export {
  THEME_NAMES,
  ICON_COLORS,
  isBuiltInTheme,
  isBuiltInIconColor,
  defineTheme,
} from '@ciderpress/theme'
export type { BuiltInThemeName, BuiltInIconColor } from '@ciderpress/theme'

export type { LoadConfigOptions } from './loader.ts'
