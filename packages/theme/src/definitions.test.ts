import { describe, it, expect } from 'vitest'

import {
  COLOR_MODES,
  ICON_COLORS,
  THEME_ALIASES,
  THEME_NAMES,
  THEME_VARIANTS,
  isBuiltInIconColor,
  isBuiltInTheme,
  resolveDefaultColorMode,
  resolveDefaultVariant,
  resolveThemeAlias,
  resolveThemeModes,
  resolveThemeVariants,
} from './definitions.ts'

describe('THEME_NAMES constant', () => {
  it('should contain exactly the built-in theme names', () => {
    expect(THEME_NAMES).toStrictEqual(['honeycrisp', 'grannysmith', 'midnight', 'arcade'])
  })

  it('should have exactly 4 entries', () => {
    expect(THEME_NAMES).toHaveLength(4)
  })
})

describe('THEME_VARIANTS constant', () => {
  it('should contain exactly the supported variants', () => {
    expect(THEME_VARIANTS).toStrictEqual(['dark', 'light'])
  })

  it('should be aliased by the deprecated COLOR_MODES export', () => {
    expect(COLOR_MODES).toStrictEqual(THEME_VARIANTS)
  })
})

describe('ICON_COLORS constant', () => {
  it('should contain exactly the 8 built-in icon colors', () => {
    expect(ICON_COLORS).toStrictEqual([
      'purple',
      'blue',
      'green',
      'amber',
      'cyan',
      'red',
      'pink',
      'slate',
    ])
  })

  it('should have exactly 8 entries', () => {
    expect(ICON_COLORS).toHaveLength(8)
  })
})

describe('THEME_ALIASES constant', () => {
  it('should map legacy default to honeycrisp', () => {
    expect(THEME_ALIASES['default']).toBe('honeycrisp')
  })
})

describe('resolveThemeAlias()', () => {
  it('should resolve default to honeycrisp', () => {
    expect(resolveThemeAlias('default')).toBe('honeycrisp')
  })

  it('should pass canonical names through unchanged', () => {
    expect(resolveThemeAlias('honeycrisp')).toBe('honeycrisp')
    expect(resolveThemeAlias('midnight')).toBe('midnight')
  })

  it('should pass unknown names through unchanged', () => {
    expect(resolveThemeAlias('custom')).toBe('custom')
  })
})

describe('isBuiltInTheme()', () => {
  it('should return true for honeycrisp', () => {
    expect(isBuiltInTheme('honeycrisp')).toBe(true)
  })

  it('should return true for grannysmith', () => {
    expect(isBuiltInTheme('grannysmith')).toBe(true)
  })

  it('should return true for midnight', () => {
    expect(isBuiltInTheme('midnight')).toBe(true)
  })

  it('should return true for arcade', () => {
    expect(isBuiltInTheme('arcade')).toBe(true)
  })

  it('should accept the legacy default alias as built-in', () => {
    expect(isBuiltInTheme('default')).toBe(true)
  })

  it('should return false for the legacy base name', () => {
    expect(isBuiltInTheme('base')).toBe(false)
  })

  it('should return false for an unknown theme name', () => {
    expect(isBuiltInTheme('unknown')).toBe(false)
  })

  it('should return false for an empty string', () => {
    expect(isBuiltInTheme('')).toBe(false)
  })
})

describe('isBuiltInIconColor()', () => {
  it('should return true for purple', () => {
    expect(isBuiltInIconColor('purple')).toBe(true)
  })

  it('should return true for blue', () => {
    expect(isBuiltInIconColor('blue')).toBe(true)
  })

  it('should return false for an unknown color', () => {
    expect(isBuiltInIconColor('orange')).toBe(false)
  })

  it('should return false for an empty string', () => {
    expect(isBuiltInIconColor('')).toBe(false)
  })
})

describe('resolveDefaultVariant()', () => {
  it('should return dark for honeycrisp', () => {
    expect(resolveDefaultVariant('honeycrisp')).toBe('dark')
  })

  it('should return dark for grannysmith', () => {
    expect(resolveDefaultVariant('grannysmith')).toBe('dark')
  })

  it('should return dark for midnight', () => {
    expect(resolveDefaultVariant('midnight')).toBe('dark')
  })

  it('should return dark for arcade', () => {
    expect(resolveDefaultVariant('arcade')).toBe('dark')
  })

  it('should be aliased by the deprecated resolveDefaultColorMode export', () => {
    expect(resolveDefaultColorMode('honeycrisp')).toBe('dark')
  })
})

describe('resolveThemeVariants()', () => {
  it('should return both variants for honeycrisp', () => {
    expect(resolveThemeVariants('honeycrisp')).toStrictEqual(['dark', 'light'])
  })

  it('should return both variants for grannysmith', () => {
    expect(resolveThemeVariants('grannysmith')).toStrictEqual(['dark', 'light'])
  })

  it('should return only dark for midnight', () => {
    expect(resolveThemeVariants('midnight')).toStrictEqual(['dark'])
  })

  it('should return only dark for arcade', () => {
    expect(resolveThemeVariants('arcade')).toStrictEqual(['dark'])
  })

  it('should be aliased by the deprecated resolveThemeModes export', () => {
    expect(resolveThemeModes('honeycrisp')).toStrictEqual(['dark', 'light'])
  })
})
