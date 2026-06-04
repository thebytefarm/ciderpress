export type {
  ThemeName,
  BuiltInThemeName,
  IconColor,
  BuiltInIconColor,
  ThemeVariant,
  ColorMode,
  ThemeColors,
  ThemeConfig,
} from './types.ts'

export {
  THEME_NAMES,
  THEME_VARIANTS,
  COLOR_MODES,
  ICON_COLORS,
  THEME_ALIASES,
  resolveDefaultVariant,
  resolveDefaultColorMode,
  resolveThemeVariants,
  resolveThemeModes,
  resolveThemeAlias,
  isBuiltInTheme,
  isBuiltInIconColor,
} from './definitions.ts'

export {
  themeVariantSchema,
  colorModeSchema,
  cssColorSchema,
  themeColorsSchema,
  themeConfigSchema,
  tokensSchema,
} from './schema.ts'

export type { BrandPalette } from './brand-colors.ts'
export {
  BRAND_COLORS,
  BRAND_GRADIENT,
  resolveBrandPalette,
  resolveBrandGradient,
} from './brand-colors.ts'

export type {
  ThemeMode,
  CiderpressTheme,
  CiderpressThemeInput,
  CiderpressThemeInputVariants,
  ThemeVariantTokens,
} from './theme-registry.ts'
export { DEFAULT_THEME_NAME, RESERVED_THEME_NAMES } from './constants.ts'
export {
  BUILT_IN_THEMES,
  defineTheme,
  themeInputEnvelopeSchema,
  themeToCss,
} from './theme-registry.ts'

// Public token surface — kept narrow. `CiderpressTokens` is the only shape
// downstream code should depend on; fine-grained sub-shapes are internal
// and may change without notice.
export type { CiderpressTokens } from './tokens.ts'

// Re-exported for `@ciderpress/ui` (internal monorepo consumer). Not part of
// the stable public contract — prefer `defineTheme` and the token tree
// in user code.
// @internal
export type { TokenPath } from './tokens.ts'
export { TOKEN_TO_CSS_VAR } from './tokens.ts'
