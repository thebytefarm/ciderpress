import { describe, it, expect, vi } from 'vitest'

vi.mock(import('./head/read.ts'), () => ({
  readCss: vi.fn<(name: string) => string>((name: string) => `/* mock ${name} */`),
  readJs: vi.fn<(name: string) => string>((name: string) => `/* mock ${name} */`),
}))

const { getThemeCss } = await import('./css.ts')

const APPLE_LOADER_CSS = '/* mock css/loader-backdrop.css *//* mock css/loader-apple.css */'
const CLASSIC_LOADER_CSS = '/* mock css/loader-backdrop.css *//* mock css/loader-dots.css */'

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

  it('should return apple loader CSS for unknown theme name when no loader specified', () => {
    expect(getThemeCss('unknown')).toBe(APPLE_LOADER_CSS)
  })

  it('should return classic loader CSS when loader=classic', () => {
    expect(getThemeCss('unknown', 'classic')).toBe(CLASSIC_LOADER_CSS)
  })

  it('should default to the apple loader when loader argument is omitted', () => {
    expect(getThemeCss('honeycrisp')).toContain('/* mock css/loader-apple.css */')
  })

  it('should swap to the classic loader for built-in themes when loader=classic', () => {
    const css = getThemeCss('honeycrisp', 'classic')
    expect(css).toContain('/* mock css/loader-dots.css */')
    expect(css).not.toContain('/* mock css/loader-apple.css */')
  })

  it('should contain theme-specific CSS for built-in themes', () => {
    expect(getThemeCss('honeycrisp')).toContain('/* mock css/themes/honeycrisp.css */')
  })

  it('should contain apple loader CSS by default for built-in themes', () => {
    expect(getThemeCss('honeycrisp')).toContain(APPLE_LOADER_CSS)
  })

  it('should emit no loader CSS when loader=false', () => {
    const css = getThemeCss('honeycrisp', false)
    expect(css).not.toContain('/* mock css/loader-backdrop.css */')
    expect(css).not.toContain('/* mock css/loader-apple.css */')
    expect(css).not.toContain('/* mock css/loader-dots.css */')
  })

  it('should inline custom loader content as a data URI when given inline SVG markup', () => {
    const css = getThemeCss('honeycrisp', {
      content: '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>',
      label: 'brewing',
    })
    expect(css).toContain('/* mock css/loader-backdrop.css */')
    expect(css).toContain('data:image/svg+xml;utf8,')
    expect(css).toContain("content: 'brewing'")
    expect(css).not.toContain('/* mock css/loader-apple.css */')
  })

  it('should use a custom loader asset path verbatim in url(...)', () => {
    const css = getThemeCss('honeycrisp', { content: '/assets/loader.svg' })
    expect(css).toContain('background-image: url("/assets/loader.svg")')
  })

  it('should suppress the label rule entirely when label is an empty string', () => {
    const css = getThemeCss('honeycrisp', { content: '/loader.svg', label: '' })
    expect(css).not.toContain('html::after')
  })
})
