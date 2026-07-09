import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { ResolvedEntry } from '../types'

const { readFile } = vi.hoisted(() => ({ readFile: vi.fn<(p: string) => Promise<string>>() }))

vi.mock(import('node:fs/promises'), () => ({ default: { readFile } }))
vi.mock(import('node:fs'), () => ({ existsSync: vi.fn(() => false) }))

const { extractFileDescription, findEntrySlugChild, resolveGroupDescription } =
  await import('./description')

describe('extractFileDescription()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should prefer the frontmatter description', async () => {
    readFile.mockResolvedValue('---\ndescription: From frontmatter\n---\n# Title\n\nProse here.\n')
    const result = await extractFileDescription('/docs/overview.md', 'firstParagraph')
    expect(result).toBe('From frontmatter')
  })

  it('should fall back to the first paragraph after the heading', async () => {
    readFile.mockResolvedValue('# Title\n\nThe intro paragraph.\n\nSecond paragraph.\n')
    const result = await extractFileDescription('/docs/overview.md', 'firstParagraph')
    expect(result).toBe('The intro paragraph.')
  })

  it('should return undefined for the none fallback when no frontmatter description', async () => {
    readFile.mockResolvedValue('# Title\n\nThe intro paragraph.\n')
    const result = await extractFileDescription('/docs/overview.md', 'none')
    expect(result).toBeUndefined()
  })

  it('should still use the frontmatter description under the none fallback', async () => {
    readFile.mockResolvedValue('---\ndescription: Explicit\n---\n# Title\n\nProse.\n')
    const result = await extractFileDescription('/docs/overview.md', 'none')
    expect(result).toBe('Explicit')
  })

  it('should return undefined when the file cannot be read', async () => {
    readFile.mockRejectedValue(new Error('ENOENT'))
    const result = await extractFileDescription('/missing.md', 'firstParagraph')
    expect(result).toBeUndefined()
  })
})

describe('findEntrySlugChild()', () => {
  it('should select the entry-slug child with a source file', () => {
    const overview: ResolvedEntry = {
      title: 'Overview',
      link: '/group/overview',
      page: { source: '/abs/group/overview.md', outputPath: 'group/overview.md', frontmatter: {} },
    }
    const other: ResolvedEntry = {
      title: 'Details',
      link: '/group/details',
      page: { source: '/abs/group/details.md', outputPath: 'group/details.md', frontmatter: {} },
    }
    expect(findEntrySlugChild([other, overview])).toBe(overview)
  })

  it('should prefer higher-priority entry slugs (introduction over readme)', () => {
    const readme: ResolvedEntry = {
      title: 'Readme',
      link: '/group/readme',
      page: { source: '/abs/group/readme.md', outputPath: 'group/readme.md', frontmatter: {} },
    }
    const intro: ResolvedEntry = {
      title: 'Introduction',
      link: '/group/introduction',
      page: {
        source: '/abs/group/introduction.md',
        outputPath: 'group/introduction.md',
        frontmatter: {},
      },
    }
    expect(findEntrySlugChild([readme, intro])).toBe(intro)
  })

  it('should return undefined when no child is an entry slug', () => {
    const leaf: ResolvedEntry = {
      title: 'Leaf',
      link: '/group/leaf',
      page: { source: '/abs/group/leaf.md', outputPath: 'group/leaf.md', frontmatter: {} },
    }
    expect(findEntrySlugChild([leaf])).toBeUndefined()
  })

  it('should ignore entry-slug children without a source file', () => {
    const virtualOverview: ResolvedEntry = {
      title: 'Overview',
      link: '/group/overview',
      page: { outputPath: 'group/overview.mdx', frontmatter: {} },
    }
    expect(findEntrySlugChild([virtualOverview])).toBeUndefined()
  })
})

describe('resolveGroupDescription()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return the explicit config description without reading files', async () => {
    const result = await resolveGroupDescription({
      explicit: 'Config wins',
      sourcePath: '/abs/overview.md',
      children: [],
      fallback: 'firstParagraph',
    })
    expect(result).toBe('Config wins')
    expect(readFile).not.toHaveBeenCalled()
  })

  it('should read the group overview page when there is no explicit description', async () => {
    readFile.mockResolvedValue('---\ndescription: From overview\n---\n# Group\n')
    const result = await resolveGroupDescription({
      sourcePath: '/abs/group/overview.md',
      children: [],
      fallback: 'firstParagraph',
    })
    expect(result).toBe('From overview')
  })

  it('should fall back to an entry-slug child when the group has no source page', async () => {
    readFile.mockResolvedValue('---\ndescription: From child overview\n---\n# Group\n')
    const overview: ResolvedEntry = {
      title: 'Overview',
      link: '/group/overview',
      page: { source: '/abs/group/overview.md', outputPath: 'group/overview.md', frontmatter: {} },
    }
    const result = await resolveGroupDescription({
      children: [overview],
      fallback: 'firstParagraph',
    })
    expect(result).toBe('From child overview')
  })

  it('should return undefined when nothing yields a description', async () => {
    const result = await resolveGroupDescription({
      children: [],
      fallback: 'firstParagraph',
    })
    expect(result).toBeUndefined()
  })
})
