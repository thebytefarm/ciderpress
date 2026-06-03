export { defineConfig, defineTheme, hasGlobChars } from '@ciderpress/config'
export { CiderpressLogo } from '@ciderpress/ui'
export type { CiderpressLogoProps } from '@ciderpress/ui'

// Config types — what consumers fill in when writing `ciderpress.config.ts`.
export type {
  CiderpressConfig,
  Section,
  Feature,
  Workspace,
  WorkspaceGroup,
  Frontmatter,
  NavItem,
  CardConfig,
  SidebarConfig,
  SidebarLink,
  ResolvedPage,
  ResolvedSection,
  Result,
  TitleConfig,
  HeroAction,
  HomeConfig,
  HomeTrustConfig,
  HomeCtaConfig,
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
  FooterConfig,
  SocialLink,
  SocialLinkIcon,
  OpenAPIConfig,
  IconConfig,
  IconColor,
  IconId,
  IconPrefix,
  LogoConfig,
  LogoContext,
  LogoFn,
  LogoImage,
} from '@ciderpress/config'

// Theme types — what `defineTheme` accepts and returns.
export type {
  CiderpressTheme,
  CiderpressThemeInput,
  CiderpressThemeInputVariants,
  CiderpressTokens,
  ThemeVariant,
  ThemeVariantTokens,
  ThemeName,
  ThemeColors,
  ThemeConfig,
  BuiltInThemeName,
  BuiltInIconColor,
} from '@ciderpress/theme'

// Config loader option types.
export type { LoadConfigOptions } from '@ciderpress/config'
