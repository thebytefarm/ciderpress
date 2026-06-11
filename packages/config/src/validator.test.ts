import { describe, it, expect } from 'vitest'

import { defineConfig } from './define-config.ts'
import { validateConfig } from './validator.ts'

const validConfig = {
  sections: [{ title: 'Test', path: '/test', content: '# Test' }],
}

describe('validateConfig()', () => {
  it('should return [null, config] for valid config', () => {
    const [error, config] = validateConfig(validConfig)
    expect(error).toBeNull()
    expect(config).not.toBeNull()
  })

  it('should return config with sections for valid input', () => {
    const [, config] = validateConfig(validConfig)
    if (config) {
      expect(config.sections).toHaveLength(1)
    }
  })

  it('should return [error, null] for invalid config', () => {
    const [error, config] = validateConfig({})
    expect(error).not.toBeNull()
    expect(config).toBeNull()
  })

  it('should return error with type validation_failed for invalid config', () => {
    const [error] = validateConfig({})
    expect(error).toMatchObject({ type: 'validation_failed' })
  })

  it('should return error when sections array is empty', () => {
    const [error] = validateConfig({ sections: [] })
    expect(error).toMatchObject({ type: 'validation_failed' })
  })
})

describe('defineConfig()', () => {
  it('should return the same config object passed in', () => {
    const config = defineConfig(validConfig)
    expect(config).toBe(validConfig)
  })
})

describe('validateConfig() — white-label acceptance config', () => {
  // Mirrors the acceptance scenario from the rc.4 feedback:
  // every brand surface (logo, favicon, topbar icon, loader, home blocks)
  // overridden so the rendered site carries no ciderpress wordmark or
  // mark anywhere.
  const whiteLabelConfig = {
    title: 'maltty',
    description: 'docs site',
    logo: '/logo.svg',
    favicon: '/favicon.svg',
    icon: { src: '/icon.svg', alt: 'maltty' },
    loader: {
      content: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      label: 'brewing',
      maxDisplayMs: 4000,
    },
    sections: [{ title: 'Welcome', path: '/welcome', content: '# Welcome' }],
  }

  it('should accept a config that fully overrides every ciderpress brand surface', () => {
    const [error, config] = validateConfig(whiteLabelConfig)
    expect(error).toBeNull()
    expect(config).not.toBeNull()
  })

  it('should accept favicon in object form with explicit type', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      favicon: { src: '/favicon.png', type: 'image/png' },
    })
    expect(error).toBeNull()
  })

  it('should accept loader=false to disable the FOUC overlay entirely', () => {
    const [error] = validateConfig({ ...whiteLabelConfig, loader: false })
    expect(error).toBeNull()
  })

  it('should accept image-form icons inside workspace cards', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      apps: [
        {
          title: 'malt',
          description: 'brewing kit',
          path: '/apps/malt',
          icon: { src: '/apps/malt.svg', alt: 'malt' },
        },
      ],
    })
    expect(error).toBeNull()
  })

  it('should reject an image-form icon with an empty src', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      apps: [
        {
          title: 'malt',
          description: 'brewing kit',
          path: '/apps/malt',
          icon: { src: '' },
        },
      ],
    })
    expect(error).toMatchObject({ type: 'invalid_icon' })
  })
})
