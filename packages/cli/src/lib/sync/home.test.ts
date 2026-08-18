import type { CiderpressConfig, HomeBlock } from '@ciderpress/config'
import { describe, it, expect } from 'vitest'

import { parse as parseFrontmatter } from './frontmatter.ts'
import { generateDefaultHomePage } from './home.ts'

const REPO_ROOT = '/repo'

describe('generateDefaultHomePage()', () => {
  it('should synthesize the default deck when home.blocks is omitted', async () => {
    const blocks = await blocksFor()
    expect(blocks.map((b) => b.type)).toEqual(['features', 'showcase'])
  })

  it('should emit no blocks for an empty home.blocks array', async () => {
    const blocks = await blocksFor({ home: { blocks: [] } })
    expect(blocks).toEqual([])
  })

  it('should preserve block order', async () => {
    const configured: readonly HomeBlock[] = [
      { type: 'cta', title: 'Ready?' },
      { type: 'proof', names: ['acme'] },
      { type: 'features' },
    ]
    const blocks = await blocksFor({ home: { blocks: configured } })
    expect(blocks.map((b) => b.type)).toEqual(['cta', 'proof', 'features'])
  })

  it('should keep every repeated split block', async () => {
    const configured: readonly HomeBlock[] = [
      { type: 'split', title: 'One', visual: { type: 'code', code: 'a' } },
      { type: 'split', title: 'Two', reverse: true, visual: { type: 'image', src: '/b.png' } },
    ]
    const blocks = await blocksFor({ home: { blocks: configured } })
    expect(blocks).toHaveLength(2)
    expect(blocks[1]).toMatchObject({
      title: 'Two',
      reverse: true,
      visual: { type: 'image', src: '/b.png' },
    })
  })

  it('should auto-derive feature cards from the first pages', async () => {
    const blocks = await blocksFor({ home: { blocks: [{ type: 'features' }] } })
    const [first] = blocks
    const items = firstBlockValue(first, 'items') as readonly Record<string, unknown>[]
    expect(items).toHaveLength(3)
    expect(items[0]).toMatchObject({ title: 'Guides', link: '/guides' })
  })

  it('should serialize icons on explicit feature cards', async () => {
    const blocks = await blocksFor({
      home: {
        blocks: [
          {
            type: 'features',
            items: [{ title: 'Fast', description: 'Very', icon: 'pixelarticons:speed-fast' }],
          },
        ],
      },
    })
    const [first] = blocks
    expect(firstBlockValue(first, 'items')).toEqual([
      { title: 'Fast', details: 'Very', icon: 'pixelarticons:speed-fast' },
    ])
  })

  it('should carry the flat heading keys and columns onto a features block', async () => {
    const blocks = await blocksFor({
      home: {
        blocks: [{ type: 'features', label: 'What', title: 'You get', body: 'All', columns: 2 }],
      },
    })
    expect(blocks[0]).toMatchObject({ label: 'What', title: 'You get', body: 'All', columns: 2 })
  })

  it('should resolve showcase source paths into cards', async () => {
    const blocks = await blocksFor({
      packages: [
        {
          title: 'SDK',
          path: '/packages/sdk',
          description: 'Typed client',
          tags: ['typescript'],
        },
      ],
      home: { blocks: [{ type: 'showcase', source: ['/packages/sdk', '/guides'] }] },
    })
    const [first] = blocks
    expect(firstBlockValue(first, 'cards')).toMatchObject([
      { title: 'SDK', href: '/packages/sdk', description: 'Typed client' },
      { title: 'Guides', href: '/guides' },
    ])
  })

  it('should resolve a showcase source path nested under a workspace', async () => {
    const blocks = await blocksFor({
      apps: [
        {
          title: 'API',
          path: '/apps/api',
          description: 'REST API',
          pages: [
            {
              title: 'Webhooks',
              path: '/apps/api/webhooks',
              card: { description: 'Signed events' },
            },
          ],
        },
      ],
      home: { blocks: [{ type: 'showcase', source: ['/apps/api/webhooks'] }] },
    })
    const [first] = blocks
    expect(firstBlockValue(first, 'cards')).toMatchObject([
      { title: 'Webhooks', href: '/apps/api/webhooks', description: 'Signed events' },
    ])
  })

  it('should skip an unresolvable showcase source path with a warning', async () => {
    const result = await generateDefaultHomePage(
      config({ home: { blocks: [{ type: 'showcase', source: ['/nope'] }] } }),
      REPO_ROOT
    )
    const { data } = parseFrontmatter(result.content)
    const [block] = data.blocks as readonly Record<string, unknown>[]
    expect(firstBlockValue(block, 'cards')).toEqual([])
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toContain('/nope')
  })

  it('should leave the default workspace showcase without cards', async () => {
    const blocks = await blocksFor({ home: { blocks: [{ type: 'showcase' }] } })
    expect(blocks[0]).not.toHaveProperty('cards')
  })

  it('should serialize icons on tab items', async () => {
    const blocks = await blocksFor({
      home: {
        blocks: [
          {
            type: 'tabs',
            items: [
              { label: 'Sync', icon: 'pixelarticons:reload', body: 'Watches your repo' },
              { label: 'Themes' },
            ],
          },
        ],
      },
    })
    const [first] = blocks
    expect(firstBlockValue(first, 'items')).toEqual([
      { label: 'Sync', body: 'Watches your repo', icon: 'pixelarticons:reload' },
      { label: 'Themes' },
    ])
  })

  it('should omit the icon key on a tab item without one', async () => {
    const blocks = await blocksFor({
      home: { blocks: [{ type: 'tabs', items: [{ label: 'Themes' }] }] },
    })
    const [first] = blocks
    const items = firstBlockValue(first, 'items') as readonly Record<string, unknown>[]
    expect(items[0]).not.toHaveProperty('icon')
  })

  it('should pass tab orientation and visuals through verbatim', async () => {
    const blocks = await blocksFor({
      home: {
        blocks: [
          {
            type: 'tabs',
            orientation: 'horizontal',
            reverse: true,
            items: [{ label: 'API', visual: { type: 'code', code: 'const a = 1' } }],
          },
        ],
      },
    })
    expect(blocks[0]).toMatchObject({
      orientation: 'horizontal',
      reverse: true,
      items: [{ label: 'API', visual: { type: 'code', code: 'const a = 1' } }],
    })
  })

  it('should serialize hero demo false rather than dropping it', async () => {
    const result = await generateDefaultHomePage(
      config({ home: { hero: { demo: false } } }),
      REPO_ROOT
    )
    const { data } = parseFrontmatter(result.content)
    expect(data.heroDemo).toBe(false)
  })

  it('should pass a hero demo visual through verbatim', async () => {
    const result = await generateDefaultHomePage(
      config({
        home: { hero: { demo: { type: 'terminal', command: 'acme dev', lines: [] } } },
      }),
      REPO_ROOT
    )
    const { data } = parseFrontmatter(result.content)
    expect(data.heroDemo).toMatchObject({ type: 'terminal', command: 'acme dev' })
  })
})

