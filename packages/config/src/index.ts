export { DEFAULT_HOME_LAYOUT, SOCIAL_LINK_ICONS } from './types.ts'

export type {
  CiderpressConfig,
  ThemeName,
  ColorMode,
  IconColor,
  IconPrefix,
  IconId,
  IconConfig,
  IconImage,
  ImageSource,
  LoaderConfig,
  LoaderStaticConfig,
  LoaderComponentConfig,
  ThemeColors,
  ThemeSettings,
  ThemeEntry,
  CiderpressThemeInput,
  Frontmatter,
  NavItem,
  CardConfig,
  Page,
  Workspace,
  WorkspaceGroup,
  TitleConfig,
  SortStrategy,
  ButtonConfig,
  BrandConfig,
  BannerConfig,
  BannerFn,
  TopbarConfig,
  SidebarConfig,
  SidebarPromo,
  FooterConfig,
  FooterColumn,
  CopyrightConfig,
  EditLinkConfig,
  ReportLinkConfig,
  DiscoverConfig,
  ResolvedPage,
  ResolvedSection,
  Feature,
  OpenAPISpec,
  HomeConfig,
  HomeHeroConfig,
  HomeHeroDemoConfig,
  HomeHeroDemoImage,
  HomeHeroDemoTerminal,
  HomeHeroDemoLine,
  HomeProofConfig,
  HomeFeaturesConfig,
  HomeShowcaseConfig,
  HomeSplitConfig,
  HomeSplitVisual,
  HomeCtaConfig,
  HomeSectionHeading,
  HomeSectionId,
  HomeLayoutEntry,
  TruncateConfig,
  AnnouncementConfig,
  SocialLinkIcon,
  SocialLink,
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
