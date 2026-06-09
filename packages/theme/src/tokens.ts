/**
 * |===========================================================================|
 *   tokens.ts — Canonical design token registry for ciderpress
 *
 *   Defines the full `CiderpressTokens` shape and a deterministic mapping from
 *   every leaf token path to a `--cp-*` CSS custom property name.
 *
 *   Source of truth: `.snapshots/baseline/token-audit.txt` (Phase 4 audit of
 *   `packages/ui/src/theme/**\/*.css`). Every raw value identified in that
 *   audit has a corresponding entry in `CiderpressTokens` and an entry in
 *   `TOKEN_TO_CSS_VAR`.
 *
 *   Naming conventions (mirrors the audit):
 *     --cp-c-*           colors
 *     --cp-s-{N}         spacing scale (N = px value, 2-px grid)
 *     --cp-size-*        component sizes that aren't pure spacing
 *     --cp-radius-*      border-radius
 *     --cp-shadow-*      box-shadow
 *     --cp-z-*           z-index
 *     --cp-fs-*          font-size
 *     --cp-fw-*          font-weight
 *     --cp-ff-*          font-family
 *     --cp-lh-*          line-height
 *     --cp-letter-*      letter-spacing
 *     --cp-opacity-*     opacity
 *     --cp-duration-*    transition durations
 *     --cp-ease-*        transition easings
 *     --cp-bp-*          breakpoints
 *     --cp-blur-*        backdrop blur
 *     --cp-gradient-*    gradients
 * |===========================================================================|
 */

/**
 * Brand color palette — primary / hover / active / on-brand fg / soft tint
 * plus two derived light shades used by the Rspress compat layer.
 */
export interface CiderpressBrandColors {
  readonly primary: string
  readonly hover: string
  readonly active: string
  readonly fg: string
  readonly soft: string
  readonly onBrand: string
  readonly light: string
  readonly lighter: string
}

/**
 * Semantic state colors used across badges, terminal lines, and prompts.
 */
export interface CiderpressSemanticColors {
  readonly success: string
  readonly error: string
  readonly warn: string
  readonly info: string
  readonly muted: string
}

/**
 * Surface (background) colors.
 */
export interface CiderpressSurfaceColors {
  readonly bg: string
  readonly bgAlt: string
  readonly bgElv: string
  readonly bgSoft: string
  readonly bgIcon: string
  readonly homeBg: string
  readonly overlayFaint: string
  readonly gutter: string
  readonly codeBlockBg: string
}

/**
 * Text foreground colors.
 */
export interface CiderpressTextColors {
  readonly text1: string
  readonly text2: string
  readonly text3: string
}

/**
 * Border / divider colors.
 */
export interface CiderpressBorderColors {
  readonly border: string
  readonly divider: string
  readonly sidebarAltBorderDark: string
}

/**
 * Icon rotation tints — the 8-color registry used by home-card, section-card,
 * status-badge, field-badge-deprecated, hero-demo, and split syntax tokens.
 * Each color exposes `bg` (12% alpha) + `fg` (solid).
 */
export interface CiderpressTintColor {
  readonly bg: string
  readonly fg: string
}

/**
 * Brighter foreground-only tint variants used by syntax highlighting.
 */
export interface CiderpressTintBrightColor {
  readonly fg: string
}

/**
 * Full tint palette covering the 8 rotation colors plus the 2 brighter
 * variants and the purple "glow" used by card-hover shadow recipes.
 */
export interface CiderpressTintColors {
  readonly purple: CiderpressTintColor
  readonly blue: CiderpressTintColor
  readonly green: CiderpressTintColor
  readonly amber: CiderpressTintColor
  readonly red: CiderpressTintColor
  readonly slate: CiderpressTintColor
  readonly cyan: CiderpressTintColor
  readonly pink: CiderpressTintColor
  readonly purpleBright: CiderpressTintBrightColor
  readonly amberBright: CiderpressTintBrightColor
  readonly purpleGlow: string
}

/**
 * Terminal palette colors used by `.cp-window--terminal` and `.cp-term-text--*`.
 */
export interface CiderpressTerminalColors {
  readonly bg: string
  readonly titlebarBg: string
  readonly border: string
  readonly title: string
  readonly text: string
  readonly promptPrefix: string
  readonly output: string
  readonly red: string
  readonly green: string
  readonly blue: string
  readonly yellow: string
  readonly cyan: string
  readonly magenta: string
  readonly white: string
  readonly gray: string
  readonly success: string
  readonly error: string
  readonly warn: string
  readonly info: string
  readonly muted: string
  readonly bar: string
  readonly step: string
}

/**
 * Window chrome — traffic-light dots and title fallback color.
 */
export interface CiderpressWindowColors {
  readonly dotClose: string
  readonly dotMinimize: string
  readonly dotMaximize: string
  readonly titleFallback: string
}

/**
 * Status badge color pairs.
 */
export interface CiderpressBadgeColor {
  readonly bg: string
  readonly fg: string
}

/**
 * Status badge palette (info / success / warning / error).
 */
