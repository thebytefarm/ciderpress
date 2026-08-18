import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, it, expect } from 'vitest'

const TOKENS_CSS = readStyle('./theme/styles/overrides/tokens.css')
const RSPRESS_CSS = readStyle('./theme/styles/overrides/rspress.css')

/**
 * Component and override stylesheets that paint the surfaces named in the
 * font contract. Generated theme files and `overrides/fonts.css` (which
 * holds `@font-face` rules, not usage) are deliberately excluded.
 */
const SURFACE_STYLESHEETS: readonly string[] = [
  './theme/styles/overrides/tokens.css',
  './theme/styles/overrides/rspress.css',
  './theme/styles/overrides/sidebar.css',
  './theme/styles/overrides/home.css',
  './theme/styles/overrides/content-footer.css',
  './theme/styles/rich-text.css',
  './theme/components/home/hero.css',
  './theme/components/home/cta.css',
  './theme/components/home/feature-card.css',
  './theme/components/home/split.css',
  './theme/components/openapi/openapi.css',
  './theme/components/sidebar/framework-picker.css',
  './theme/components/nav/version-chip.css',
]

describe('font token compatibility aliases', () => {
  const compatVars: readonly (readonly [string, string])[] = [
    ['--cp-font-family-base', 'var(--cp-ff-sans)'],
    ['--cp-font-family-sans', 'var(--cp-ff-sans)'],
    ['--cp-font-family-mono', 'var(--cp-ff-mono)'],
    ['--cp-font-family-pixel', 'var(--cp-ff-display)'],
    ['--rp-font-family-base', 'var(--cp-ff-sans)'],
    ['--rp-font-family-mono', 'var(--cp-ff-mono)'],
  ]

  it.each(compatVars)('should define %s as %s in tokens.css', (cssVar, expected) => {
    expect(TOKENS_CSS).toContain(`${cssVar}: ${expected};`)
  })

  it('should declare all three canonical family tokens', () => {
    const declared = ['--cp-ff-sans', '--cp-ff-mono', '--cp-ff-display'].filter((cssVar) =>
      TOKENS_CSS.includes(`${cssVar}:`)
    )
    expect(declared).toHaveLength(3)
  })
})

describe('rspress override stylesheet', () => {
  it('should not redeclare the Rspress font variables', () => {
    // These lost the cascade — Rspress ships its own `:root` defaults
    // unlayered, which beat every `@layer`. They now come from the theme
    // block instead. See `COMPAT_VAR_MAP` in `@ciderpress/theme`.
    expect(RSPRESS_CSS).not.toContain('--rp-font-family-base:')
  })

  it('should not redeclare the Rspress mono font variable', () => {
    expect(RSPRESS_CSS).not.toContain('--rp-font-family-mono:')
  })
})

describe('surface stylesheets', () => {
  it.each(SURFACE_STYLESHEETS)('should resolve every font-family in %s through a token', (path) => {
    const literals = fontFamilyValues(readStyle(path)).filter(
      (value) => !value.startsWith('var(') && value !== 'inherit'
    )
    expect(literals).toStrictEqual([])
  })

  it('should paint the base document surfaces from the canonical sans token', () => {
    expect(TOKENS_CSS).toContain('font-family: var(--cp-ff-sans);')
  })

  it('should paint feature card titles from the canonical display token', () => {
    expect(readStyle('./theme/components/home/feature-card.css')).toContain(
      'font-family: var(--cp-ff-display);'
    )
  })
})

/**
 * Read a stylesheet from this package's `src/` tree.
 *
 * @private
 * @param relative - Path relative to `packages/ui/src`
 * @returns File contents as UTF-8
 */
function readStyle(relative: string): string {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')
}

/**
 * Collect every `font-family: <value>` declaration in a stylesheet, with
 * comments stripped so prose mentioning a font name never trips an assertion.
 *
 * @private
 * @param css - CSS source
 * @returns Declared values in source order
 */
function fontFamilyValues(css: string): readonly string[] {
  const withoutComments = css.replaceAll(/\/\*[\s\S]*?\*\//g, '')
  return [...withoutComments.matchAll(/font-family:\s*([^;]+);/g)].map((m) =>
    (m[1] as string).trim()
  )
}
