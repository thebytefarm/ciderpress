import { pickBy } from 'massaman/object'
import { isNotNil } from 'massaman/predicate'
import { z } from 'zod'

import { DEFAULT_THEME_NAME, RESERVED_THEME_NAMES } from './constants.ts'
import { themeNameSchema, tokensSchema } from './schema.ts'
import type { TokenPath, CiderpressTokens } from './tokens.ts'
import { TOKEN_TO_CSS_VAR } from './tokens.ts'
import type { BuiltInThemeName, ThemeVariant } from './types.ts'

/**
 * Variant preference order used when `defineTheme` callers omit
 * `defaultVariant`. We pick `'dark'` first because the framework treats
 * dark as its baseline aesthetic.
 */
const DEFAULT_VARIANT_ORDER: readonly ThemeVariant[] = ['dark', 'light'] as const

/**
 * Name of the framework's default theme — used by `renderThemeCss` to
 * decide which theme also emits the `:root { ... }` FOUC fallback. Kept
 * in lockstep with `BUILT_IN_THEMES[DEFAULT_THEME_NAME]` and the build-time
 * fallback in `packages/ui/src/config.ts`. The legacy `'default'` slug
 * aliases to this theme via `THEME_ALIASES` in `definitions.ts`.
 */
const FOUC_ROOT_THEME_NAME: typeof DEFAULT_THEME_NAME = DEFAULT_THEME_NAME

/**
 * Refine guard used by `themeInputEnvelopeSchema` to reject
 * `defineTheme({ name: ... })` calls whose name collides with a reserved
 * built-in slug or the legacy `'default'` alias.
 *
 * @private
 * @param name - Theme name from the validated envelope
 * @returns `true` when the name is free to register, `false` otherwise
 */
function isFreeThemeName(name: string): boolean {
  if (name === 'default') {
    return false
  }
  return !RESERVED_THEME_NAMES.includes(name)
}

/**
 * Human-readable error message emitted when {@link isFreeThemeName} rejects.
 *
 * @private
 * @param name - Reserved theme name the caller tried to register
 * @returns Error message for the Zod refine
 */
function reservedThemeNameMessage(name: string): string {
  return `theme name "${name}" is reserved by a built-in`
}

/**
 * Best-effort recovery of the offending theme name from a Zod refine issue
 * input. The envelope's outer `.refine` receives the full parsed object, so
 * the name should always be a string; the fallback only fires if Zod's
 * internal issue shape ever drifts.
 *
 * @private
 * @param input - Raw `issue.input` from the refine error callback
 * @returns The reserved name when reachable, `'<reserved>'` otherwise
 */
function extractReservedName(input: unknown): string {
  if (input === null || typeof input !== 'object') {
    return '<reserved>'
  }
  const { name } = input as { readonly name?: unknown }
  if (typeof name !== 'string') {
    return '<reserved>'
  }
  return name
}

/**
 * Base envelope schema — shape, variant keys, and `defaultVariant`
 * cross-reference. Used internally by {@link BUILT_IN_THEMES} (which legitimately
 * registers the reserved built-in names) so it must NOT include the
 * reserved-name refine. The public {@link themeInputEnvelopeSchema} extends
 * this with the additional reservation guard for user-facing factories.
 *
 * @private
 */
const baseThemeInputEnvelopeSchema = z
  .object({
    name: z.string(),
    variants: z
      .object({
        dark: z.unknown().optional(),
        light: z.unknown().optional(),
      })
      .strict()
      .refine((v) => v.dark !== undefined || v.light !== undefined, {
        message: 'Theme variants must declare at least one of `dark` or `light`',
      }),
    defaultVariant: z.enum(['dark', 'light']).optional(),
  })
  .strict()
  .refine(
    (theme) => {
      if (theme.defaultVariant === undefined) {
        return true
      }
      return theme.variants[theme.defaultVariant] !== undefined
    },
    {
      message: '`defaultVariant` must point at a variant declared in `variants`',
      path: ['defaultVariant'],
    }
  )

/**
 * Envelope schema for `defineTheme` input. Validates the *shape* — name,
 * variant keys, `defaultVariant` cross-reference — AND rejects names that
 * collide with a reserved built-in slug or the legacy `'default'` alias.
 *
 * Re-used by `@ciderpress/config`'s schema (imported via `@ciderpress/theme`)
 * so both packages enforce identical invariants from a single source.
 * Errors surface with stable paths (`variants`, `defaultVariant`, `name`)
 * so consumers can pinpoint the problem.
 */
export const themeInputEnvelopeSchema = baseThemeInputEnvelopeSchema.refine(
  (theme) => isFreeThemeName(theme.name),
  {
    error: (issue) => reservedThemeNameMessage(extractReservedName(issue.input)),
    path: ['name'],
  }
)

/**
 * Shape of the raw brand-palette entries below. Mirrors the public
 * `BrandPalette` interface re-exported from `brand-colors.ts`, but is declared
 * locally so this module does not pull a value/type import from
 * `brand-colors.ts` (which already depends on `BUILT_IN_THEMES`).
 */
interface RawBrandPalette {
  readonly primary: string
  readonly hover: string
  readonly active: string
  readonly fg: string
  readonly soft: string
  readonly light: string
  readonly lighter: string
}

/**
 * Raw brand palette literals — the source of truth for every built-in theme's
 * `colors.brand` token group. Keeping these as module-private constants lets
 * `brand-colors.ts` derive its public `BRAND_COLORS` from `BUILT_IN_THEMES`
 * without introducing a circular import.
 *
 * `light` / `lighter` shades feed the Rspress compat block — they live on the
 * brand surface so `COMPAT_VAR_MAP` can pick them up by token path.
 */
const BRAND_PALETTES: Readonly<Record<BuiltInThemeName, RawBrandPalette>> = Object.freeze({
  honeycrisp: {
    primary: '#dc2626',
    hover: '#b91c1c',
    active: '#7f1d1d',
    fg: '#ffffff',
    soft: 'rgba(220, 38, 38, 0.14)',
    // Accent copy on dark resolves to `light`. Red 400 (#f87171) read as
    // salmon rather than as the brand; red 500 holds AA at 5.26:1 on the
    // near-black canvas while staying recognisably red, and still sits
    // between `primary` and `lighter` on the ramp.
    light: '#ef4444',
    lighter: '#fca5a5',
  },
  grannysmith: {
    primary: '#65a30d',
    hover: '#4d7c0f',
    active: '#365314',
    fg: '#ffffff',
    soft: 'rgba(101, 163, 13, 0.14)',
    light: '#a3e635',
    lighter: '#bef264',
  },
  mulled: {
    primary: '#991b1b',
    hover: '#7f1d1d',
    active: '#450a0a',
    fg: '#ffffff',
    soft: 'rgba(153, 27, 27, 0.14)',
    // Accent copy on dark resolves to `light`. Red 600 (#dc2626) missed the
    // 4.5:1 bar at 4.10:1; red 500 clears it at 5.26:1 and still lightens the
    // deep burgundy `primary`.
    light: '#ef4444',
    lighter: '#f87171',
  },
  amber: {
    primary: '#d97706',
    hover: '#b45309',
    active: '#78350f',
    fg: '#ffffff',
    soft: 'rgba(217, 119, 6, 0.14)',
    light: '#fbbf24',
    lighter: '#fcd34d',
  },
  midnight: {
    primary: '#60a5fa',
    hover: '#3b82f6',
    active: '#2563eb',
    fg: '#050505',
    soft: 'rgba(96, 165, 250, 0.14)',
    light: '#93c5fd',
    lighter: '#bfdbfe',
  },
  arcade: {
    primary: '#00ff88',
    hover: '#00cc6a',
    active: '#00aa55',
    fg: '#001a0a',
    soft: 'rgba(0, 255, 136, 0.14)',
    light: '#66ffbb',
    lighter: '#99ffcc',
  },
})

/**
 * Declared-order list of every leaf token path in `TOKEN_TO_CSS_VAR`.
 * Captured once at module load so `themeToCss` output stays byte-deterministic
 * regardless of how callers construct token trees.
 */
const TOKEN_PATHS: readonly (keyof typeof TOKEN_TO_CSS_VAR)[] = Object.freeze(
  Object.keys(TOKEN_TO_CSS_VAR) as (keyof typeof TOKEN_TO_CSS_VAR)[]
)

/**
 * Precomputed `[path, cssVar, segments]` triples for every leaf token path.
 *
 * `renderDeclaration` runs once per token per theme per build — splitting the
 * dotted path on every call is wasted allocation. Splitting once at module
 * load lets the hot path read three already-resolved values per declaration.
 */
const TOKEN_RENDER_PLAN: readonly {
  readonly path: keyof typeof TOKEN_TO_CSS_VAR
  readonly cssVar: string
  readonly segments: readonly string[]
}[] = Object.freeze(
  TOKEN_PATHS.map((path) =>
    Object.freeze({
      path,
      cssVar: TOKEN_TO_CSS_VAR[path],
      segments: Object.freeze((path as string).split('.')),
    })
  )
)

/**
 * Shared tints — registry copied verbatim from `.snapshots/baseline/token-audit.txt`
 * (home-card.css L48–L116 and matching rows in section-card.css). These values
 * are currently identical across themes; theme-specific overrides will be
 * wired up by task 2.4 if/when needed.
 */