export interface CiderpressBadgeColors {
  readonly info: CiderpressBadgeColor
  readonly success: CiderpressBadgeColor
  readonly warning: CiderpressBadgeColor
  readonly error: CiderpressBadgeColor
}

/**
 * Scrollbar colors.
 */
export interface CiderpressScrollbarColors {
  readonly thumb: string
  readonly thumbHover: string
}

/**
 * Syntax highlighting tokens.
 */
export interface CiderpressSyntaxColors {
  readonly kw: string
  readonly str: string
  readonly fn: string
}

/**
 * Gradient stop colors (the cyan + purple stops used in the hero-title gradient).
 */
export interface CiderpressGradientColors {
  readonly heroCyan: string
  readonly heroPurple: string
}

/**
 * OpenAPI / OAS method + state badge colors. Maps to `--cp-oas-*` CSS vars.
 */
export interface CiderpressOasColors {
  readonly get: string
  readonly post: string
  readonly put: string
  readonly patch: string
  readonly delete: string
  readonly deprecated: string
  readonly required: string
}

/**
 * Brand button surface colors — used by primary CTAs across the docs site.
 */
export interface CiderpressButtonBrandColors {
  readonly bg: string
  readonly hoverBg: string
  readonly activeBg: string
  readonly text: string
}

/**
 * Button color sub-shape — currently exposes the brand button surface.
 */
export interface CiderpressButtonColors {
  readonly brand: CiderpressButtonBrandColors
}

/**
 * Full color sub-shape of `CiderpressTokens`.
 */
export interface CiderpressColors {
  readonly brand: CiderpressBrandColors
  readonly semantic: CiderpressSemanticColors
  readonly surface: CiderpressSurfaceColors
  readonly text: CiderpressTextColors
  readonly border: CiderpressBorderColors
  readonly tint: CiderpressTintColors
  readonly terminal: CiderpressTerminalColors
  readonly window: CiderpressWindowColors
  readonly badge: CiderpressBadgeColors
  readonly scrollbar: CiderpressScrollbarColors
  readonly syntax: CiderpressSyntaxColors
  readonly gradient: CiderpressGradientColors
  readonly oas: CiderpressOasColors
  readonly button: CiderpressButtonColors
}

/**
 * Spacing scale — a 2-px grid covering every padding/margin/gap value seen
 * in the audit.
 */
export interface CiderpressSpacing {
  readonly s1: string
  readonly s2: string
  readonly s3: string
  readonly s4: string
  readonly s5: string
  readonly s6: string
  readonly s8: string
  readonly s10: string
  readonly s12: string
  readonly s14: string
  readonly s16: string
  readonly s18: string
  readonly s20: string
  readonly s24: string
  readonly s28: string
  readonly s32: string
  readonly s40: string
  readonly s48: string
  readonly s56: string
  readonly s64: string
  readonly s72: string
  readonly s96: string
}

/**
 * Border-radius scale.
 */
export interface CiderpressRadii {
  readonly xs: string
  readonly xsSm: string
  readonly sm: string
  readonly mdSm: string
  readonly md: string
  readonly lg: string
  readonly mdLg: string
  readonly pill: string
}

/**
 * Font-family stack.
 */
export interface CiderpressFontFamilies {
  readonly sans: string
  readonly mono: string
}

/**
 * Font-weight scale.
 */
export interface CiderpressFontWeights {
  readonly regular: number
  readonly medium: number
  readonly semibold: number
  readonly bold: number
}

/**
 * Font-size scale — generic body + named slots for every component-specific
 * font-size flagged in the audit.
 */
export interface CiderpressFontSizes {
  readonly body: string
  readonly btn: string
  readonly bullet: string
  readonly code: string
  readonly eyebrow: string
  readonly tagline: string
  readonly heroTitle: string
  readonly splitTitle: string
  readonly featureTitle: string
  readonly featureDesc: string
  readonly featureLink: string
  readonly sectionTitle: string
  readonly sectionDesc: string
  readonly badge: string
  readonly tooltip: string
  readonly tooltipHeadline: string
  readonly tooltipCta: string
  readonly check: string
  readonly fieldName: string
  readonly fieldType: string
  readonly fieldBadge: string
  readonly fieldDefault: string
  readonly fieldDefaultCode: string
  readonly fieldBody: string
  readonly fieldGroupTitle: string
  readonly fieldTrigger: string
  readonly promptDesc: string
  readonly promptFeedback: string
  readonly promptBtn: string
  readonly promptMenuItem: string
  readonly promptMenuDesc: string
  readonly colorName: string
  readonly colorValue: string
  readonly windowTitle: string
  readonly windowTab: string
  readonly windowUrl: string
  readonly termBody: string
  readonly demoTitle: string
  readonly demoBody: string
  readonly askAi: string
  readonly askAiMark: string
  readonly askAiShortcut: string
  readonly sidebarLink: string
}

/**
 * Full font sub-shape of `CiderpressTokens`.
 */
