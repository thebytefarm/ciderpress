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
    // Topbar chip (rendered by HeaderIcon next to HeaderLogo) — small mark
    // distinct from the wordmark `logo`. Image form here exercises the
    // full white-label surface.
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

  it('should accept favicon in object form with src', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      favicon: { src: '/favicon.png' },
    })
    expect(error).toBeNull()
  })

  it('should accept favicon object with explicit MIME type', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      favicon: { src: '/favicon', type: 'image/svg+xml' },
    })
    expect(error).toBeNull()
  })

  it('should accept home.heroDemo as a structured terminal', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: {
        heroDemo: {
          windowTitle: '~/code/acme — acme dev',
          command: 'acme dev',
          lines: [
            { kind: 'ok', text: 'edge runtime ready' },
            { kind: 'cmt', text: 'handlers.ts changed — rebuilt' },
          ],
        },
      },
    })
    expect(error).toBeNull()
  })

  it('should accept home.heroDemo as an image', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: { heroDemo: { src: '/cli.svg', alt: 'CLI' } },
    })
    expect(error).toBeNull()
  })

  it('should accept home.split as a custom config with code visual', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: {
        split: {
          eyebrow: 'Configuration',
          title: 'One config',
          bullets: ['typed', 'validated'],
          visual: { code: 'export default {}', language: 'ts' },
        },
      },
    })
    expect(error).toBeNull()
  })

  it('should accept home.layout as a section render-order array', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: { layout: ['hero', 'cta', 'features', 'workspaces'] },
    })
    expect(error).toBeNull()
  })

  it('should reject home.layout with duplicate section ids', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: { layout: ['hero', 'features', 'hero'] },
    })
    expect(error).toMatchObject({ type: 'validation_failed' })
  })

  it('should reject home.layout with unknown section ids', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: { layout: ['hero', 'unknown-section'] },
    })
    expect(error).toMatchObject({ type: 'validation_failed' })
  })

  it('should accept home.features.heading.eyebrow + workspaces heading', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: {
        features: {
          columns: 3,
          heading: { eyebrow: 'Features', title: 'What you get' },
        },
        workspaces: {
          columns: 2,
          heading: { title: 'Everything in the monorepo' },
        },
      },
    })
    expect(error).toBeNull()
  })

  it('should reject empty favicon src', () => {
    const [error] = validateConfig({ ...whiteLabelConfig, favicon: '' })
    expect(error).toMatchObject({ type: 'validation_failed' })
  })

  it('should reject loader.maxDisplayMs lower than minDisplayMs + 200', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      loader: { content: '<svg/>', minDisplayMs: 500, maxDisplayMs: 600 },
    })
    expect(error).toMatchObject({ type: 'validation_failed' })
  })

  it('should reject empty src at schema level for a section icon (not only workspace icons)', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      sections: [{ title: 'Welcome', path: '/welcome', content: '# Welcome', icon: { src: '' } }],
    })
    expect(error).toMatchObject({ type: 'validation_failed' })
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
    // Schema-level (`z.string().min(1)`) catches this before the semantic
    // pass runs, so the surfaced error is the Zod validation_failed envelope.
    expect(error).toMatchObject({ type: 'validation_failed' })
  })
})
