import { describe, it, expect } from 'vitest'

import { BUILT_IN_THEMES, defineTheme, themeToCss } from './theme-registry.ts'
import type { CiderpressTokens } from './tokens.ts'
import { TOKEN_TO_CSS_VAR } from './tokens.ts'

const COURIER = "'Courier New', 'Lucida Console', Monaco, monospace"
const PIXEL_DISPLAY = "'Press Start 2P', monospace"

const BASE_TOKENS = BUILT_IN_THEMES.midnight.variants.dark as CiderpressTokens

/**
 * Build a token tree from the `midnight` built-in with only `fonts.family`
 * replaced. Keeps the fixture honest — every other token stays a real,
 * schema-valid value, so `defineTheme` exercises the full validation path.
 *
 * @private
 * @param family - Font family slots to substitute
 * @returns Complete token tree carrying the supplied families
 */
function tokensWithFamily(family: {
  readonly sans: string
  readonly mono: string
  readonly display?: string
}): CiderpressTokens {
  return {
    ...BASE_TOKENS,
    fonts: { ...BASE_TOKENS.fonts, family },
  }
}

/**
 * Extract the value of a CSS custom property from the first declaration
 * block that declares it.
 *
 * @private
 * @param css - CSS source to scan
 * @param cssVar - Custom property name including the leading `--`
 * @returns Declared value, or `null` when the property is never declared
 */
function readVar(css: string, cssVar: string): string | null {
  const needle = `${cssVar}: `
  const line = css.split('\n').find((raw) => raw.trim().startsWith(needle))
  if (line === undefined) {
    return null
  }
  return line.trim().slice(needle.length).replace(/;$/, '').trim()
}

/**
 * Every CSS variable that must resolve to the theme's `fonts.family.sans`.
 */
const SANS_VARS: readonly string[] = [
  '--cp-ff-sans',
  '--cp-font-family-base',
  '--cp-font-family-sans',
  '--rp-font-family-base',
]

/**
 * Every CSS variable that must resolve to the theme's `fonts.family.mono`.
 */
const MONO_VARS: readonly string[] = [
  '--cp-ff-mono',
  '--cp-font-family-mono',
  '--rp-font-family-mono',
]

/**
 * Every CSS variable that must resolve to the theme's `fonts.family.display`.
 */
const DISPLAY_VARS: readonly string[] = ['--cp-ff-display', '--cp-font-family-pixel']

describe('TOKEN_TO_CSS_VAR font family mapping', () => {
  it('should map every font family slot to a --cp-ff-* variable', () => {
    expect({
      sans: TOKEN_TO_CSS_VAR['fonts.family.sans'],
      mono: TOKEN_TO_CSS_VAR['fonts.family.mono'],
      display: TOKEN_TO_CSS_VAR['fonts.family.display'],
    }).toStrictEqual({
      sans: '--cp-ff-sans',
      mono: '--cp-ff-mono',
      display: '--cp-ff-display',
    })
  })
})

describe('themeToCss() font propagation for a custom theme', () => {
  const terminalTheme = defineTheme({
    name: 'terminal',
    variants: {
      dark: tokensWithFamily({ sans: COURIER, mono: COURIER }),
    },
  })
  const css = themeToCss(terminalTheme)

  it('should scope the declarations to the custom theme selector', () => {
    expect(css).toContain("html[data-cp-theme='terminal'][data-cp-variant='dark']")
  })

  it.each(SANS_VARS)('should resolve %s to the custom sans stack', (cssVar) => {
    expect(readVar(css, cssVar)).toBe(COURIER)
  })

  it.each(MONO_VARS)('should resolve %s to the custom mono stack', (cssVar) => {
    expect(readVar(css, cssVar)).toBe(COURIER)
  })

  it.each(DISPLAY_VARS)('should fall back %s to the custom sans stack', (cssVar) => {
    expect(readVar(css, cssVar)).toBe(COURIER)
  })

  it('should leave no Geist stack anywhere in the emitted CSS', () => {
    expect(css).not.toContain('Geist')
  })
})

describe('themeToCss() display font slot', () => {
  it('should emit an explicit display stack when the theme declares one', () => {
    const theme = defineTheme({
      name: 'terminal-display',
      variants: {
        dark: tokensWithFamily({ sans: COURIER, mono: COURIER, display: PIXEL_DISPLAY }),
      },
    })
    const css = themeToCss(theme)
    expect(readVar(css, '--cp-ff-display')).toBe(PIXEL_DISPLAY)
  })

  it('should keep the display stack off the sans variable', () => {
    const theme = defineTheme({
      name: 'terminal-display-sans',
      variants: {
        dark: tokensWithFamily({ sans: COURIER, mono: COURIER, display: PIXEL_DISPLAY }),
      },
    })
    expect(readVar(themeToCss(theme), '--cp-ff-sans')).toBe(COURIER)
  })

  it('should resolve display on the token tree, not only in the CSS', () => {
    const theme = defineTheme({
      name: 'terminal-tokens',
      variants: {
        dark: tokensWithFamily({ sans: COURIER, mono: COURIER }),
      },
    })
    const dark = theme.variants.dark as CiderpressTokens
    expect(dark.fonts.family.display).toBe(COURIER)
  })
})

describe('built-in theme font stacks', () => {
  const GEIST_MONO = "'Geist Mono', ui-monospace, 'SFMono-Regular', monospace"
  const GEIST_PIXEL = "'Geist Pixel Square', ui-sans-serif, system-ui, sans-serif"
  // The shipped proportional stack, copied from what ciderpress.dev's hero
  // actually computes to. `sans` drives `--rp-font-family-base`, so this is
  // the value that decides how the whole site reads.
  const INTER =
    "'Inter var experimental', 'Inter var', -apple-system, BlinkMacSystemFont, " +
    "'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', " +
    "'Helvetica Neue', sans-serif"
  const themeNames = Object.keys(BUILT_IN_THEMES) as readonly (keyof typeof BUILT_IN_THEMES)[]

  // Regression guard. `sans` briefly carried the Geist Mono stack, which
  // turned every proportional surface — hero headline, body, nav, sidebar —
  // monospace and redesigned the site without anyone asking for it. `sans`
  // is the base UI/prose slot and stays proportional.
  it.each(themeNames)('should keep %s on the proportional base stack', (name) => {
    const css = themeToCss(BUILT_IN_THEMES[name])
    expect(SANS_VARS.map((cssVar) => readVar(css, cssVar))).toStrictEqual(
      SANS_VARS.map(() => INTER)
    )
  })

  it.each(themeNames)('should not put a monospace stack in %s sans slot', (name) => {
    const css = themeToCss(BUILT_IN_THEMES[name])
    const sansValues = SANS_VARS.map((cssVar) => readVar(css, cssVar))
    expect(sansValues.some((value) => value !== null && value.includes('monospace'))).toBe(false)
  })

  it.each(themeNames)('should keep %s on the Geist Mono code stack', (name) => {
    const css = themeToCss(BUILT_IN_THEMES[name])
    expect(MONO_VARS.map((cssVar) => readVar(css, cssVar))).toStrictEqual(
      MONO_VARS.map(() => GEIST_MONO)
    )
  })

  it.each(themeNames)('should keep %s on the Geist Pixel display stack', (name) => {
    const css = themeToCss(BUILT_IN_THEMES[name])
    expect(DISPLAY_VARS.map((cssVar) => readVar(css, cssVar))).toStrictEqual(
      DISPLAY_VARS.map(() => GEIST_PIXEL)
    )
  })
})