export interface CiderpressFonts {
  readonly family: CiderpressFontFamilies
  readonly weight: CiderpressFontWeights
  readonly size: CiderpressFontSizes
}

/**
 * Box-shadow recipes.
 */
export interface CiderpressShadows {
  readonly cardHover: string
  readonly menu: string
  readonly tooltip: string
  readonly heroDemo: string
  readonly askAi: string
}

/**
 * Motion durations.
 */
export interface CiderpressMotionDurations {
  readonly fast: string
  readonly base: string
}

/**
 * Motion easings.
 */
export interface CiderpressMotionEasings {
  readonly base: string
}

/**
 * Motion sub-shape of `CiderpressTokens` (durations + easings).
 */
export interface CiderpressMotion {
  readonly duration: CiderpressMotionDurations
  readonly easing: CiderpressMotionEasings
}

/**
 * Z-index scale.
 */
export interface CiderpressZIndex {
  readonly dropdown: number
  readonly floating: number
  readonly tooltip: number
}

/**
 * Line-height scale (display through code).
 */
export interface CiderpressLineHeights {
  readonly display: string
  readonly tight: string
  readonly tighter: string
  readonly snug: string
  readonly base: string
  readonly relaxed: string
  readonly demo: string
  readonly code: string
  readonly sidebar: string
}

/**
 * Letter-spacing scale.
 */
export interface CiderpressLetterSpacings {
  readonly wide: string
  readonly eyebrow: string
  readonly display: string
  readonly hero: string
}

/**
 * Opacity tokens.
 */
export interface CiderpressOpacities {
  readonly muted: string
  readonly deprecated: string
  readonly hover: string
}

/**
 * Component / element sizes that aren't pure spacing.
 */
export interface CiderpressSizes {
  readonly titlebar: string
  readonly windowDot: string
  readonly windowTabDot: string
  readonly browserTabMax: string
  readonly browserIcon: string
  readonly browserUrlbar: string
  readonly iconBox: string
  readonly iconBoxSm: string
  readonly iconSvg: string
  readonly iconSvgSm: string
  readonly iconSm: string
  readonly contentMax: string
  readonly focusRing: string
  readonly focusRingOffset: string
  readonly tooltipMax: string
  readonly swatch: string
  readonly demoMax: string
  readonly splitMax: string
  readonly heroGrid: string
  readonly heroMax: string
  readonly taglineMax: string
  readonly promptIcon: string
  readonly promptBtn: string
  readonly menuMin: string
  readonly promptMenuIcon: string
  readonly check: string
  readonly chevron: string
  readonly askAiIcon: string
  readonly sidebarCircle: string
  readonly scrollbar: string
}

/**
 * Breakpoint widths (max-width media queries).
 */
export interface CiderpressBreakpoints {
  readonly sm: string
  readonly md: string
  readonly mdLg: string
  readonly content: string
}

/**
 * Backdrop blur scale.
 */
export interface CiderpressBlurs {
  readonly base: string
}

/**
 * Pre-composed gradient tokens (brand + hero-title).
 */
export interface CiderpressGradients {
  readonly brand: string
  readonly heroTitle: string
}

/**
 * Top-level token shape — every key here maps to one or more `--cp-*` CSS
 * custom properties via `TOKEN_TO_CSS_VAR`.
 *
 * @example
 * const css = `padding: ${TOKEN_TO_CSS_VAR['spacing.s16']};`
 * // => `padding: var(--cp-s-16);`
 */
export interface CiderpressTokens {
  readonly colors: CiderpressColors
  readonly spacing: CiderpressSpacing
  readonly radii: CiderpressRadii
  readonly fonts: CiderpressFonts
  readonly shadows: CiderpressShadows
  readonly motion: CiderpressMotion
  readonly zIndex: CiderpressZIndex
  readonly lineHeights: CiderpressLineHeights
  readonly letterSpacings: CiderpressLetterSpacings
  readonly opacities: CiderpressOpacities
  readonly sizes: CiderpressSizes
  readonly breakpoints: CiderpressBreakpoints
  readonly blurs: CiderpressBlurs
  readonly gradients: CiderpressGradients
}

/**
 * String literal union of every leaf token path in `CiderpressTokens`.
 * Path segments are joined with `.` and ordered from outer to inner key.
 */