/**
 * Build a config fixture with a three-page top level.
 *
 * @private
 * @param overrides - Config fields layered onto the fixture
 * @returns Complete config carrying the overrides
 */
function config(overrides: Partial<CiderpressConfig> = {}): CiderpressConfig {
  return {
    title: 'Acme Docs',
    description: 'Everything about Acme',
    pages: [
      { title: 'Guides', path: '/guides', description: 'How-to walkthroughs' },
      { title: 'Reference', path: '/reference' },
      { title: 'Concepts', path: '/concepts' },
    ],
    ...overrides,
  } as CiderpressConfig
}

/**
 * Compile a config's home page and return its parsed frontmatter blocks.
 *
 * @private
 * @param overrides - Config fields layered onto the fixture
 * @returns Parsed `blocks` array (empty when the key is absent)
 */
async function blocksFor(
  overrides: Partial<CiderpressConfig> = {}
): Promise<readonly Record<string, unknown>[]> {
  const result = await generateDefaultHomePage(config(overrides), REPO_ROOT)
  const { data } = parseFrontmatter(result.content)
  const blocks = data.blocks
  if (!Array.isArray(blocks)) {
    return []
  }
  return blocks as readonly Record<string, unknown>[]
}

/**
 * Read a key off a compiled block without optional chaining.
 *
 * @private
 * @param block - Compiled block, or undefined when the array was empty
 * @param key - Frontmatter key to read
 * @returns The key's value, or undefined
 */
function firstBlockValue(block: Record<string, unknown> | undefined, key: string): unknown {
  if (block === undefined) {
    return undefined
  }
  return block[key]
}