const SHARED_TINT_COLORS = {
  purple: { bg: 'rgba(167, 139, 250, 0.12)', fg: '#a78bfa' },
  blue: { bg: 'rgba(96, 165, 250, 0.12)', fg: '#60a5fa' },
  green: { bg: 'rgba(52, 211, 153, 0.12)', fg: '#34d399' },
  amber: { bg: 'rgba(251, 191, 36, 0.12)', fg: '#fbbf24' },
  red: { bg: 'rgba(248, 113, 113, 0.12)', fg: '#f87171' },
  slate: { bg: 'rgba(148, 163, 184, 0.12)', fg: '#94a3b8' },
  cyan: { bg: 'rgba(14, 165, 233, 0.12)', fg: '#0ea5e9' },
  pink: { bg: 'rgba(244, 114, 182, 0.12)', fg: '#f472b6' },
  purpleBright: { fg: '#c084fc' },
  amberBright: { fg: '#fcd34d' },
  purpleGlow: 'rgba(167, 139, 250, 0.08)',
} as const

/**
 * Shared terminal palette — from `desktop-window.css` audit rows L245–L338.
 */
const SHARED_TERMINAL_COLORS = {
  bg: '#0d0d0d',
  titlebarBg: '#161616',
  border: '#222222',
  title: '#888888',
  text: '#d4d4d4',
  promptPrefix: '#888888',
  output: '#aaaaaa',
  red: '#f87171',
  green: '#4ade80',
  blue: '#60a5fa',
  yellow: '#fbbf24',
  cyan: '#22d3ee',
  magenta: '#c084fc',
  white: '#f5f5f5',
  gray: '#888888',
  success: '#4ade80',
  error: '#f87171',
  warn: '#fbbf24',
  info: '#60a5fa',
  muted: '#888888',
  bar: '#888888',
  step: '#c084fc',
} as const

/**
 * Shared window-chrome traffic-light dots — from `desktop-window.css`
 * rows L33–L41 and L50.
 */
const SHARED_WINDOW_COLORS = {
  dotClose: '#ff5f57',
  dotMinimize: '#febc2e',
  dotMaximize: '#28c840',
  titleFallback: '#888888',
} as const

/**
 * Shared status badge palette — from `status-badge.css` rows L20–L36.
 */
const SHARED_BADGE_COLORS = {
  info: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  success: { bg: 'rgba(16, 185, 129, 0.12)', fg: '#059669' },
  warning: { bg: 'rgba(217, 119, 6, 0.12)', fg: '#d97706' },
  error: { bg: 'rgba(220, 38, 38, 0.12)', fg: '#dc2626' },
} as const

/**
 * Shared scrollbar palette — from `scrollbar.css` rows L18, L24.
 */
const SHARED_SCROLLBAR_COLORS = {
  thumb: '#3a3a3a',
  thumbHover: '#4a4a4a',
} as const

/**
 * Shared syntax-highlighting tokens — from `split.css` rows L137–L139.
 */
const SHARED_SYNTAX_COLORS = {
  kw: '#c084fc',
  str: '#fcd34d',
  fn: '#60a5fa',
} as const

/**
 * Shared hero-gradient stops — from `hero.css` row L62.
 */
const SHARED_GRADIENT_COLORS = {
  heroCyan: '#06b6d4',
  heroPurple: '#a855f7',
} as const

/**
 * Full mapping of compatibility CSS variables to the ciderpress token path
 * that supplies each value. Emitted by `themeToCss` after the canonical
 * `--cp-*` declaration block so every Rspress internal component — and every
 * ciderpress rule still written against a pre-token variable name — reads
 * from the ciderpress design system. Rspress is an implementation detail,
 * ciderpress tokens are the canonical surface.
 *
 * These declarations must live in the theme block rather than in
 * `styles/overrides/tokens.css`: that file is inside `@layer
 * ciderpress.tokens`, and Rspress ships its own `:root` defaults **unlayered**
 * — unlayered declarations beat every layer regardless of specificity. Theme
 * blocks are unlayered and carry `html[data-cp-theme][data-cp-variant]`
 * specificity, so they are the only place a `--rp-*` override actually wins.
 *
 * Grouped by category for readability. New rspress vars should be added
 * here when they appear; rspress vars that map to a missing concept can
 * stay unmapped (rspress's default value remains in force).
 *
 * Surfaces — every page surface flattens to the single `bg` token so the
 * doc layout, sidebar drawer, and home page share one base color.
 * Elevated surfaces (cards, hero panels) keep using `--cp-c-bg-elv` /
 * `--cp-c-bg-soft` directly inside our own component CSS.
 *
 *   --rp-c-bg                 surface.bg
 *   --rp-c-bg-alt             surface.bgAlt        (subtle stripe surfaces)
 *   --rp-c-bg-dark            surface.gutter       (deepest band — footer/header)
 *   --rp-c-bg-mute            surface.bg           (flattened — was bgElv pre-v1)
 *   --rp-c-bg-soft            surface.bgSoft
 *
 * Brand —
 *
 *   --rp-c-brand              brand.primary
 *   --rp-c-brand-light        brand.light
 *   --rp-c-brand-lighter      brand.lighter
 *   --rp-c-brand-dark         brand.hover
 *   --rp-c-brand-darker       brand.active
 *   --rp-c-brand-tint         brand.soft
 *
 * Borders / dividers —
 *
 *   --rp-c-divider            border.divider
 *   --rp-c-divider-dark       border.border       (stronger stroke)
 *   --rp-c-divider-light      border.divider      (same as base)
 *
 * Links —
 *
 *   --rp-c-link               brand.primary
 *
 * Text —
 *
 *   --rp-c-text-1             text.text1
 *   --rp-c-text-2             text.text2
 *   --rp-c-text-3             text.text3
 *   --rp-c-text-4             text.text3          (no `text4` token; alias)
 *   --rp-c-text-code          text.text1
 *
 * Code blocks —
 *
 *   --rp-code-block-bg        surface.codeBlockBg
 *
 * Home —
 *
 *   --rp-home-background-bg          surface.homeBg
 *   --rp-home-feature-bg             surface.bgSoft
 *   --rp-home-hero-secondary-color   text.text2
 *   --rp-home-hero-title-color       text.text1
 *
 * Fonts — the theme's three family slots drive every legacy font variable.
 * `--rp-font-family-base` is what Rspress's own `body { font-family }` rule
 * reads, so mapping it here is what makes the whole document (hero included)
 * follow the active theme:
 *
 *   --rp-font-family-base     fonts.family.sans
 *   --rp-font-family-mono     fonts.family.mono
 *   --cp-font-family-base     fonts.family.sans
 *   --cp-font-family-sans     fonts.family.sans
 *   --cp-font-family-mono     fonts.family.mono
 *   --cp-font-family-pixel    fonts.family.display
 *
 * Intentionally unmapped (rspress defaults remain in force):
 *  - `--rp-c-brand-rgb`: needs `r, g, b` tuple, no equivalent token
 *  - `--rp-c-gray*`: rspress internal neutrals, low surface area
 *  - `--rp-container-*` (admonitions): styled by ciderpress's own MDX overrides
 *  - `--rp-c-overview-group-*`: superseded by our SectionCard component
 *  - `--rp-code-block-border|color|shadow`, `--rp-code-title-*`,
 *    `--rp-code-line-highlight-color`: rspress's shiki defaults are fine
 *  - `--rp-banner-background`: we don't use rspress's banner
 *  - Layout/size/z-index vars: ciderpress sets these via `--cp-*` directly on
 *    its own components; rspress's layout chrome uses its own defaults
 */
const COMPAT_VAR_MAP: Readonly<Record<string, TokenPath>> = Object.freeze({
  '--rp-c-bg': 'colors.surface.bg',
  '--rp-c-bg-alt': 'colors.surface.bgAlt',
  '--rp-c-bg-dark': 'colors.surface.gutter',
  '--rp-c-bg-mute': 'colors.surface.bg',
  '--rp-c-bg-soft': 'colors.surface.bgSoft',
  '--rp-c-brand': 'colors.brand.primary',
  '--rp-c-brand-light': 'colors.brand.light',
  '--rp-c-brand-lighter': 'colors.brand.lighter',
  '--rp-c-brand-dark': 'colors.brand.hover',
  '--rp-c-brand-darker': 'colors.brand.active',
  '--rp-c-brand-tint': 'colors.brand.soft',
  '--rp-c-divider': 'colors.border.divider',
  '--rp-c-divider-dark': 'colors.border.border',
  '--rp-c-divider-light': 'colors.border.divider',
  '--rp-c-link': 'colors.brand.primary',
  '--rp-c-text-1': 'colors.text.text1',
  '--rp-c-text-2': 'colors.text.text2',
  '--rp-c-text-3': 'colors.text.text3',
  '--rp-c-text-4': 'colors.text.text3',
  '--rp-c-text-code': 'colors.text.text1',
  '--rp-code-block-bg': 'colors.surface.codeBlockBg',
  '--rp-home-background-bg': 'colors.surface.homeBg',
  '--rp-home-feature-bg': 'colors.surface.bgSoft',
  '--rp-home-hero-secondary-color': 'colors.text.text2',
  '--rp-home-hero-title-color': 'colors.text.text1',
  '--rp-font-family-base': 'fonts.family.sans',
  '--rp-font-family-mono': 'fonts.family.mono',
  '--cp-font-family-base': 'fonts.family.sans',
  '--cp-font-family-sans': 'fonts.family.sans',
  '--cp-font-family-mono': 'fonts.family.mono',
  '--cp-font-family-pixel': 'fonts.family.display',
})

/**
 * Declared-order list of compatibility var keys for deterministic emission
 * ordering.
 */
const COMPAT_VAR_NAMES: readonly string[] = Object.freeze(Object.keys(COMPAT_VAR_MAP))

/**
 * Precomputed `[cssVar, segments]` pairs for every compatibility variable in
 * `COMPAT_VAR_MAP`.
 *
 * Mirrors `TOKEN_RENDER_PLAN` for the compat side: splitting each token path
 * on `.` once at module load avoids re-splitting per declaration per theme
 * per build.
 */