export type TokenPath =
  | 'colors.brand.primary'
  | 'colors.brand.hover'
  | 'colors.brand.active'
  | 'colors.brand.fg'
  | 'colors.brand.soft'
  | 'colors.brand.onBrand'
  | 'colors.brand.light'
  | 'colors.brand.lighter'
  // colors.semantic
  | 'colors.semantic.success'
  | 'colors.semantic.error'
  | 'colors.semantic.warn'
  | 'colors.semantic.info'
  | 'colors.semantic.muted'
  // colors.surface
  | 'colors.surface.bg'
  | 'colors.surface.bgAlt'
  | 'colors.surface.bgElv'
  | 'colors.surface.bgSoft'
  | 'colors.surface.bgIcon'
  | 'colors.surface.homeBg'
  | 'colors.surface.overlayFaint'
  | 'colors.surface.gutter'
  | 'colors.surface.codeBlockBg'
  // colors.text
  | 'colors.text.text1'
  | 'colors.text.text2'
  | 'colors.text.text3'
  // colors.border
  | 'colors.border.border'
  | 'colors.border.divider'
  | 'colors.border.sidebarAltBorderDark'
  // colors.tint
  | 'colors.tint.purple.bg'
  | 'colors.tint.purple.fg'
  | 'colors.tint.blue.bg'
  | 'colors.tint.blue.fg'
  | 'colors.tint.green.bg'
  | 'colors.tint.green.fg'
  | 'colors.tint.amber.bg'
  | 'colors.tint.amber.fg'
  | 'colors.tint.red.bg'
  | 'colors.tint.red.fg'
  | 'colors.tint.slate.bg'
  | 'colors.tint.slate.fg'
  | 'colors.tint.cyan.bg'
  | 'colors.tint.cyan.fg'
  | 'colors.tint.pink.bg'
  | 'colors.tint.pink.fg'
  | 'colors.tint.purpleBright.fg'
  | 'colors.tint.amberBright.fg'
  | 'colors.tint.purpleGlow'
  // colors.terminal
  | 'colors.terminal.bg'
  | 'colors.terminal.titlebarBg'
  | 'colors.terminal.border'
  | 'colors.terminal.title'
  | 'colors.terminal.text'
  | 'colors.terminal.promptPrefix'
  | 'colors.terminal.output'
  | 'colors.terminal.red'
  | 'colors.terminal.green'
  | 'colors.terminal.blue'
  | 'colors.terminal.yellow'
  | 'colors.terminal.cyan'
  | 'colors.terminal.magenta'
  | 'colors.terminal.white'
  | 'colors.terminal.gray'
  | 'colors.terminal.success'
  | 'colors.terminal.error'
  | 'colors.terminal.warn'
  | 'colors.terminal.info'
  | 'colors.terminal.muted'
  | 'colors.terminal.bar'
  | 'colors.terminal.step'
  // colors.window
  | 'colors.window.dotClose'
  | 'colors.window.dotMinimize'
  | 'colors.window.dotMaximize'
  | 'colors.window.titleFallback'
  // colors.badge
  | 'colors.badge.info.bg'
  | 'colors.badge.info.fg'
  | 'colors.badge.success.bg'
  | 'colors.badge.success.fg'
  | 'colors.badge.warning.bg'
  | 'colors.badge.warning.fg'
  | 'colors.badge.error.bg'
  | 'colors.badge.error.fg'
  // colors.scrollbar
  | 'colors.scrollbar.thumb'
  | 'colors.scrollbar.thumbHover'
  // colors.syntax
  | 'colors.syntax.kw'
  | 'colors.syntax.str'
  | 'colors.syntax.fn'
  // colors.gradient
  | 'colors.gradient.heroCyan'
  | 'colors.gradient.heroPurple'
  // colors.oas
  | 'colors.oas.get'
  | 'colors.oas.post'
  | 'colors.oas.put'
  | 'colors.oas.patch'
  | 'colors.oas.delete'
  | 'colors.oas.deprecated'
  | 'colors.oas.required'
  // colors.button
  | 'colors.button.brand.bg'
  | 'colors.button.brand.hoverBg'
  | 'colors.button.brand.activeBg'
  | 'colors.button.brand.text'
  // spacing
  | 'spacing.s1'
  | 'spacing.s2'
  | 'spacing.s3'
  | 'spacing.s4'
  | 'spacing.s5'
  | 'spacing.s6'
  | 'spacing.s8'
  | 'spacing.s10'
  | 'spacing.s12'
  | 'spacing.s14'
  | 'spacing.s16'
  | 'spacing.s18'
  | 'spacing.s20'
  | 'spacing.s24'
  | 'spacing.s28'
  | 'spacing.s32'
  | 'spacing.s40'
  | 'spacing.s48'
  | 'spacing.s56'
  | 'spacing.s64'
  | 'spacing.s72'
  | 'spacing.s96'
  // radii
  | 'radii.xs'
  | 'radii.xsSm'
  | 'radii.sm'
  | 'radii.mdSm'
  | 'radii.md'
  | 'radii.lg'
  | 'radii.mdLg'
  | 'radii.pill'
  // fonts.family
  | 'fonts.family.sans'
  | 'fonts.family.mono'
  // fonts.weight
  | 'fonts.weight.regular'
  | 'fonts.weight.medium'
  | 'fonts.weight.semibold'
  | 'fonts.weight.bold'
  // fonts.size
  | 'fonts.size.body'
  | 'fonts.size.btn'
  | 'fonts.size.bullet'
  | 'fonts.size.code'
  | 'fonts.size.eyebrow'
  | 'fonts.size.tagline'
  | 'fonts.size.heroTitle'
  | 'fonts.size.splitTitle'
  | 'fonts.size.featureTitle'
  | 'fonts.size.featureDesc'
  | 'fonts.size.featureLink'
  | 'fonts.size.sectionTitle'
  | 'fonts.size.sectionDesc'
  | 'fonts.size.badge'
  | 'fonts.size.tooltip'
  | 'fonts.size.tooltipHeadline'
  | 'fonts.size.tooltipCta'
  | 'fonts.size.check'
  | 'fonts.size.fieldName'
  | 'fonts.size.fieldType'
  | 'fonts.size.fieldBadge'
  | 'fonts.size.fieldDefault'
  | 'fonts.size.fieldDefaultCode'
  | 'fonts.size.fieldBody'
  | 'fonts.size.fieldGroupTitle'
  | 'fonts.size.fieldTrigger'
  | 'fonts.size.promptDesc'
  | 'fonts.size.promptFeedback'
  | 'fonts.size.promptBtn'
  | 'fonts.size.promptMenuItem'
  | 'fonts.size.promptMenuDesc'
  | 'fonts.size.colorName'
  | 'fonts.size.colorValue'
  | 'fonts.size.windowTitle'
  | 'fonts.size.windowTab'
  | 'fonts.size.windowUrl'
  | 'fonts.size.termBody'
  | 'fonts.size.demoTitle'
  | 'fonts.size.demoBody'
  | 'fonts.size.askAi'
  | 'fonts.size.askAiMark'
  | 'fonts.size.askAiShortcut'
  | 'fonts.size.sidebarLink'
  // shadows
  | 'shadows.cardHover'
  | 'shadows.menu'
  | 'shadows.tooltip'
  | 'shadows.heroDemo'
  | 'shadows.askAi'
  // motion.duration
  | 'motion.duration.fast'
  | 'motion.duration.base'
  // motion.easing
  | 'motion.easing.base'
  // zIndex
  | 'zIndex.dropdown'
  | 'zIndex.floating'
  | 'zIndex.tooltip'
  // lineHeights
  | 'lineHeights.display'
  | 'lineHeights.tight'
  | 'lineHeights.tighter'
  | 'lineHeights.snug'
  | 'lineHeights.base'
  | 'lineHeights.relaxed'
  | 'lineHeights.demo'
  | 'lineHeights.code'
  | 'lineHeights.sidebar'
  // letterSpacings
  | 'letterSpacings.wide'
  | 'letterSpacings.eyebrow'
  | 'letterSpacings.display'
  | 'letterSpacings.hero'
  // opacities
  | 'opacities.muted'
  | 'opacities.deprecated'
  | 'opacities.hover'
  // sizes
  | 'sizes.titlebar'
  | 'sizes.windowDot'
  | 'sizes.windowTabDot'
  | 'sizes.browserTabMax'
  | 'sizes.browserIcon'
  | 'sizes.browserUrlbar'
  | 'sizes.iconBox'
  | 'sizes.iconBoxSm'
  | 'sizes.iconSvg'
  | 'sizes.iconSvgSm'
  | 'sizes.iconSm'
  | 'sizes.contentMax'
  | 'sizes.focusRing'
  | 'sizes.focusRingOffset'
  | 'sizes.tooltipMax'
  | 'sizes.swatch'
  | 'sizes.demoMax'
  | 'sizes.splitMax'
  | 'sizes.heroGrid'
  | 'sizes.heroMax'
  | 'sizes.taglineMax'
  | 'sizes.promptIcon'
  | 'sizes.promptBtn'
  | 'sizes.menuMin'
  | 'sizes.promptMenuIcon'
  | 'sizes.check'
  | 'sizes.chevron'
  | 'sizes.askAiIcon'
  | 'sizes.sidebarCircle'
  | 'sizes.scrollbar'
  // breakpoints
  | 'breakpoints.sm'
  | 'breakpoints.md'
  | 'breakpoints.mdLg'
  | 'breakpoints.content'
  // blurs
  | 'blurs.base'
  // gradients
  | 'gradients.brand'
  | 'gradients.heroTitle'

