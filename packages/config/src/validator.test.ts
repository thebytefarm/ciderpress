import { match, P } from 'massaman/match'
import { describe, it, expect } from 'vitest'

import { defineConfig } from './define-config.ts'
import { validateConfig } from './validator.ts'

const validConfig = {
  pages: [{ title: 'Test', path: '/test', content: '# Test' }],
}

describe('validateConfig()', () => {
  it('should return [null, config] for valid config', () => {
    const [error, config] = validateConfig(validConfig)
    expect(error).toBeNull()
    expect(config).not.toBeNull()
  })

  it('should return config with pages for valid input', () => {
    const [, config] = validateConfig(validConfig)
    if (config) {
      expect(config.pages).toHaveLength(1)
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

  it('should return error when pages array is empty', () => {
    const [error] = validateConfig({ pages: [] })
    expect(error).toMatchObject({ type: 'validation_failed' })
  })
})

describe('validateConfig() — top-level page placement', () => {
  it('should reject a top-level leaf page with a nested path', () => {
    const [error, config] = validateConfig({
      pages: [{ title: 'Introduction', path: '/getting-started/introduction', content: '# Intro' }],
    })
    expect(config).toBeNull()
    expect(error).toMatchObject({
      type: 'invalid_section',
      message: expect.stringContaining("nested path '/getting-started/introduction'"),
    })
  })

  it('should accept a top-level leaf page with a single-segment path', () => {
    const [error] = validateConfig({
      pages: [{ title: 'Examples', path: '/examples', content: '# Examples' }],
    })
    expect(error).toBeNull()
  })

  it('should accept a nested leaf page with a nested path', () => {
    const [error] = validateConfig({
      pages: [
        {
          title: 'Getting Started',
          path: '/getting-started',
          pages: [
            { title: 'Introduction', path: '/getting-started/introduction', content: '# Intro' },
          ],
        },
      ],
    })
    expect(error).toBeNull()
  })

  it('should not flag a hidden top-level leaf with a nested path', () => {
    const [error] = validateConfig({
      pages: [
        {
          title: 'Changelog',
          path: '/meta/changelog',
          content: '# Changelog',
          nav: { hidden: true },
        },
      ],
    })
    expect(error).toBeNull()
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
  // mark anywhere. All brand surfaces now live under the unified
  // `brand` block in the new public API.
  const whiteLabelConfig = {
    title: 'maltty',
    description: 'docs site',
    brand: {
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
    },
    pages: [{ title: 'Welcome', path: '/welcome', content: '# Welcome' }],
  }

  it('should accept a config that fully overrides every ciderpress brand surface', () => {
    const [error, config] = validateConfig(whiteLabelConfig)
    expect(error).toBeNull()
    expect(config).not.toBeNull()
  })

  it('should accept favicon in object form with src', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      brand: { ...whiteLabelConfig.brand, favicon: { src: '/favicon.png' } },
    })
    expect(error).toBeNull()
  })

  it('should accept favicon object with explicit MIME type', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      brand: { ...whiteLabelConfig.brand, favicon: { src: '/favicon', type: 'image/svg+xml' } },
    })
    expect(error).toBeNull()
  })

  it('should accept home.hero.demo as a terminal visual', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: {
        hero: {
          demo: {
            type: 'terminal',
            windowTitle: '~/code/acme — acme dev',
            command: 'acme dev',
            lines: [
              { kind: 'ok', text: 'edge runtime ready' },
              { kind: 'cmt', text: 'handlers.ts changed — rebuilt' },
            ],
          },
        },
      },
    })
    expect(error).toBeNull()
  })

  it('should accept home.hero.demo as an image visual', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: { hero: { demo: { type: 'image', src: '/cli.svg', alt: 'CLI' } } },
    })
    expect(error).toBeNull()
  })

  it('should accept home.hero.demo as a code visual', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: { hero: { demo: { type: 'code', code: 'const x = 1', language: 'ts' } } },
    })
    expect(error).toBeNull()
  })

  it('should accept home.hero.demo as false', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: { hero: { demo: false } },
    })
    expect(error).toBeNull()
  })

  it('should accept a split block with a code visual', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: {
        blocks: [
          {
            type: 'split',
            label: 'Configuration',
            title: 'One config',
            bullets: ['typed', 'validated'],
            visual: { type: 'code', code: 'export default {}', language: 'ts' },
          },
        ],
      },
    })
    expect(error).toBeNull()
  })

  it('should accept a split block with an image visual', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: {
        blocks: [
          {
            type: 'split',
            title: 'Screenshot',
            visual: { type: 'image', src: '/shot.png', alt: 'UI' },
          },
        ],
      },
    })
    expect(error).toBeNull()
  })

  it('should accept a split block with a terminal visual', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: {
        blocks: [
          {
            type: 'split',
            title: 'Deploy',
            visual: {
              type: 'terminal',
              command: 'acme deploy',
              lines: [{ kind: 'ok', text: 'done' }],
            },
          },
        ],
      },
    })
    expect(error).toBeNull()
  })

  it('should accept multiple split blocks in home.blocks', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: {
        blocks: [
          { type: 'split', title: 'One', visual: { type: 'code', code: 'a', language: 'ts' } },
          { type: 'split', title: 'Two', reverse: true, visual: { type: 'image', src: '/b.png' } },
        ],
      },
    })
    expect(error).toBeNull()
  })

  it('should accept a tabs block in either orientation', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: {
        blocks: [
          {
            type: 'tabs',
            orientation: 'vertical',
            items: [
              {
                label: 'Sync',
                icon: 'pixelarticons:reload',
                body: 'Watches your repo',
                bullets: ['Glob discovery'],
                cta: { variant: 'primary', text: 'Docs', href: '/guides' },
                visual: { type: 'code', code: 'const a = 1', language: 'ts' },
              },
            ],
          },
          { type: 'tabs', orientation: 'horizontal', reverse: true, items: [{ label: 'API' }] },
        ],
      },
    })
    expect(error).toBeNull()
  })

  it('should reject a tabs block with an unknown orientation', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: { blocks: [{ type: 'tabs', orientation: 'diagonal', items: [{ label: 'API' }] }] },
    })
    expect(error).toMatchObject({ type: 'validation_failed' })
  })

  it('should reject a tab item without a label', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: { blocks: [{ type: 'tabs', items: [{ body: 'No label' }] }] },
    })
    expect(error).toMatchObject({ type: 'validation_failed' })
  })

  it('should accept an empty home.blocks array', () => {
    const [error] = validateConfig({ ...whiteLabelConfig, home: { blocks: [] } })
    expect(error).toBeNull()
  })

  it('should reject a home block with an unknown type', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: { blocks: [{ type: 'unknown-block' }] },
    })
    expect(error).toMatchObject({ type: 'validation_failed' })
  })

  it('should reject a visual with no type discriminator', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: { blocks: [{ type: 'split', title: 'Bad', visual: { code: 'a' } }] },
    })
    expect(error).toMatchObject({ type: 'validation_failed' })
  })

  it('should reject a visual whose fields do not match its type', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: {
        blocks: [{ type: 'split', title: 'Bad', visual: { type: 'code', src: '/b.png' } }],
      },
    })
    expect(error).toMatchObject({ type: 'validation_failed' })
  })

  it('should report the offending path for an unknown visual key', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: {
        blocks: [{ type: 'split', title: 'Bad', visual: { type: 'code', code: 'a', cdoe: 'b' } }],
      },
    })
    expect(error).toMatchObject({ type: 'validation_failed' })
    const issues = match(error)
      .with({ errors: P.nonNullable }, (e) => e.errors)
      .otherwise(() => [])
    expect(issues.map((issue) => issue.path.join('.'))).toContain('home.blocks.0.visual')
  })

  it('should reject a nested heading object on a features block', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: {
        blocks: [{ type: 'features', heading: { title: 'What you get' } }],
      },
    })
    expect(error).toMatchObject({ type: 'validation_failed' })
  })

  it('should accept features + showcase blocks with flat headings', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      home: {
        blocks: [
          {
            type: 'features',
            items: [{ title: 'F', description: 'D' }],
            columns: 3,
            label: 'Features',
            title: 'What you get',
            body: 'Everything you need.',
          },
          {
            type: 'showcase',
            columns: 2,
            title: 'Everything in the monorepo',
            source: ['/packages/sdk'],
          },
          { type: 'cta', title: 'Ready?', body: 'Ship today.' },
        ],
      },
    })
    expect(error).toBeNull()
  })

  it('should reject empty favicon src', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      brand: { ...whiteLabelConfig.brand, favicon: '' },
    })
    expect(error).toMatchObject({ type: 'validation_failed' })
  })

  it('should reject brand.loader.maxDisplayMs lower than minDisplayMs + 200', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      brand: {
        ...whiteLabelConfig.brand,
        loader: { content: '<svg/>', minDisplayMs: 500, maxDisplayMs: 600 },
      },
    })
    expect(error).toMatchObject({ type: 'validation_failed' })
  })

  it('should reject empty src at schema level for a page icon (not only workspace icons)', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      pages: [{ title: 'Welcome', path: '/welcome', content: '# Welcome', icon: { src: '' } }],
    })
    expect(error).toMatchObject({ type: 'validation_failed' })
  })

  it('should accept brand.loader=false to disable the FOUC overlay entirely', () => {
    const [error] = validateConfig({
      ...whiteLabelConfig,
      brand: { ...whiteLabelConfig.brand, loader: false },
    })
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
