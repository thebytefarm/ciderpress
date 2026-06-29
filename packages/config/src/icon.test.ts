import { describe, it, expect } from 'vitest'

import { resolveIcon, resolveOptionalIcon, serializeIcon } from './icon'

describe('resolveIcon()', () => {
  it('should return iconify id with default purple color when given a string', () => {
    const result = resolveIcon('devicon:react')
    expect(result).toStrictEqual({ kind: 'iconify', id: 'devicon:react', color: 'purple' })
  })

  it('should return iconify id and color passthrough when given an iconify object', () => {
    const result = resolveIcon({ id: 'devicon:react', color: 'blue' })
    expect(result).toStrictEqual({ kind: 'iconify', id: 'devicon:react', color: 'blue' })
  })

  it('should default color to purple when iconify object omits color', () => {
    const result = resolveIcon({ id: 'devicon:react' })
    expect(result).toStrictEqual({ kind: 'iconify', id: 'devicon:react', color: 'purple' })
  })

  it('should return image kind with src and alt when given an image object', () => {
    const result = resolveIcon({ src: '/icon.svg', alt: 'brand' })
    expect(result).toStrictEqual({ kind: 'image', src: '/icon.svg', alt: 'brand' })
  })

  it('should default alt to empty string for image icons without alt', () => {
    const result = resolveIcon({ src: '/icon.svg' })
    expect(result).toStrictEqual({ kind: 'image', src: '/icon.svg', alt: '' })
  })
})

describe('resolveOptionalIcon()', () => {
  it('should return undefined when given no icon', () => {
    // oxlint-disable-next-line unicorn/no-useless-undefined -- testing undefined input explicitly
    const result = resolveOptionalIcon(undefined)
    expect(result).toBeUndefined()
  })

  it('should delegate to resolveIcon and return resolved icon when given a string', () => {
    const result = resolveOptionalIcon('devicon:react')
    expect(result).toStrictEqual({ kind: 'iconify', id: 'devicon:react', color: 'purple' })
  })

  it('should delegate to resolveIcon and return resolved icon when given an iconify object', () => {
    const result = resolveOptionalIcon({ id: 'devicon:react', color: 'blue' })
    expect(result).toStrictEqual({ kind: 'iconify', id: 'devicon:react', color: 'blue' })
  })

  it('should delegate to resolveIcon and return resolved image icon when given an image object', () => {
    const result = resolveOptionalIcon({ src: '/icon.svg', alt: 'brand' })
    expect(result).toStrictEqual({ kind: 'image', src: '/icon.svg', alt: 'brand' })
  })
})

describe('serializeIcon()', () => {
  it('should return bare id string when iconify color is the default purple', () => {
    const result = serializeIcon({ kind: 'iconify', id: 'devicon:react', color: 'purple' })
    expect(result).toBe('devicon:react')
  })

  it('should return id+color object when iconify color is explicit', () => {
    const result = serializeIcon({ kind: 'iconify', id: 'devicon:react', color: 'blue' })
    expect(result).toStrictEqual({ id: 'devicon:react', color: 'blue' })
  })

  it('should return image-tagged object when icon kind is image', () => {
    const result = serializeIcon({ kind: 'image', src: '/icon.svg', alt: 'brand' })
    expect(result).toStrictEqual({ kind: 'image', src: '/icon.svg', alt: 'brand' })
  })

  it('should return undefined when input is undefined', () => {
    // oxlint-disable-next-line unicorn/no-useless-undefined -- testing undefined input explicitly
    const result = serializeIcon(undefined)
    expect(result).toBeUndefined()
  })
})