const COMPAT_RENDER_PLAN: readonly {
  readonly cssVar: string
  readonly segments: readonly string[]
}[] = Object.freeze(
  COMPAT_VAR_NAMES.map((cssVar) =>
    Object.freeze({
      cssVar,
      segments: Object.freeze((COMPAT_VAR_MAP[cssVar] as string).split('.')),
    })
  )
)

/**
 * Shared OpenAPI / OAS badge palette — semantic colors shared across
 * the apple-named light/dark themes (`honeycrisp`, `grannysmith`).
 * Midnight and arcade override the entire set via their own constants.
 */
const SHARED_OAS_COLORS_BASE = {
  get: '#16a34a',
  post: '#2563eb',
  put: '#d97706',
  patch: '#d97706',
  delete: '#dc2626',
  deprecated: 'var(--cp-c-text-3)',
  required: '#dc2626',
} as const

/**
 * OAS palette for the `midnight` theme — from `midnight.css` at HEAD.
 */
const MIDNIGHT_OAS_COLORS = {
  get: '#34d399',
  post: '#60a5fa',
  put: '#fbbf24',
  patch: '#fbbf24',
  delete: '#f87171',
  deprecated: 'var(--cp-c-text-3)',
  required: '#f87171',
} as const

/**
 * OAS palette for the `arcade` theme — from `arcade.css` at HEAD.
 */
const ARCADE_OAS_COLORS = {
  get: '#00ff88',
  post: '#00ccff',
  put: '#ffaa00',
  patch: '#ffaa00',
  delete: '#ff4466',
  deprecated: 'var(--cp-c-text-3)',
  required: '#ff4466',
} as const

/**
 * Shared semantic palette — derived from the `default` theme's light
 * variant. OpenAPI method colors are the canonical semantic source for
 * `success`/`error`/`warn`/`info`; `muted` mirrors the dimmed terminal grey.
 */
const SHARED_SEMANTIC_COLORS = {
  success: '#16a34a',
  error: '#dc2626',
  warn: '#d97706',
  info: '#2563eb',
  muted: '#888888',
} as const

/**
 * Shared spacing scale — mirrors `tokens.css` lines L112–L133.
 */
const SHARED_SPACING = {
  s1: '1px',
  s2: '2px',
  s3: '3px',
  s4: '4px',
  s5: '5px',
  s6: '6px',
  s8: '8px',
  s10: '10px',
  s12: '12px',
  s14: '14px',
  s16: '16px',
  s18: '18px',
  s20: '20px',
  s24: '24px',
  s28: '28px',
  s32: '32px',
  s40: '40px',
  s48: '48px',
  s56: '56px',
  s64: '64px',
  s72: '72px',
  s96: '96px',
} as const

/**
 * Shared radii — mirrors `tokens.css` lines L136–L143.
 */
const SHARED_RADII = {
  xs: '2px',
  xsSm: '3px',
  sm: '4px',
  mdSm: '6px',
  md: '8px',
  lg: '10px',
  mdLg: '12px',
  pill: '9999px',
} as const

/**
 * Shared font tokens — families, weights, and sizes from `tokens.css`
 * lines L33–L109.
 *
 * `sans` is the base UI/prose slot: body, nav, sidebar, hero headline.
 * It carries Rspress's own Inter stack, which is what ciderpress has always
 * shipped.
 *
 * That is easy to get wrong, so it is worth stating plainly. `tokens.css`
 * declares `--cp-font-family-base: 'Geist Mono'` and has since the start,
 * but the declaration never took effect: Rspress ships an *unlayered*
 * `body { font-family: var(--rp-font-family-base) }`, and an unlayered rule
 * outranks anything in a cascade layer no matter how specific. So
 * `--rp-font-family-base` stayed on Inter and the site rendered Inter.
 * Verified against ciderpress.dev, whose hero computes to the stack below.
 *
 * Once `--rp-font-family-base` is wired to this slot, the value here is
 * live rather than decorative. Putting the mono stack in `sans` turns every
 * proportional surface monospace and silently redesigns the site, so `sans`
 * stays proportional and `mono` owns code and terminal chrome.
 *
 * `display` holds the decorative pixel face used for brand marks and
 * feature-card headings.
 */