/**
 * Canonical mapping from every `CiderpressTokens` leaf path to its `--cp-*`
 * CSS custom-property name. Every key in `CiderpressTokens` MUST appear here
 * exactly once, and every value MUST be unique.
 *
 * Naming follows the conventions documented at the top of this file and
 * matches the `--cp-*` names proposed in `.snapshots/baseline/token-audit.txt`.
 */
export const TOKEN_TO_CSS_VAR: Readonly<Record<TokenPath, string>> = Object.freeze({
  'colors.brand.primary': '--cp-c-brand-1',
  'colors.brand.hover': '--cp-c-brand-2',
  'colors.brand.active': '--cp-c-brand-3',
  'colors.brand.fg': '--cp-c-brand-fg',
  'colors.brand.soft': '--cp-c-brand-soft',
  'colors.brand.onBrand': '--cp-c-on-brand',
  'colors.brand.light': '--cp-c-brand-light',
  'colors.brand.lighter': '--cp-c-brand-lighter',
  'colors.semantic.success': '--cp-c-success',
  'colors.semantic.error': '--cp-c-error',
  'colors.semantic.warn': '--cp-c-warn',
  'colors.semantic.info': '--cp-c-info',
  'colors.semantic.muted': '--cp-c-muted',
  'colors.surface.bg': '--cp-c-bg',
  'colors.surface.bgAlt': '--cp-c-bg-alt',
  'colors.surface.bgElv': '--cp-c-bg-elv',
  'colors.surface.bgSoft': '--cp-c-bg-soft',
  'colors.surface.bgIcon': '--cp-c-bg-icon',
  'colors.surface.homeBg': '--cp-c-home-bg',
  'colors.surface.overlayFaint': '--cp-c-overlay-faint',
  'colors.surface.gutter': '--cp-c-gutter',
  'colors.surface.codeBlockBg': '--cp-code-block-bg',
  'colors.text.text1': '--cp-c-text-1',
  'colors.text.text2': '--cp-c-text-2',
  'colors.text.text3': '--cp-c-text-3',
  'colors.border.border': '--cp-c-border',
  'colors.border.divider': '--cp-c-divider',
  'colors.border.sidebarAltBorderDark': '--cp-c-sidebar-alt-border-dark',
  'colors.tint.purple.bg': '--cp-c-tint-purple-bg',
  'colors.tint.purple.fg': '--cp-c-tint-purple-fg',
  'colors.tint.blue.bg': '--cp-c-tint-blue-bg',
  'colors.tint.blue.fg': '--cp-c-tint-blue-fg',
  'colors.tint.green.bg': '--cp-c-tint-green-bg',
  'colors.tint.green.fg': '--cp-c-tint-green-fg',
  'colors.tint.amber.bg': '--cp-c-tint-amber-bg',
  'colors.tint.amber.fg': '--cp-c-tint-amber-fg',
  'colors.tint.red.bg': '--cp-c-tint-red-bg',
  'colors.tint.red.fg': '--cp-c-tint-red-fg',
  'colors.tint.slate.bg': '--cp-c-tint-slate-bg',
  'colors.tint.slate.fg': '--cp-c-tint-slate-fg',
  'colors.tint.cyan.bg': '--cp-c-tint-cyan-bg',
  'colors.tint.cyan.fg': '--cp-c-tint-cyan-fg',
  'colors.tint.pink.bg': '--cp-c-tint-pink-bg',
  'colors.tint.pink.fg': '--cp-c-tint-pink-fg',
  'colors.tint.purpleBright.fg': '--cp-c-tint-purple-bright-fg',
  'colors.tint.amberBright.fg': '--cp-c-tint-amber-bright-fg',
  'colors.tint.purpleGlow': '--cp-c-tint-purple-glow',
  'colors.terminal.bg': '--cp-c-term-bg',
  'colors.terminal.titlebarBg': '--cp-c-term-titlebar-bg',
  'colors.terminal.border': '--cp-c-term-border',
  'colors.terminal.title': '--cp-c-term-title',
  'colors.terminal.text': '--cp-c-term-text',
  'colors.terminal.promptPrefix': '--cp-c-term-prompt-prefix',
  'colors.terminal.output': '--cp-c-term-output',
  'colors.terminal.red': '--cp-c-term-red',
  'colors.terminal.green': '--cp-c-term-green',
  'colors.terminal.blue': '--cp-c-term-blue',
  'colors.terminal.yellow': '--cp-c-term-yellow',
  'colors.terminal.cyan': '--cp-c-term-cyan',
  'colors.terminal.magenta': '--cp-c-term-magenta',
  'colors.terminal.white': '--cp-c-term-white',
  'colors.terminal.gray': '--cp-c-term-gray',
  'colors.terminal.success': '--cp-c-term-success',
  'colors.terminal.error': '--cp-c-term-error',
  'colors.terminal.warn': '--cp-c-term-warn',
  'colors.terminal.info': '--cp-c-term-info',
  'colors.terminal.muted': '--cp-c-term-muted',
  'colors.terminal.bar': '--cp-c-term-bar',
  'colors.terminal.step': '--cp-c-term-step',
  'colors.window.dotClose': '--cp-c-window-dot-close',
  'colors.window.dotMinimize': '--cp-c-window-dot-minimize',
  'colors.window.dotMaximize': '--cp-c-window-dot-maximize',
  'colors.window.titleFallback': '--cp-c-window-title-fallback',
  'colors.badge.info.bg': '--cp-c-badge-info-bg',
  'colors.badge.info.fg': '--cp-c-badge-info-fg',
  'colors.badge.success.bg': '--cp-c-badge-success-bg',
  'colors.badge.success.fg': '--cp-c-badge-success-fg',
  'colors.badge.warning.bg': '--cp-c-badge-warning-bg',
  'colors.badge.warning.fg': '--cp-c-badge-warning-fg',
  'colors.badge.error.bg': '--cp-c-badge-error-bg',
  'colors.badge.error.fg': '--cp-c-badge-error-fg',
  'colors.scrollbar.thumb': '--cp-c-scrollbar-thumb',
  'colors.scrollbar.thumbHover': '--cp-c-scrollbar-thumb-hover',
  'colors.syntax.kw': '--cp-c-syntax-kw',
  'colors.syntax.str': '--cp-c-syntax-str',
  'colors.syntax.fn': '--cp-c-syntax-fn',
  'colors.gradient.heroCyan': '--cp-c-gradient-hero-cyan',
  'colors.gradient.heroPurple': '--cp-c-gradient-hero-purple',
  'colors.oas.get': '--cp-oas-get',
  'colors.oas.post': '--cp-oas-post',
  'colors.oas.put': '--cp-oas-put',
  'colors.oas.patch': '--cp-oas-patch',
  'colors.oas.delete': '--cp-oas-delete',
  'colors.oas.deprecated': '--cp-oas-deprecated',
  'colors.oas.required': '--cp-oas-required',
  'colors.button.brand.bg': '--cp-button-brand-bg',
  'colors.button.brand.hoverBg': '--cp-button-brand-hover-bg',
  'colors.button.brand.activeBg': '--cp-button-brand-active-bg',
  'colors.button.brand.text': '--cp-button-brand-text',
  'spacing.s1': '--cp-s-1',
  'spacing.s2': '--cp-s-2',
  'spacing.s3': '--cp-s-3',
  'spacing.s4': '--cp-s-4',
  'spacing.s5': '--cp-s-5',
  'spacing.s6': '--cp-s-6',
  'spacing.s8': '--cp-s-8',
  'spacing.s10': '--cp-s-10',
  'spacing.s12': '--cp-s-12',
  'spacing.s14': '--cp-s-14',
  'spacing.s16': '--cp-s-16',
  'spacing.s18': '--cp-s-18',
  'spacing.s20': '--cp-s-20',
  'spacing.s24': '--cp-s-24',
  'spacing.s28': '--cp-s-28',
  'spacing.s32': '--cp-s-32',
  'spacing.s40': '--cp-s-40',
  'spacing.s48': '--cp-s-48',
  'spacing.s56': '--cp-s-56',
  'spacing.s64': '--cp-s-64',
  'spacing.s72': '--cp-s-72',
  'spacing.s96': '--cp-s-96',
  'radii.xs': '--cp-radius-xs',
  'radii.xsSm': '--cp-radius-xs-sm',
  'radii.sm': '--cp-radius-sm',
  'radii.mdSm': '--cp-radius-md-sm',
  'radii.md': '--cp-radius-md',
  'radii.lg': '--cp-radius-lg',
  'radii.mdLg': '--cp-radius-md-lg',
  'radii.pill': '--cp-radius-pill',
  'fonts.family.sans': '--cp-ff-sans',
  'fonts.family.mono': '--cp-ff-mono',
  'fonts.weight.regular': '--cp-fw-regular',
  'fonts.weight.medium': '--cp-fw-medium',
  'fonts.weight.semibold': '--cp-fw-semibold',
  'fonts.weight.bold': '--cp-fw-bold',
  'fonts.size.body': '--cp-fs-body',
  'fonts.size.btn': '--cp-fs-btn',
  'fonts.size.bullet': '--cp-fs-bullet',
  'fonts.size.code': '--cp-fs-code',
  'fonts.size.eyebrow': '--cp-fs-eyebrow',
  'fonts.size.tagline': '--cp-fs-tagline',
  'fonts.size.heroTitle': '--cp-fs-hero-title',
  'fonts.size.splitTitle': '--cp-fs-split-title',
  'fonts.size.featureTitle': '--cp-fs-feature-title',
  'fonts.size.featureDesc': '--cp-fs-feature-desc',
  'fonts.size.featureLink': '--cp-fs-feature-link',
  'fonts.size.sectionTitle': '--cp-fs-section-title',
  'fonts.size.sectionDesc': '--cp-fs-section-desc',
  'fonts.size.badge': '--cp-fs-badge',
  'fonts.size.tooltip': '--cp-fs-tooltip',
  'fonts.size.tooltipHeadline': '--cp-fs-tooltip-headline',
  'fonts.size.tooltipCta': '--cp-fs-tooltip-cta',
  'fonts.size.check': '--cp-fs-check',
  'fonts.size.fieldName': '--cp-fs-field-name',
  'fonts.size.fieldType': '--cp-fs-field-type',
  'fonts.size.fieldBadge': '--cp-fs-field-badge',
  'fonts.size.fieldDefault': '--cp-fs-field-default',
  'fonts.size.fieldDefaultCode': '--cp-fs-field-default-code',
  'fonts.size.fieldBody': '--cp-fs-field-body',
  'fonts.size.fieldGroupTitle': '--cp-fs-field-group-title',
  'fonts.size.fieldTrigger': '--cp-fs-field-trigger',
  'fonts.size.promptDesc': '--cp-fs-prompt-desc',
  'fonts.size.promptFeedback': '--cp-fs-prompt-feedback',
  'fonts.size.promptBtn': '--cp-fs-prompt-btn',
  'fonts.size.promptMenuItem': '--cp-fs-prompt-menu-item',
  'fonts.size.promptMenuDesc': '--cp-fs-prompt-menu-desc',
  'fonts.size.colorName': '--cp-fs-color-name',
  'fonts.size.colorValue': '--cp-fs-color-value',
  'fonts.size.windowTitle': '--cp-fs-window-title',
  'fonts.size.windowTab': '--cp-fs-window-tab',
  'fonts.size.windowUrl': '--cp-fs-window-url',
  'fonts.size.termBody': '--cp-fs-term-body',
  'fonts.size.demoTitle': '--cp-fs-demo-title',
  'fonts.size.demoBody': '--cp-fs-demo-body',
  'fonts.size.askAi': '--cp-fs-ask-ai',
  'fonts.size.askAiMark': '--cp-fs-ask-ai-mark',
  'fonts.size.askAiShortcut': '--cp-fs-ask-ai-shortcut',
  'fonts.size.sidebarLink': '--cp-fs-sidebar-link',
  'shadows.cardHover': '--cp-shadow-card-hover',
  'shadows.menu': '--cp-shadow-menu',
  'shadows.tooltip': '--cp-shadow-tooltip',
  'shadows.heroDemo': '--cp-shadow-hero-demo',
  'shadows.askAi': '--cp-shadow-ask-ai',
  'motion.duration.fast': '--cp-duration-fast',
  'motion.duration.base': '--cp-duration-base',
  'motion.easing.base': '--cp-ease-base',
  'zIndex.dropdown': '--cp-z-dropdown',
  'zIndex.floating': '--cp-z-floating',
  'zIndex.tooltip': '--cp-z-tooltip',
  'lineHeights.display': '--cp-lh-display',
  'lineHeights.tight': '--cp-lh-tight',
  'lineHeights.tighter': '--cp-lh-tighter',
  'lineHeights.snug': '--cp-lh-snug',
  'lineHeights.base': '--cp-lh-base',
  'lineHeights.relaxed': '--cp-lh-relaxed',
  'lineHeights.demo': '--cp-lh-demo',
  'lineHeights.code': '--cp-lh-code',
  'lineHeights.sidebar': '--cp-lh-sidebar',
  'letterSpacings.wide': '--cp-letter-wide',
  'letterSpacings.eyebrow': '--cp-letter-eyebrow',
  'letterSpacings.display': '--cp-letter-display',
  'letterSpacings.hero': '--cp-letter-hero',
  'opacities.muted': '--cp-opacity-muted',
  'opacities.deprecated': '--cp-opacity-deprecated',
  'opacities.hover': '--cp-opacity-hover',
  'sizes.titlebar': '--cp-size-titlebar',
  'sizes.windowDot': '--cp-size-window-dot',
  'sizes.windowTabDot': '--cp-size-window-tab-dot',
  'sizes.browserTabMax': '--cp-size-browser-tab-max',
  'sizes.browserIcon': '--cp-size-browser-icon',
  'sizes.browserUrlbar': '--cp-size-browser-urlbar',
  'sizes.iconBox': '--cp-size-icon-box',
  'sizes.iconBoxSm': '--cp-size-icon-box-sm',
  'sizes.iconSvg': '--cp-size-icon-svg',
  'sizes.iconSvgSm': '--cp-size-icon-svg-sm',
  'sizes.iconSm': '--cp-size-icon-sm',
  'sizes.contentMax': '--cp-size-content-max',
  'sizes.focusRing': '--cp-size-focus-ring',
  'sizes.focusRingOffset': '--cp-size-focus-ring-offset',
  'sizes.tooltipMax': '--cp-size-tooltip-max',
  'sizes.swatch': '--cp-size-swatch',
  'sizes.demoMax': '--cp-size-demo-max',
  'sizes.splitMax': '--cp-size-split-max',
  'sizes.heroGrid': '--cp-size-hero-grid',
  'sizes.heroMax': '--cp-size-hero-max',
  'sizes.taglineMax': '--cp-size-tagline-max',
  'sizes.promptIcon': '--cp-size-prompt-icon',
  'sizes.promptBtn': '--cp-size-prompt-btn',
  'sizes.menuMin': '--cp-size-menu-min',
  'sizes.promptMenuIcon': '--cp-size-prompt-menu-icon',
  'sizes.check': '--cp-size-check',
  'sizes.chevron': '--cp-size-chevron',
  'sizes.askAiIcon': '--cp-size-ask-ai-icon',
  'sizes.sidebarCircle': '--cp-size-sidebar-circle',
  'sizes.scrollbar': '--cp-size-scrollbar',
  'breakpoints.sm': '--cp-bp-sm',
  'breakpoints.md': '--cp-bp-md',
  'breakpoints.mdLg': '--cp-bp-md-lg',
  'breakpoints.content': '--cp-bp-content',
  'blurs.base': '--cp-blur-base',
  'gradients.brand': '--cp-gradient-brand',
  'gradients.heroTitle': '--cp-gradient-hero-title',
})
