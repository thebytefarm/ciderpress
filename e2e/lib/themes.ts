export const THEMES = [
  'mulled',
  'honeycrisp',
  'grannysmith',
  'amber',
  'midnight',
  'arcade',
] as const

export const VARIANTS = ['dark', 'light'] as const

export type Theme = (typeof THEMES)[number]
export type Variant = (typeof VARIANTS)[number]

/** Every (theme, variant) pair — 12 combinations. */
export const THEME_MATRIX: ReadonlyArray<{ theme: Theme; variant: Variant }> = THEMES.flatMap(
  (theme) => VARIANTS.map((variant) => ({ theme, variant }))
)
