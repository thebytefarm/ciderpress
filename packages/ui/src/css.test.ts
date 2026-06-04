import { describe, it, expect, vi } from 'vitest'

vi.mock(import('./head/read.ts'), () => ({
  readCss: vi.fn<(name: string) => string>((name: string) => `/* mock ${name} */`),
  readJs: vi.fn<(name: string) => string>((name: string) => `/* mock ${name} */`),
}))

const { getThemeCss } = await import('./css.ts')

const LOADER_CSS = '/* mock css/loader-backdrop.css *//* mock css/loader-dots.css */'

describe('getThemeCss()', () => {
  it('should return a string for built-in theme mulled', () => {
    expect(getThemeCss('mulled')).toStrictEqual(expect.any(String))
  })

  it('should return a string for built-in theme honeycrisp', () => {
    expect(getThemeCss('honeycrisp')).toStrictEqual(expect.any(String))
  })

  it('should return a string for built-in theme grannysmith', () => {
    expect(getThemeCss('grannysmith')).toStrictEqual(expect.any(String))
  })

  it('should return a string for built-in theme amber', () => {
    expect(getThemeCss('amber')).toStrictEqual(expect.any(String))
  })

  it('should return a string for built-in theme midnight', () => {
    expect(getThemeCss('midnight')).toStrictEqual(expect.any(String))
  })

  it('should return a string for built-in theme arcade', () => {
    expect(getThemeCss('arcade')).toStrictEqual(expect.any(String))
  })

  it('should alias legacy theme name default to mulled', () => {
    expect(getThemeCss('default')).toContain('/* mock css/themes/mulled.css */')
  })

  it('should return loader CSS for unknown theme name', () => {
    expect(getThemeCss('unknown')).toBe(LOADER_CSS)
  })

  it('should contain theme-specific CSS for built-in themes', () => {
    expect(getThemeCss('honeycrisp')).toContain('/* mock css/themes/honeycrisp.css */')
  })

  it('should contain loader CSS for built-in themes', () => {
    expect(getThemeCss('honeycrisp')).toContain(LOADER_CSS)
  })
})
