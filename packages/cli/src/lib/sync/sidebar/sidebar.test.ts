import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { ResolvedEntry } from '../types'

vi.mock(import('node:fs/promises'), () => ({
  default: {
    readFile: vi
      .fn<() => Promise<string>>()
      .mockResolvedValue('---\n---\nSome description paragraph'),
  },
}))

const { injectLandingPages } = await import('./inject')

describe('injectLandingPages()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should inject a virtual landing page for a section with children and no page', () => {
    const child: ResolvedEntry = {
      title: 'Child Page',
      link: '/section/child',
      page: { outputPath: 'section/child.md', frontmatter: {} },
    }
    const section: ResolvedEntry = {
      title: 'My Section',
      link: '/section',
      items: [child],
    }

    const [result] = injectLandingPages([section], [], [])

    expect(result.page).toBeDefined()
    expect(result.page!.outputPath).toMatch(/\.mdx$/)
    expect(section.page).toBeUndefined()
  })

  it('should not overwrite an existing page on a section', () => {
    const existingPage = { outputPath: 'section/index.md', frontmatter: {} }
    const child: ResolvedEntry = {
      title: 'Child Page',
      link: '/section/child',
      page: { outputPath: 'section/child.md', frontmatter: {} },
    }
    const section: ResolvedEntry = {
      title: 'My Section',
      link: '/section',
      page: existingPage,
      items: [child],
    }

    const [result] = injectLandingPages([section], [], [])

    expect(result.page).toBe(existingPage)
  })

  it('should recursively inject landing pages for nested sections', () => {
    const grandchild: ResolvedEntry = {
      title: 'Grandchild',
      link: '/section/nested/grandchild',
      page: { outputPath: 'section/nested/grandchild.md', frontmatter: {} },
    }
    const nested: ResolvedEntry = {
      title: 'Nested Section',
      link: '/section/nested',
      items: [grandchild],
    }
    const section: ResolvedEntry = {
      title: 'My Section',
      link: '/section',
      items: [nested],
    }

    const [result] = injectLandingPages([section], [], [])

    const [rebuiltNested] = result.items!
    expect(rebuiltNested.page).toBeDefined()
    expect(rebuiltNested.page!.outputPath).toMatch(/\.mdx$/)
    expect(nested.page).toBeUndefined()
  })

  it('should place an OpenAPI workspace landing page at the directory index', () => {
    const entry: ResolvedEntry = {
      title: 'API',
      link: '/apps/api',
      items: [],
    }
    const [result] = injectLandingPages(
      [entry],
      [],
      [
        {
          title: 'API',
          path: '/apps/api',
          description: 'REST API',
          openapi: { spec: 'apps/api/openapi.json', path: '/apps/api/reference' },
        },
      ]
    )

    expect(result.page).toMatchObject({ outputPath: 'apps/api/index.md' })
  })

  it('should keep a root OpenAPI workspace landing page at the root index', () => {
    const entry: ResolvedEntry = {
      title: 'API',
      link: '/',
      items: [],
    }
    const [result] = injectLandingPages(
      [entry],
      [],
      [
        {
          title: 'API',
          path: '/',
          description: 'REST API',
          openapi: { spec: 'openapi.json', path: '/reference' },
        },
      ]
    )

    expect(result.page).toMatchObject({ outputPath: 'index.md' })
  })
})