const SHARED_FONTS = {
  family: {
    sans:
      "'Inter var experimental', 'Inter var', -apple-system, BlinkMacSystemFont, " +
      "'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', " +
      "'Helvetica Neue', sans-serif",
    mono: "'Geist Mono', ui-monospace, 'SFMono-Regular', monospace",
    display: "'Geist Pixel Square', ui-sans-serif, system-ui, sans-serif",
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  size: {
    body: '16px',
    btn: '14px',
    bullet: '14px',
    code: '13px',
    eyebrow: '11px',
    tagline: '18px',
    heroTitle: 'clamp(40px, 6.5vw, 76px)',
    splitTitle: 'clamp(28px, 4vw, 40px)',
    featureTitle: '18px',
    featureDesc: '16px',
    featureLink: '12px',
    sectionTitle: '14px',
    sectionDesc: '12.5px',
    badge: '11px',
    tooltip: '13px',
    tooltipHeadline: '13px',
    tooltipCta: '12px',
    check: '11px',
    fieldName: '14px',
    fieldType: '11px',
    fieldBadge: '11px',
    fieldDefault: '12px',
    fieldDefaultCode: '11px',
    fieldBody: '14px',
    fieldGroupTitle: '14px',
    fieldTrigger: '12px',
    promptDesc: '14px',
    promptFeedback: '12px',
    promptBtn: '12px',
    promptMenuItem: '13px',
    promptMenuDesc: '11px',
    colorName: '12px',
    colorValue: '11px',
    windowTitle: '12px',
    windowTab: '12px',
    windowUrl: '11px',
    termBody: '13px',
    demoTitle: '11px',
    demoBody: '13px',
    askAi: '13px',
    askAiMark: '10px',
    askAiShortcut: '10px',
    sidebarLink: '14px',
  },
} as const

/**
 * Shared shadow recipes — mirrors `tokens.css` lines L159–L173.
 */
const SHARED_SHADOWS = {
  cardHover: '0 2px 12px var(--cp-c-tint-purple-glow)',
  menu: '0 8px 24px rgba(0, 0, 0, 0.12)',
  tooltip: '0 4px 12px rgba(0, 0, 0, 0.08)',
  heroDemo:
    '0 0 0 1px rgba(0, 0, 0, 0.5), 0 24px 48px -12px rgba(0, 0, 0, 0.6), 0 0 80px var(--cp-c-brand-soft)',
  askAi: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 4px rgba(0, 0, 0, 0.5)',
} as const

/**
 * Shared motion tokens — mirrors `tokens.css` lines L176–L178.
 */
const SHARED_MOTION = {
  duration: {
    fast: '0.15s',
    base: '0.2s',
  },
  easing: {
    base: 'ease',
  },
} as const

/**
 * Shared z-index scale — mirrors `tokens.css` lines L181–L183.
 */
const SHARED_Z_INDEX = {
  dropdown: 50,
  floating: 60,
  tooltip: 100,
} as const

/**
 * Shared line-height scale — mirrors `tokens.css` lines L186–L194.
 */
const SHARED_LINE_HEIGHTS = {
  display: '1',
  tight: '1.4',
  tighter: '1.3',
  snug: '1.45',
  base: '1.5',
  relaxed: '1.6',
  demo: '1.65',
  code: '1.7',
  sidebar: '24px',
} as const

/**
 * Shared letter-spacing scale — mirrors `tokens.css` lines L197–L200.
 */
const SHARED_LETTER_SPACINGS = {
  wide: '0.02em',
  eyebrow: '0.1em',
  display: '-0.025em',
  hero: '-0.04em',
} as const

/**
 * Shared opacity scale — mirrors `tokens.css` lines L203–L205.
 */
const SHARED_OPACITIES = {
  muted: '0.5',
  deprecated: '0.6',
  hover: '0.8',
} as const

/**
 * Shared component sizes — mirrors `tokens.css` lines L208–L237.
 */
const SHARED_SIZES = {
  titlebar: '36px',
  windowDot: '10px',
  windowTabDot: '6px',
  browserTabMax: '200px',
  browserIcon: '14px',
  browserUrlbar: '28px',
  iconBox: '36px',
  iconBoxSm: '28px',
  iconSvg: '18px',
  iconSvgSm: '16px',
  iconSm: '16px',
  contentMax: '1152px',
  focusRing: '2px',
  focusRingOffset: '2px',
  tooltipMax: '320px',
  swatch: '24px',
  demoMax: '920px',
  splitMax: '1200px',
  heroGrid: '24px',
  heroMax: '1100px',
  taglineMax: '640px',
  promptIcon: '20px',
  promptBtn: '30px',
  menuMin: '220px',
  promptMenuIcon: '18px',
  check: '18px',
  chevron: '14px',
  askAiIcon: '18px',
  sidebarCircle: '36px',
  scrollbar: '6px',
} as const

/**
 * Shared breakpoints — mirrors `tokens.css` lines L240–L243.
 */
const SHARED_BREAKPOINTS = {
  sm: '768px',
  md: '720px',
  mdLg: '880px',
  content: '1184px',
} as const

/**
 * Shared backdrop blur — mirrors `tokens.css` line L246.
 */
const SHARED_BLURS = {
  base: '8px',
} as const

/**
 * Shared gradient recipes — mirrors `tokens.css` lines L253–L263.
 */
const SHARED_GRADIENTS = {
  brand: 'linear-gradient(135deg, var(--cp-c-brand-1), var(--cp-c-brand-3))',
  // Hero title — kept in-hue. The previous multi-stop brand → cyan → purple
  // gradient read as a generic AI landing-page accent; restraining to the
  // brand family makes the hero feel like a real product, not a template.
  heroTitle: 'linear-gradient(135deg, var(--cp-c-brand-1), var(--cp-c-brand-light))',
} as const

/**
 * Legacy alias for {@link ThemeVariant}. Retained inside `@ciderpress/theme`
 * for one-version migration safety. Removed from `@ciderpress/core`,
 * `@ciderpress/config`, and `ciderpress` public exports in v1 — new code
 * should import `ThemeVariant` directly.
 *
 * @deprecated Use {@link ThemeVariant}.
 */
export type ThemeMode = ThemeVariant

/**
 * Variant-keyed token map. A theme that supports both modes declares both
 * keys; a dark-only theme declares only `dark`.
 */
export interface ThemeVariantTokens {
  readonly dark?: CiderpressTokens
  readonly light?: CiderpressTokens
}

/**
 * Fully resolved theme definition produced by `defineTheme`.
 *
 * A `CiderpressTheme` represents one brand identity with one or more variant
 * token trees. The CSS emitter renders a separate
 * `html[data-cp-theme='{name}'][data-cp-variant='{variant}']` block per
 * variant present in `variants`.
 */
export interface CiderpressTheme {
  /**
   * Identifier — used in the `html[data-cp-theme='{name}']` selector.
   * Must be a lowercase slug (validated by `themeNameSchema`).
   */
  readonly name: string
  /**
   * Validated, frozen token trees keyed by variant. `variants.dark` and
   * `variants.light` are both optional, but at least one must be present.
   */
  readonly variants: ThemeVariantTokens
  /**
   * Variant to render when no localStorage preference is set. Must point
   * at a variant present in `variants`.
   */
  readonly defaultVariant: ThemeVariant
}

/**
 * Input shape accepted by `defineTheme`. Variant token trees are typed
 * `unknown` because validation is the factory's responsibility — callers
 * may pass raw JSON or a partially-typed object and let Zod produce a
 * clear error.
 */
export interface CiderpressThemeInputVariants {
  readonly dark?: unknown
  readonly light?: unknown
}

export interface CiderpressThemeInput {
  /**
   * Identifier — must match `html[data-cp-theme='{name}']`.
   */
  readonly name: string
  /**
   * Variant token trees. At least one of `variants.dark` /
   * `variants.light` must be present; both are validated against
   * `tokensSchema` at factory time.
   */
  readonly variants: CiderpressThemeInputVariants
  /**
   * Variant to render initially. Falls back to `'dark'` when both
   * variants are declared, otherwise to the only declared variant.
   */
  readonly defaultVariant?: ThemeVariant
}

/**
 * Validate a theme definition through `tokensSchema` and return a deeply
 * frozen `CiderpressTheme`.
 *
 * Validation failures surface as `ZodError`s from `tokensSchema.parse` and
 * `themeNameSchema.parse` — that's the documented contract callers need
 * to handle. Successful calls return a frozen object tree.
 *
 * @param input - Theme definition (name + variant token trees)
 * @returns A frozen, fully-typed `CiderpressTheme`
 *
 * @example
 * const myTheme = defineTheme({
 *   name: 'company-brand',
 *   variants: {
 *     dark: { ...allTokens },
 *   },
 * })
 */
export function defineTheme(input: CiderpressThemeInput): CiderpressTheme {
  // Public entrypoint — runs full envelope validation including the
  // reserved-name guard before delegating to the internal builder. Failures
  // surface as `ZodError`s with stable paths (`variants`, `defaultVariant`,
  // `name`).
  const envelope = themeInputEnvelopeSchema.parse(input)
  return buildTheme(envelope)
}

/**
 * Render a `CiderpressTheme` to a deterministic CSS source covering every
 * variant the theme declares.
 *
 * For each variant V in `theme.variants` the emitter writes one
 * `html[data-cp-theme='{name}'][data-cp-variant='{V}']` block. Iteration
 * order is fixed by `TOKEN_TO_CSS_VAR` (then `COMPAT_VAR_MAP`) so the
 * output is byte-deterministic given the same input.
 *
 * The FOUC-root theme (`FOUC_ROOT_THEME_NAME` — tracks `DEFAULT_THEME_NAME`)
 * additionally emits a `:root { ... }` block that mirrors its default
 * variant — the browser applies it before JS hydrates the `data-cp-*`
 * attributes on `<html>`.
 *
 * @param theme - Theme to render
 * @returns CSS source containing one block per variant
 */
export function themeToCss(theme: CiderpressTheme): string {
  return renderThemeCss(theme)
}

/**
 * The first-party themes shipped with ciderpress.
 *
 *  - `mulled` is the canonical brand — deep cider burgundy palette,
 *    ships both `dark` and `light` variants. Cream surfaces on light
 *    and a near-black canvas on dark for an evening/premium read. The
 *    legacy slug `'default'` aliases to this theme via `THEME_ALIASES`
 *    in `definitions.ts`.
 *  - `honeycrisp` is the bright apple-red counterpart — both variants
 *    supported. The sun/moon toggle swaps between them.
 *  - `grannysmith` is the green dev-tool-native counterpart — both
 *    variants supported.
 *  - `amber` is the warm apple-cider hearth palette — both variants
 *    supported, parchment surfaces on light and the shared near-black
 *    canvas on dark.
 *  - `midnight` is an opinionated near-black blue theme — dark only.
 *  - `arcade` is a neon green retro theme — dark only.
 *
 * Built-in token trees and the generated CSS at
 * `packages/ui/src/theme/styles/themes/*.css` are produced by
 * `packages/ui/scripts/generate-theme-css.mjs` — the registry below is
 * the single source of truth.
 */
export const BUILT_IN_THEMES: Readonly<Record<BuiltInThemeName, CiderpressTheme>> = Object.freeze({
  honeycrisp: defineBuiltInTheme({
    name: 'honeycrisp',
    variants: {
      dark: buildHoneycrispDarkTokens(),
      light: buildHoneycrispLightTokens(),
    },
    defaultVariant: 'dark',
  }),
  grannysmith: defineBuiltInTheme({
    name: 'grannysmith',
    variants: {
      dark: buildGrannysmithDarkTokens(),
      light: buildGrannysmithLightTokens(),
    },
    defaultVariant: 'dark',
  }),
  mulled: defineBuiltInTheme({
    name: 'mulled',
    variants: {
      dark: buildMulledDarkTokens(),
      light: buildMulledLightTokens(),
    },
    defaultVariant: 'dark',
  }),
  amber: defineBuiltInTheme({
    name: 'amber',
    variants: {
      dark: buildAmberDarkTokens(),
      light: buildAmberLightTokens(),
    },
    defaultVariant: 'dark',
  }),
  midnight: defineBuiltInTheme({
    name: 'midnight',
    variants: { dark: buildMidnightTokens() },
    defaultVariant: 'dark',
  }),
  arcade: defineBuiltInTheme({
    name: 'arcade',
    variants: { dark: buildArcadeTokens() },
    defaultVariant: 'dark',
  }),
})

/**
 * Schema-inferred output type — bridges `CiderpressTokens` (the strict surface
 * used at compile time) with whatever `tokensSchema.parse` resolves to
 * internally. Kept type-only.
 *
 * @private
 */
type ParsedTokens = z.infer<typeof tokensSchema>

/**
 * Resolve a precomputed segment array against a `CiderpressTokens` tree.
 *
 * Walks the segments with `.reduce`, never mutates intermediate state, and
 * trusts the `TokenPath` literal union — if a path resolves to `undefined`,
 * the registry itself is malformed, not the input.
 *
 * @private
 * @param segments - Pre-split token path (e.g. `['colors', 'brand', 'primary']`)
 * @param tokens - Token tree to walk
 * @returns The leaf value (string or number) at the resolved path
 */
function resolveBySegments(
  segments: readonly string[],
  tokens: CiderpressTokens
): string | number | undefined {
  const value = segments.reduce<unknown>(
    (node, segment) => (node as Record<string, unknown>)[segment],
    tokens
  )
  return value as string | number | undefined
}

/**
 * Render a single `  --cp-*: value;` line for one precomputed plan entry.
 *
 * Returns an empty array when the token tree carries no value at the path so
 * the caller can `flatMap` without emitting `--cp-x: undefined;`. Only
 * optional token slots (`fonts.family.display`) can miss, and only on a
 * theme object built without `defineTheme`.
 *
 * @private
 * @param entry - Precomputed render plan entry (cssVar + segments)
 * @param tokens - Token tree containing the value
 * @returns Single-element array with the declaration line, or an empty array
 */
function renderDeclaration(
  entry: { readonly cssVar: string; readonly segments: readonly string[] },
  tokens: CiderpressTokens
): readonly string[] {
  const value = resolveBySegments(entry.segments, tokens)
  if (value === undefined) {
    return []
  }
  return [`  ${entry.cssVar}: ${value};`]
}

/**
 * Render the full declaration body — all `--cp-*` tokens in registry order
 * followed by every compatibility var in `COMPAT_VAR_MAP` order.
 *
 * Both halves consume precomputed `[cssVar, segments]` plans so dotted token
 * paths are split exactly once at module load — never per declaration.
 *
 * @private
 * @param tokens - Token tree to render
 * @returns Multi-line CSS body (no surrounding braces)
 */
function renderDeclarationBody(tokens: CiderpressTokens): string {
  const cpLines = TOKEN_RENDER_PLAN.flatMap((entry) => renderDeclaration(entry, tokens))
  const compatLines = COMPAT_RENDER_PLAN.flatMap((entry) => renderDeclaration(entry, tokens))
  return [...cpLines, ...compatLines].join('\n')
}

/**
 * Render the complete CSS for a theme. Emits one
 * `html[data-cp-theme='{name}'][data-cp-variant='{V}']` block per
 * variant present on the theme. The framework's default theme
 * (`FOUC_ROOT_THEME_NAME`) additionally emits a `:root { ... }` FOUC
 * fallback block for its default variant.
 *
 * @private
 * @param theme - Theme to render
 * @returns CSS source containing one block per variant (plus optional FOUC root)
 */
function renderThemeCss(theme: CiderpressTheme): string {
  const variantBlocks = DEFAULT_VARIANT_ORDER.flatMap((variant) =>
    renderVariantBlock(theme, variant)
  )
  if (theme.name !== FOUC_ROOT_THEME_NAME) {
    return variantBlocks.join('\n')
  }
  const defaultTokens = theme.variants[theme.defaultVariant]
  if (defaultTokens === undefined) {
    return variantBlocks.join('\n')
  }
  const rootBlock = `:root {\n${renderDeclarationBody(defaultTokens)}\n}\n`
  return `${rootBlock}\n${variantBlocks.join('\n')}`
}

/**
 * Render the per-variant CSS block for one variant of one theme. Returns
 * an empty array when the theme does not declare the given variant so the
 * caller can `flatMap` without filtering.
 *
 * @private
 * @param theme - Theme being rendered
 * @param variant - Variant to render (`'dark'` or `'light'`)
 * @returns Single-element array on hit, empty array on miss
 */
function renderVariantBlock(theme: CiderpressTheme, variant: ThemeVariant): readonly string[] {
  const tokens = theme.variants[variant]
  if (tokens === undefined) {
    return []
  }
  const body = renderDeclarationBody(tokens)
  return [`html[data-cp-theme='${theme.name}'][data-cp-variant='${variant}'] {\n${body}\n}\n`]
}

/**
 * Validate one variant's token tree, returning `undefined` when the
 * caller omitted that variant.
 *
 * @private
 * @param raw - Raw token tree from `defineTheme` input
 * @returns Validated frozen tokens, or `undefined` when no input was given
 */
function validateVariant(raw: unknown): CiderpressTokens | undefined {
  if (raw === undefined) {
    return undefined
  }
  return withResolvedDisplayFont(tokensSchema.parse(raw) as CiderpressTokens)
}

/**
 * Fill the optional `fonts.family.display` slot from `fonts.family.sans`.
 *
 * `display` is the only optional leaf in the token tree. Resolving it here —
 * once, at theme-build time — means every downstream consumer (`themeToCss`,
 * the FOUC head block, the docs) sees a complete `fonts.family` group and
 * never has to re-implement the fallback.
 *
 * @private
 * @param tokens - Validated token tree
 * @returns The same tree when `display` is set, otherwise a copy with `display` = `sans`
 */
function withResolvedDisplayFont(tokens: CiderpressTokens): CiderpressTokens {
  const family = tokens.fonts.family
  if (family.display !== undefined) {
    return tokens
  }
  return {
    ...tokens,
    fonts: {
      ...tokens.fonts,
      family: { ...family, display: family.sans },
    },
  }
}

/**
 * Shared shape returned by both envelope schemas after `.parse(...)`. The
 * `name` is a `string` (validated), the variants are still `unknown` (each
 * gets parsed against `tokensSchema` per-variant in `buildTheme`), and
 * `defaultVariant` is the optional initial-variant hint.
 *
 * @private
 */
interface ParsedEnvelope {
  readonly name: string
  readonly variants: { readonly dark?: unknown; readonly light?: unknown }
  readonly defaultVariant?: ThemeVariant
}

/**
 * Internal factory used by `defineTheme` (public) and `defineBuiltInTheme`
 * (private) — both feed it an already-validated envelope. Runs the
 * `themeNameSchema` slug check, parses each present variant through
 * `tokensSchema`, picks the default variant, and freezes the result.
 *
 * @private
 * @param envelope - Envelope already validated by one of the two refines
 * @returns A frozen, fully-typed `CiderpressTheme`
 */
function buildTheme(envelope: ParsedEnvelope): CiderpressTheme {
  const validatedName: string = themeNameSchema.parse(envelope.name)
  const variants: Record<ThemeVariant, CiderpressTokens | undefined> = {
    dark: validateVariant(envelope.variants.dark),
    light: validateVariant(envelope.variants.light),
  }
  const presentVariants: readonly ThemeVariant[] = DEFAULT_VARIANT_ORDER.filter(
    (v) => variants[v] !== undefined
  )
  const defaultVariant: ThemeVariant = pickInputDefaultVariant(
    envelope.defaultVariant,
    presentVariants
  )
  return freezeTheme({
    name: validatedName,
    variants: filterPresentVariants(variants),
    defaultVariant,
  })
}

/**
 * Internal builder used to register the first-party themes in
 * {@link BUILT_IN_THEMES}. Bypasses the reserved-name refine on
 * `themeInputEnvelopeSchema` (which would reject `'honeycrisp'`,
 * `'grannysmith'`, `'mulled'`, `'amber'`, `'midnight'`, and `'arcade'`)
 * and goes through the base envelope instead. Not exported — user code
 * reaches the public factory via `defineTheme`.
 *
 * @private
 * @param input - Theme definition (name + variant token trees)
 * @returns A frozen, fully-typed `CiderpressTheme`
 */
function defineBuiltInTheme(input: CiderpressThemeInput): CiderpressTheme {
  const envelope = baseThemeInputEnvelopeSchema.parse(input)
  return buildTheme(envelope)
}

/**
 * Choose the default variant for `defineTheme` input, falling back to
 * the first declared variant in `DEFAULT_VARIANT_ORDER` when the caller
 * omitted `defaultVariant`. Cross-reference of `defaultVariant` against
 * `present` already runs in `themeInputEnvelopeSchema`, so this helper
 * trusts its inputs.
 *
 * Renamed from `resolveDefaultVariant` so it doesn't shadow the
 * identically named public export in `definitions.ts`.
 *
 * @private
 * @param requested - Validated default variant (may be `undefined`)
 * @param present - Variants the theme actually declares
 * @returns Resolved default variant
 */
function pickInputDefaultVariant(
  requested: ThemeVariant | undefined,
  present: readonly ThemeVariant[]
): ThemeVariant {
  if (requested !== undefined) {
    return requested
  }
  return present[0] as ThemeVariant
}

/**
 * Drop `undefined` keys from the variant map so consumers can `Object.keys`
 * the result to enumerate present variants.
 *
 * @private
 * @param variants - Raw variant map possibly containing `undefined` values
 * @returns Frozen variant map containing only declared variants
 */
function filterPresentVariants(
  variants: Record<ThemeVariant, CiderpressTokens | undefined>
): ThemeVariantTokens {
  return Object.freeze(pickBy(variants, isNotNil)) as ThemeVariantTokens
}

/**
 * Freeze the outer `CiderpressTheme` shell plus each variant's nested token
 * tree. Returns the same references rather than cloning — inputs come
 * from literal object expressions that are not aliased anywhere else.
 *
 * @private
 * @param theme - Theme to freeze
 * @returns Same theme, deeply frozen
 */
function freezeTheme(theme: CiderpressTheme): CiderpressTheme {
  const frozenVariants = Object.fromEntries(
    Object.entries(theme.variants).map(([k, tokens]) => [k, deepFreeze(tokens as CiderpressTokens)])
  ) as ThemeVariantTokens
  return Object.freeze({
    name: theme.name,
    variants: Object.freeze(frozenVariants),
    defaultVariant: theme.defaultVariant,
  })
}

/**
 * Recursively freeze every plain-object node in a value graph.
 *
 * Arrays and primitives pass through untouched. Non-plain objects are not
 * expected on this surface; if any appear they're returned as-is.
 *
 * @private
 * @param value - Value to freeze
 * @returns Same reference, deeply frozen if it's a plain object
 */
function deepFreeze<T>(value: T): T {
  if (value === null) {
    return value
  }
  if (typeof value !== 'object') {
    return value
  }
  // Walk every child reference with `.reduce` (codebase rules forbid
  // `.forEach` and `for` loops). The accumulator is the (already-frozen)
  // parent itself — `Object.freeze` is an in-place operation by contract.
  return Object.values(value as Record<string, unknown>).reduce<T>(
    (parent, child) => freezeChildThenReturnParent(parent, child),
    Object.freeze(value) as T
  )
}

/**
 * Freeze `child` recursively and return the (already-frozen) `parent`
 * unchanged. Exists purely so the reducer in `deepFreeze` stays expression-
 * only — codebase rules forbid expression statements.
 *
 * @private
 * @param parent - The parent node being walked
 * @param child - Child reference whose subtree should be frozen
 * @returns `parent`, untouched
 */
function freezeChildThenReturnParent<T>(parent: T, child: unknown): T {
  const _frozen = deepFreeze(child)
  return parent
}

/**
 * Build the `light` variant of the `honeycrisp` theme — bright surfaces
 * paired with the apple-red brand palette (`#dc2626`).
 *
 * @private
 * @returns Untyped token object suitable for `tokensSchema.parse`
 */
function buildHoneycrispLightTokens(): ParsedTokens {
  const brand = BRAND_PALETTES.honeycrisp
  return {
    colors: {
      brand: {
        primary: brand.primary,
        hover: brand.hover,
        active: brand.active,
        fg: brand.fg,
        soft: brand.soft,
        onBrand: '#ffffff',
        light: brand.light,
        lighter: brand.lighter,
      },
      semantic: { ...SHARED_SEMANTIC_COLORS },
      surface: {
        bg: '#ffffff',
        bgAlt: '#f9f9f9',
        bgElv: '#f5f5f5',
        bgSoft: '#f0f0f0',
        bgIcon: '#cccccc',
        homeBg: '#ffffff',
        overlayFaint: 'rgba(0, 0, 0, 0.1)',
        gutter: '#f5f5f5',
        codeBlockBg: '#f5f5f5',
      },
      text: {
        text1: '#1a1a1a',
        text2: 'rgba(26, 26, 26, 0.72)',
        text3: 'rgba(26, 26, 26, 0.48)',
      },
      border: {
        border: '#d0d0d0',
        divider: '#e2e2e2',
        sidebarAltBorderDark: '#484848',
      },
      tint: { ...SHARED_TINT_COLORS },
      terminal: { ...SHARED_TERMINAL_COLORS },
      window: { ...SHARED_WINDOW_COLORS },
      badge: { ...SHARED_BADGE_COLORS },
      scrollbar: { ...SHARED_SCROLLBAR_COLORS },
      syntax: { ...SHARED_SYNTAX_COLORS },
      gradient: { ...SHARED_GRADIENT_COLORS },
      oas: { ...SHARED_OAS_COLORS_BASE },
      button: {
        brand: {
          bg: brand.hover,
          hoverBg: brand.primary,
          activeBg: brand.active,
          text: '#ffffff',
        },
      },
    },
    spacing: { ...SHARED_SPACING },
    radii: { ...SHARED_RADII },
    fonts: {
      family: { ...SHARED_FONTS.family },
      weight: { ...SHARED_FONTS.weight },
      size: { ...SHARED_FONTS.size },
    },
    shadows: { ...SHARED_SHADOWS },
    motion: {
      duration: { ...SHARED_MOTION.duration },
      easing: { ...SHARED_MOTION.easing },
    },
    zIndex: { ...SHARED_Z_INDEX },
    lineHeights: { ...SHARED_LINE_HEIGHTS },
    letterSpacings: { ...SHARED_LETTER_SPACINGS },
    opacities: { ...SHARED_OPACITIES },
    sizes: { ...SHARED_SIZES },
    breakpoints: { ...SHARED_BREAKPOINTS },
    blurs: { ...SHARED_BLURS },
    gradients: { ...SHARED_GRADIENTS },
  }
}

/**
 * Build the `dark` variant of the `honeycrisp` theme — same brand-apple-red
 * palette as the light variant, paired with dark surfaces and inverted
 * text. This is the variant ciderpress renders by default (the framework
 * treats dark as its baseline aesthetic).
 *
 * @private
 * @returns Untyped token object suitable for `tokensSchema.parse`
 */
function buildHoneycrispDarkTokens(): ParsedTokens {
  const brand = BRAND_PALETTES.honeycrisp
  return {
    colors: {
      brand: {
        primary: brand.primary,
        hover: brand.hover,
        active: brand.active,
        fg: brand.fg,
        soft: brand.soft,
        onBrand: '#ffffff',
        light: brand.light,
        lighter: brand.lighter,
      },
      semantic: { ...SHARED_SEMANTIC_COLORS },
      surface: {
        bg: '#0a0a0a',
        bgAlt: '#0f0f0f',
        bgElv: '#161616',
        bgSoft: '#1c1c1c',
        bgIcon: '#2a2a2a',
        homeBg: '#0a0a0a',
        overlayFaint: 'rgba(255, 255, 255, 0.06)',
        gutter: '#0f0f0f',
        codeBlockBg: '#141414',
      },
      text: {
        text1: '#f5f5f5',
        text2: 'rgba(245, 245, 245, 0.72)',
        text3: 'rgba(245, 245, 245, 0.48)',
      },
      border: {
        border: '#2a2a2a',
        divider: '#1e1e1e',
        sidebarAltBorderDark: '#484848',
      },
      tint: { ...SHARED_TINT_COLORS },
      terminal: { ...SHARED_TERMINAL_COLORS },
      window: { ...SHARED_WINDOW_COLORS },
      badge: { ...SHARED_BADGE_COLORS },
      scrollbar: { ...SHARED_SCROLLBAR_COLORS },
      syntax: { ...SHARED_SYNTAX_COLORS },
      gradient: { ...SHARED_GRADIENT_COLORS },
      oas: { ...SHARED_OAS_COLORS_BASE },
      button: {
        brand: {
          bg: brand.primary,
          hoverBg: brand.light,
          activeBg: brand.hover,
          text: '#ffffff',
        },
      },
    },
    spacing: { ...SHARED_SPACING },
    radii: { ...SHARED_RADII },
    fonts: {
      family: { ...SHARED_FONTS.family },
      weight: { ...SHARED_FONTS.weight },
      size: { ...SHARED_FONTS.size },
    },
    shadows: { ...SHARED_SHADOWS },
    motion: {
      duration: { ...SHARED_MOTION.duration },
      easing: { ...SHARED_MOTION.easing },
    },
    zIndex: { ...SHARED_Z_INDEX },
    lineHeights: { ...SHARED_LINE_HEIGHTS },
    letterSpacings: { ...SHARED_LETTER_SPACINGS },
    opacities: { ...SHARED_OPACITIES },
    sizes: { ...SHARED_SIZES },
    breakpoints: { ...SHARED_BREAKPOINTS },
    blurs: { ...SHARED_BLURS },
    gradients: { ...SHARED_GRADIENTS },
  }
}

/**
 * Build the `light` variant of the `grannysmith` theme — bright surfaces
 * with the brand-apple-green palette. Mirrors `honeycrisp` light surfaces
 * (canvas / text / borders) with grannysmith brand colors swapped in so
 * the two apple themes are visually consistent at the chrome level.
 *
 * @private
 * @returns Untyped token object suitable for `tokensSchema.parse`
 */
function buildGrannysmithLightTokens(): ParsedTokens {
  const brand = BRAND_PALETTES.grannysmith
  return {
    colors: {
      brand: {
        primary: brand.primary,
        hover: brand.hover,
        active: brand.active,
        fg: brand.fg,
        soft: brand.soft,
        onBrand: '#ffffff',
        light: brand.light,
        lighter: brand.lighter,
      },
      semantic: { ...SHARED_SEMANTIC_COLORS },
      surface: {
        bg: '#ffffff',
        bgAlt: '#f9f9f9',
        bgElv: '#f5f5f5',
        bgSoft: '#f0f0f0',
        bgIcon: '#cccccc',
        homeBg: '#ffffff',
        overlayFaint: 'rgba(0, 0, 0, 0.1)',
        gutter: '#f5f5f5',
        codeBlockBg: '#f5f5f5',
      },
      text: {
        text1: '#1a1a1a',
        text2: 'rgba(26, 26, 26, 0.72)',
        text3: 'rgba(26, 26, 26, 0.48)',
      },
      border: {
        border: '#d0d0d0',
        divider: '#e2e2e2',
        sidebarAltBorderDark: '#484848',
      },
      tint: { ...SHARED_TINT_COLORS },
      terminal: { ...SHARED_TERMINAL_COLORS },
      window: { ...SHARED_WINDOW_COLORS },
      badge: { ...SHARED_BADGE_COLORS },
      scrollbar: { ...SHARED_SCROLLBAR_COLORS },
      syntax: { ...SHARED_SYNTAX_COLORS },
      gradient: { ...SHARED_GRADIENT_COLORS },
      oas: { ...SHARED_OAS_COLORS_BASE },
      button: {
        brand: {
          bg: brand.hover,
          hoverBg: brand.primary,
          activeBg: brand.active,
          text: '#ffffff',
        },
      },
    },
    spacing: { ...SHARED_SPACING },
    radii: { ...SHARED_RADII },
    fonts: {
      family: { ...SHARED_FONTS.family },
      weight: { ...SHARED_FONTS.weight },
      size: { ...SHARED_FONTS.size },
    },
    shadows: { ...SHARED_SHADOWS },
    motion: {
      duration: { ...SHARED_MOTION.duration },
      easing: { ...SHARED_MOTION.easing },
    },
    zIndex: { ...SHARED_Z_INDEX },
    lineHeights: { ...SHARED_LINE_HEIGHTS },
    letterSpacings: { ...SHARED_LETTER_SPACINGS },
    opacities: { ...SHARED_OPACITIES },
    sizes: { ...SHARED_SIZES },
    breakpoints: { ...SHARED_BREAKPOINTS },
    blurs: { ...SHARED_BLURS },
    gradients: { ...SHARED_GRADIENTS },
  }
}

/**
 * Build the `dark` variant of the `grannysmith` theme — dark surfaces
 * matching `honeycrisp` paired with the green brand palette.
 *
 * @private
 * @returns Untyped token object suitable for `tokensSchema.parse`
 */
function buildGrannysmithDarkTokens(): ParsedTokens {
  const brand = BRAND_PALETTES.grannysmith
  return {
    colors: {
      brand: {
        primary: brand.primary,
        hover: brand.hover,
        active: brand.active,
        fg: brand.fg,
        soft: brand.soft,
        onBrand: '#ffffff',
        light: brand.light,
        lighter: brand.lighter,
      },
      semantic: { ...SHARED_SEMANTIC_COLORS },
      surface: {
        bg: '#0a0a0a',
        bgAlt: '#0f0f0f',
        bgElv: '#161616',
        bgSoft: '#1c1c1c',
        bgIcon: '#2a2a2a',
        homeBg: '#0a0a0a',
        overlayFaint: 'rgba(255, 255, 255, 0.06)',
        gutter: '#0f0f0f',
        codeBlockBg: '#141414',
      },
      text: {
        text1: '#f5f5f5',
        text2: 'rgba(245, 245, 245, 0.72)',
        text3: 'rgba(245, 245, 245, 0.48)',
      },
      border: {
        border: '#2a2a2a',
        divider: '#1e1e1e',
        sidebarAltBorderDark: '#484848',
      },
      tint: { ...SHARED_TINT_COLORS },
      terminal: { ...SHARED_TERMINAL_COLORS },
      window: { ...SHARED_WINDOW_COLORS },
      badge: { ...SHARED_BADGE_COLORS },
      scrollbar: { ...SHARED_SCROLLBAR_COLORS },
      syntax: { ...SHARED_SYNTAX_COLORS },
      gradient: { ...SHARED_GRADIENT_COLORS },
      oas: { ...SHARED_OAS_COLORS_BASE },
      button: {
        brand: {
          bg: brand.primary,
          hoverBg: brand.light,
          activeBg: brand.hover,
          text: '#ffffff',
        },
      },
    },
    spacing: { ...SHARED_SPACING },
    radii: { ...SHARED_RADII },
    fonts: {
      family: { ...SHARED_FONTS.family },
      weight: { ...SHARED_FONTS.weight },
      size: { ...SHARED_FONTS.size },
    },
    shadows: { ...SHARED_SHADOWS },
    motion: {
      duration: { ...SHARED_MOTION.duration },
      easing: { ...SHARED_MOTION.easing },
    },
    zIndex: { ...SHARED_Z_INDEX },
    lineHeights: { ...SHARED_LINE_HEIGHTS },
    letterSpacings: { ...SHARED_LETTER_SPACINGS },
    opacities: { ...SHARED_OPACITIES },
    sizes: { ...SHARED_SIZES },
    breakpoints: { ...SHARED_BREAKPOINTS },
    blurs: { ...SHARED_BLURS },
    gradients: { ...SHARED_GRADIENTS },
  }
}

/**
 * Build the `light` variant of the `mulled` theme — warm cream surfaces
 * with a deep burgundy brand. The light variant leans into the
 * mulled-cider "evening / premium" mood by pairing parchment canvas
 * (`#fbf6f4`) with deep red accents.
 *
 * @private
 * @returns Untyped token object suitable for `tokensSchema.parse`
 */
function buildMulledLightTokens(): ParsedTokens {
  const brand = BRAND_PALETTES.mulled
  return {
    colors: {
      brand: {
        primary: brand.primary,
        hover: brand.hover,
        active: brand.active,
        fg: brand.fg,
        soft: brand.soft,
        onBrand: '#ffffff',
        light: brand.light,
        lighter: brand.lighter,
      },
      semantic: { ...SHARED_SEMANTIC_COLORS },
      surface: {
        bg: '#fbf6f4',
        bgAlt: '#f5edea',
        bgElv: '#f0e4e0',
        bgSoft: '#ead9d4',
        bgIcon: '#caa2a2',
        homeBg: '#fbf6f4',
        overlayFaint: 'rgba(42, 6, 6, 0.08)',
        gutter: '#f5edea',
        codeBlockBg: '#f5edea',
      },
      text: {
        text1: '#2a0606',
        text2: 'rgba(42, 6, 6, 0.72)',
        text3: 'rgba(42, 6, 6, 0.48)',
      },
      border: {
        border: '#d5b8b8',
        divider: '#e6d2d2',
        sidebarAltBorderDark: '#5a3030',
      },
      tint: { ...SHARED_TINT_COLORS },
      terminal: { ...SHARED_TERMINAL_COLORS },
      window: { ...SHARED_WINDOW_COLORS },
      badge: { ...SHARED_BADGE_COLORS },
      scrollbar: { ...SHARED_SCROLLBAR_COLORS },
      syntax: { ...SHARED_SYNTAX_COLORS },
      gradient: { ...SHARED_GRADIENT_COLORS },
      oas: { ...SHARED_OAS_COLORS_BASE },
      button: {
        brand: {
          bg: brand.hover,
          hoverBg: brand.primary,
          activeBg: brand.active,
          text: '#ffffff',
        },
      },
    },
    spacing: { ...SHARED_SPACING },
    radii: { ...SHARED_RADII },
    fonts: {
      family: { ...SHARED_FONTS.family },
      weight: { ...SHARED_FONTS.weight },
      size: { ...SHARED_FONTS.size },
    },
    shadows: { ...SHARED_SHADOWS },
    motion: {
      duration: { ...SHARED_MOTION.duration },
      easing: { ...SHARED_MOTION.easing },
    },
    zIndex: { ...SHARED_Z_INDEX },
    lineHeights: { ...SHARED_LINE_HEIGHTS },
    letterSpacings: { ...SHARED_LETTER_SPACINGS },
    opacities: { ...SHARED_OPACITIES },
    sizes: { ...SHARED_SIZES },
    breakpoints: { ...SHARED_BREAKPOINTS },
    blurs: { ...SHARED_BLURS },
    gradients: { ...SHARED_GRADIENTS },
  }
}

/**
 * Build the `dark` variant of the `mulled` theme — near-black canvas
 * with the deep burgundy brand. The dark variant mirrors the surface
 * palette used by `honeycrisp` / `grannysmith` so the apple themes
 * stay visually consistent at the chrome level on dark.
 *
 * @private
 * @returns Untyped token object suitable for `tokensSchema.parse`
 */
function buildMulledDarkTokens(): ParsedTokens {
  const brand = BRAND_PALETTES.mulled
  return {
    colors: {
      brand: {
        primary: brand.primary,
        hover: brand.hover,
        active: brand.active,
        fg: brand.fg,
        soft: brand.soft,
        onBrand: '#ffffff',
        light: brand.light,
        lighter: brand.lighter,
      },
      semantic: { ...SHARED_SEMANTIC_COLORS },
      surface: {
        bg: '#0a0a0a',
        bgAlt: '#0f0f0f',
        bgElv: '#161616',
        bgSoft: '#1c1c1c',
        bgIcon: '#2a2a2a',
        homeBg: '#0a0a0a',
        overlayFaint: 'rgba(255, 255, 255, 0.06)',
        gutter: '#0f0f0f',
        codeBlockBg: '#141414',
      },
      text: {
        text1: '#f5f5f5',
        text2: 'rgba(245, 245, 245, 0.72)',
        text3: 'rgba(245, 245, 245, 0.48)',
      },
      border: {
        border: '#2a2a2a',
        divider: '#1e1e1e',
        sidebarAltBorderDark: '#484848',
      },
      tint: { ...SHARED_TINT_COLORS },
      terminal: { ...SHARED_TERMINAL_COLORS },
      window: { ...SHARED_WINDOW_COLORS },
      badge: { ...SHARED_BADGE_COLORS },
      scrollbar: { ...SHARED_SCROLLBAR_COLORS },
      syntax: { ...SHARED_SYNTAX_COLORS },
      gradient: { ...SHARED_GRADIENT_COLORS },
      oas: { ...SHARED_OAS_COLORS_BASE },
      button: {
        brand: {
          bg: brand.primary,
          hoverBg: brand.light,
          activeBg: brand.hover,
          text: '#ffffff',
        },
      },
    },
    spacing: { ...SHARED_SPACING },
    radii: { ...SHARED_RADII },
    fonts: {
      family: { ...SHARED_FONTS.family },
      weight: { ...SHARED_FONTS.weight },
      size: { ...SHARED_FONTS.size },
    },
    shadows: { ...SHARED_SHADOWS },
    motion: {
      duration: { ...SHARED_MOTION.duration },
      easing: { ...SHARED_MOTION.easing },
    },
    zIndex: { ...SHARED_Z_INDEX },
    lineHeights: { ...SHARED_LINE_HEIGHTS },
    letterSpacings: { ...SHARED_LETTER_SPACINGS },
    opacities: { ...SHARED_OPACITIES },
    sizes: { ...SHARED_SIZES },
    breakpoints: { ...SHARED_BREAKPOINTS },
    blurs: { ...SHARED_BLURS },
    gradients: { ...SHARED_GRADIENTS },
  }
}

/**
 * Build the `light` variant of the `amber` theme — warm parchment surfaces
 * with a hearth-amber brand. Leans into the "apple cider amber" mood by
 * pairing a cream canvas (`#fffaf2`) with deep-roast brown ink.
 *
 * @private
 * @returns Untyped token object suitable for `tokensSchema.parse`
 */
function buildAmberLightTokens(): ParsedTokens {
  const brand = BRAND_PALETTES.amber
  return {
    colors: {
      brand: {
        primary: brand.primary,
        hover: brand.hover,
        active: brand.active,
        fg: brand.fg,
        soft: brand.soft,
        onBrand: '#ffffff',
        light: brand.light,
        lighter: brand.lighter,
      },
      semantic: { ...SHARED_SEMANTIC_COLORS },
      surface: {
        bg: '#fffaf2',
        bgAlt: '#fdf4e1',
        bgElv: '#f7ebd0',
        bgSoft: '#f0dfb8',
        bgIcon: '#caa97a',
        homeBg: '#fffaf2',
        overlayFaint: 'rgba(58, 31, 4, 0.08)',
        gutter: '#fdf4e1',
        codeBlockBg: '#fdf4e1',
      },
      text: {
        text1: '#3a1f04',
        text2: 'rgba(58, 31, 4, 0.72)',
        text3: 'rgba(58, 31, 4, 0.48)',
      },
      border: {
        border: '#d5c2a3',
        divider: '#e6d8b8',
        sidebarAltBorderDark: '#5a4020',
      },
      tint: { ...SHARED_TINT_COLORS },
      terminal: { ...SHARED_TERMINAL_COLORS },
      window: { ...SHARED_WINDOW_COLORS },
      badge: { ...SHARED_BADGE_COLORS },
      scrollbar: { ...SHARED_SCROLLBAR_COLORS },
      syntax: { ...SHARED_SYNTAX_COLORS },
      gradient: { ...SHARED_GRADIENT_COLORS },
      oas: { ...SHARED_OAS_COLORS_BASE },
      button: {
        brand: {
          bg: brand.hover,
          hoverBg: brand.primary,
          activeBg: brand.active,
          text: '#ffffff',
        },
      },
    },
    spacing: { ...SHARED_SPACING },
    radii: { ...SHARED_RADII },
    fonts: {
      family: { ...SHARED_FONTS.family },
      weight: { ...SHARED_FONTS.weight },
      size: { ...SHARED_FONTS.size },
    },
    shadows: { ...SHARED_SHADOWS },
    motion: {
      duration: { ...SHARED_MOTION.duration },
      easing: { ...SHARED_MOTION.easing },
    },
    zIndex: { ...SHARED_Z_INDEX },
    lineHeights: { ...SHARED_LINE_HEIGHTS },
    letterSpacings: { ...SHARED_LETTER_SPACINGS },
    opacities: { ...SHARED_OPACITIES },
    sizes: { ...SHARED_SIZES },
    breakpoints: { ...SHARED_BREAKPOINTS },
    blurs: { ...SHARED_BLURS },
    gradients: { ...SHARED_GRADIENTS },
  }
}

/**
 * Build the `dark` variant of the `amber` theme — shared near-black canvas
 * paired with the hearth-amber brand. Mirrors the surface palette used by
 * `honeycrisp` / `grannysmith` / `mulled` so the apple themes stay visually
 * consistent at the chrome level on dark.
 *
 * @private
 * @returns Untyped token object suitable for `tokensSchema.parse`
 */
function buildAmberDarkTokens(): ParsedTokens {
  const brand = BRAND_PALETTES.amber
  return {
    colors: {
      brand: {
        primary: brand.primary,
        hover: brand.hover,
        active: brand.active,
        fg: brand.fg,
        soft: brand.soft,
        onBrand: '#ffffff',
        light: brand.light,
        lighter: brand.lighter,
      },
      semantic: { ...SHARED_SEMANTIC_COLORS },
      surface: {
        bg: '#0a0a0a',
        bgAlt: '#0f0f0f',
        bgElv: '#161616',
        bgSoft: '#1c1c1c',
        bgIcon: '#2a2a2a',
        homeBg: '#0a0a0a',
        overlayFaint: 'rgba(255, 255, 255, 0.06)',
        gutter: '#0f0f0f',
        codeBlockBg: '#141414',
      },
      text: {
        text1: '#f5f5f5',
        text2: 'rgba(245, 245, 245, 0.72)',
        text3: 'rgba(245, 245, 245, 0.48)',
      },
      border: {
        border: '#2a2a2a',
        divider: '#1e1e1e',
        sidebarAltBorderDark: '#484848',
      },
      tint: { ...SHARED_TINT_COLORS },
      terminal: { ...SHARED_TERMINAL_COLORS },
      window: { ...SHARED_WINDOW_COLORS },
      badge: { ...SHARED_BADGE_COLORS },
      scrollbar: { ...SHARED_SCROLLBAR_COLORS },
      syntax: { ...SHARED_SYNTAX_COLORS },
      gradient: { ...SHARED_GRADIENT_COLORS },
      oas: { ...SHARED_OAS_COLORS_BASE },
      button: {
        brand: {
          bg: brand.primary,
          hoverBg: brand.light,
          activeBg: brand.hover,
          text: '#ffffff',
        },
      },
    },
    spacing: { ...SHARED_SPACING },
    radii: { ...SHARED_RADII },
    fonts: {
      family: { ...SHARED_FONTS.family },
      weight: { ...SHARED_FONTS.weight },
      size: { ...SHARED_FONTS.size },
    },
    shadows: { ...SHARED_SHADOWS },
    motion: {
      duration: { ...SHARED_MOTION.duration },
      easing: { ...SHARED_MOTION.easing },
    },
    zIndex: { ...SHARED_Z_INDEX },
    lineHeights: { ...SHARED_LINE_HEIGHTS },
    letterSpacings: { ...SHARED_LETTER_SPACINGS },
    opacities: { ...SHARED_OPACITIES },
    sizes: { ...SHARED_SIZES },
    breakpoints: { ...SHARED_BREAKPOINTS },
    blurs: { ...SHARED_BLURS },
    gradients: { ...SHARED_GRADIENTS },
  }
}

/**
 * Build the `midnight` theme token tree — an opinionated near-black
 * canvas (one step above pure black) with a cool blue brand accent. The
 * surface palette is intentionally darker than every other built-in.
 *
 * @private
 * @returns Untyped token object suitable for `tokensSchema.parse`
 */
function buildMidnightTokens(): ParsedTokens {
  const brand = BRAND_PALETTES.midnight
  return {
    colors: {
      brand: {
        primary: brand.primary,
        hover: brand.hover,
        active: brand.active,
        fg: brand.fg,
        soft: brand.soft,
        onBrand: '#ffffff',
        light: brand.light,
        lighter: brand.lighter,
      },
      semantic: { ...SHARED_SEMANTIC_COLORS },
      surface: {
        bg: '#050505',
        bgAlt: '#080808',
        bgElv: '#0d0d0d',
        bgSoft: '#111111',
        bgIcon: '#1f1f1f',
        homeBg: '#050505',
        overlayFaint: 'rgba(255, 255, 255, 0.08)',
        gutter: '#080808',
        codeBlockBg: '#080808',
      },
      text: {
        text1: '#f0f0f0',
        text2: 'rgba(240, 240, 240, 0.72)',
        text3: 'rgba(240, 240, 240, 0.48)',
      },
      border: {
        border: '#1f1f1f',
        divider: '#141414',
        sidebarAltBorderDark: '#3a3a3a',
      },
      tint: { ...SHARED_TINT_COLORS },
      terminal: { ...SHARED_TERMINAL_COLORS },
      window: { ...SHARED_WINDOW_COLORS },
      badge: { ...SHARED_BADGE_COLORS },
      scrollbar: { ...SHARED_SCROLLBAR_COLORS },
      syntax: { ...SHARED_SYNTAX_COLORS },
      gradient: { ...SHARED_GRADIENT_COLORS },
      oas: { ...MIDNIGHT_OAS_COLORS },
      button: {
        brand: {
          bg: '#2563eb',
          hoverBg: '#3b82f6',
          activeBg: '#1d4ed8',
          text: '#f0f0f0',
        },
      },
    },
    spacing: { ...SHARED_SPACING },
    radii: { ...SHARED_RADII },
    fonts: {
      family: { ...SHARED_FONTS.family },
      weight: { ...SHARED_FONTS.weight },
      size: { ...SHARED_FONTS.size },
    },
    shadows: { ...SHARED_SHADOWS },
    motion: {
      duration: { ...SHARED_MOTION.duration },
      easing: { ...SHARED_MOTION.easing },
    },
    zIndex: { ...SHARED_Z_INDEX },
    lineHeights: { ...SHARED_LINE_HEIGHTS },
    letterSpacings: { ...SHARED_LETTER_SPACINGS },
    opacities: { ...SHARED_OPACITIES },
    sizes: { ...SHARED_SIZES },
    breakpoints: { ...SHARED_BREAKPOINTS },
    blurs: { ...SHARED_BLURS },
    gradients: { ...SHARED_GRADIENTS },
  }
}

/**
 * Build the `arcade` theme token tree from the CSS at
 * `packages/ui/src/theme/styles/themes/arcade.css`.
 *
 * @private
 * @returns Untyped token object suitable for `tokensSchema.parse`
 */
function buildArcadeTokens(): ParsedTokens {
  const brand = BRAND_PALETTES.arcade
  return {
    colors: {
      brand: {
        primary: brand.primary,
        hover: brand.hover,
        active: brand.active,
        fg: brand.fg,
        soft: brand.soft,
        onBrand: brand.fg,
        light: brand.light,
        lighter: brand.lighter,
      },
      semantic: { ...SHARED_SEMANTIC_COLORS },
      surface: {
        bg: '#0d0d1a',
        bgAlt: '#10102a',
        bgElv: '#141433',
        bgSoft: '#18183d',
        bgIcon: '#2a2a55',
        homeBg: '#0d0d1a',
        overlayFaint: 'rgba(102, 255, 187, 0.14)',
        gutter: '#10102a',
        codeBlockBg: '#10102a',
      },
      text: {
        text1: '#e0ffe0',
        text2: 'rgba(224, 255, 224, 0.72)',
        text3: 'rgba(224, 255, 224, 0.48)',
      },
      border: {
        border: '#252560',
        divider: '#1a1a40',
        sidebarAltBorderDark: '#484848',
      },
      tint: { ...SHARED_TINT_COLORS },
      terminal: { ...SHARED_TERMINAL_COLORS },
      window: { ...SHARED_WINDOW_COLORS },
      badge: { ...SHARED_BADGE_COLORS },
      scrollbar: { ...SHARED_SCROLLBAR_COLORS },
      syntax: { ...SHARED_SYNTAX_COLORS },
      gradient: { ...SHARED_GRADIENT_COLORS },
      oas: { ...ARCADE_OAS_COLORS },
      button: {
        brand: {
          bg: '#00aa55',
          hoverBg: '#00cc6a',
          activeBg: '#008844',
          text: '#0d0d1a',
        },
      },
    },
    spacing: { ...SHARED_SPACING },
    radii: { ...SHARED_RADII },
    fonts: {
      family: { ...SHARED_FONTS.family },
      weight: { ...SHARED_FONTS.weight },
      size: { ...SHARED_FONTS.size },
    },
    shadows: { ...SHARED_SHADOWS },
    motion: {
      duration: { ...SHARED_MOTION.duration },
      easing: { ...SHARED_MOTION.easing },
    },
    zIndex: { ...SHARED_Z_INDEX },
    lineHeights: { ...SHARED_LINE_HEIGHTS },
    letterSpacings: { ...SHARED_LETTER_SPACINGS },
    opacities: { ...SHARED_OPACITIES },
    sizes: { ...SHARED_SIZES },
    breakpoints: { ...SHARED_BREAKPOINTS },
    blurs: { ...SHARED_BLURS },
    gradients: { ...SHARED_GRADIENTS },
  }
}
