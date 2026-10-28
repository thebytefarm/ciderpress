import { describe, it, expect } from 'vitest'

import { buildSourceMap, rewriteLinks } from './rewrite-links.ts'

describe('buildSourceMap()', () => {
  it('should create map from pages with source paths', () => {
    const result = buildSourceMap({
      pages: [
        { source: '/repo/docs/guide.md', outputPath: 'guides/guide.md', frontmatter: {} },
        { source: '/repo/docs/intro.md', outputPath: 'getting-started/intro.md', frontmatter: {} },
      ],
      repoRoot: '/repo',
    })

    expect(result.get('docs/guide.md')).toBe('guides/guide.md')
    expect(result.get('docs/intro.md')).toBe('getting-started/intro.md')
  })

  it('should skip pages without source', () => {
    const result = buildSourceMap({
      pages: [
        { outputPath: 'guides/guide.md', frontmatter: {} },
        { source: undefined, outputPath: 'intro.md', frontmatter: {} },
      ],
      repoRoot: '/repo',
    })

    expect(result.size).toBe(0)
  })

  it('should compute relative source paths from repoRoot', () => {
    const result = buildSourceMap({
      pages: [{ source: '/repo/packages/docs/api.md', outputPath: 'api.md', frontmatter: {} }],
      repoRoot: '/repo',
    })

    expect(result.get('packages/docs/api.md')).toBe('api.md')
  })
})

describe('rewriteLinks()', () => {
  const sourceMap = new Map([
    ['docs/guide.md', 'guides/guide.md'],
    ['docs/intro.md', 'getting-started/intro.md'],
  ])

  it('should rewrite relative .md link to correct output path', () => {
    const result = rewriteLinks({
      content: 'See [guide](./guide.md) for details.',
      sourcePath: 'docs/index.md',
      outputPath: 'guides/index.md',
      sourceMap,
    })

    expect(result).toBe('See [guide](guide.md) for details.')
  })

  it('should preserve anchor fragments', () => {
    const result = rewriteLinks({
      content: 'See [guide](./guide.md#installation) for details.',
      sourcePath: 'docs/index.md',
      outputPath: 'guides/index.md',
      sourceMap,
    })

    expect(result).toBe('See [guide](guide.md#installation) for details.')
  })

  it.each([
    {
      content: '[./guide.md](./guide.md)',
      expected: '[./guide.md](guide.md)',
    },
    {
      content: '| Guide | [`./guide.md`](./guide.md) |',
      expected: '| Guide | [`./guide.md`](guide.md) |',
    },
    {
      content: '[./guide.md#installation](./guide.md#installation)',
      expected: '[./guide.md#installation](guide.md#installation)',
    },
    {
      content: '[./guide.md](./guide.md "Read ./guide.md")',
      expected: '[./guide.md](guide.md "Read ./guide.md")',
    },
    {
      content: '[./intro.md](./intro.md   "Read ./intro.md")',
      expected: '[./intro.md](../getting-started/intro.md   "Read ./intro.md")',
    },
    {
      content: '[`[./intro.md](./intro.md)`](./intro.md)',
      expected: '[`[./intro.md](./intro.md)`](../getting-started/intro.md)',
    },
    {
      content: '[``[./intro.md](./intro.md) with `code` ``](./intro.md "Intro")',
      expected: '[``[./intro.md](./intro.md) with `code` ``](../getting-started/intro.md "Intro")',
    },
    {
      content: '[````[./intro.md](./intro.md) with ```code``` ````](./intro.md)',
      expected: '[````[./intro.md](./intro.md) with ```code``` ````](../getting-started/intro.md)',
    },
  ])('should rewrite only the destination in $content', ({ content, expected }) => {
    const result = rewriteLinks({
      content,
      sourcePath: 'docs/index.md',
      outputPath: 'guides/index.md',
      sourceMap,
    })

    expect(result).toBe(expected)
  })

  it('should leave external https links untouched', () => {
    const content = 'Visit [example](https://example.com) for more.'
    const result = rewriteLinks({
      content,
      sourcePath: 'docs/index.md',
      outputPath: 'guides/index.md',
      sourceMap,
    })

    expect(result).toBe(content)
  })

  it('should leave external http links untouched', () => {
    const content = 'Visit [example](http://example.com) for more.'
    const result = rewriteLinks({
      content,
      sourcePath: 'docs/index.md',
      outputPath: 'guides/index.md',
      sourceMap,
    })

    expect(result).toBe(content)
  })

  it('should leave absolute links untouched', () => {
    const content = 'See [guide](/some/path) for details.'
    const result = rewriteLinks({
      content,
      sourcePath: 'docs/index.md',
      outputPath: 'guides/index.md',
      sourceMap,
    })

    expect(result).toBe(content)
  })

  it('should leave anchor-only links untouched', () => {
    const content = 'Jump to [section](#heading) below.'
    const result = rewriteLinks({
      content,
      sourcePath: 'docs/index.md',
      outputPath: 'guides/index.md',
      sourceMap,
    })

    expect(result).toBe(content)
  })

  it('should not rewrite links inside fenced code blocks', () => {
    const content = '```\nSee [guide](./guide.md) for details.\n```'
    const result = rewriteLinks({
      content,
      sourcePath: 'docs/index.md',
      outputPath: 'guides/index.md',
      sourceMap,
    })

    expect(result).toBe(content)
  })

  it.each([
    '`[guide](./guide.md)`',
    '``[guide](./guide.md) with `code` ``',
    '``[guide](./guide.md) ` and `[intro](./intro.md)``',
    '````md\n```md\n[guide](./guide.md)\n```\n````',
    '```md\n[guide](./guide.md)\n````',
  ])('should not rewrite links inside inline code %s', (content) => {
    const result = rewriteLinks({
      content,
      sourcePath: 'docs/index.md',
      outputPath: 'guides/index.md',
      sourceMap,
    })

    expect(result).toBe(content)
  })

  it('should rewrite links between escaped backticks without changing code spans', () => {
    const result = rewriteLinks({
      content: '\\`[guide](./guide.md)\\` and `[intro](./intro.md)`',
      sourcePath: 'docs/index.md',
      outputPath: 'guides/index.md',
      sourceMap,
    })

    expect(result).toBe('\\`[guide](guide.md)\\` and `[intro](./intro.md)`')
  })

  it('should leave image links untouched', () => {
    const content = '![alt text](./guide.md)'
    const result = rewriteLinks({
      content,
      sourcePath: 'docs/index.md',
      outputPath: 'guides/index.md',
      sourceMap,
    })

    expect(result).toBe(content)
  })

  it('should leave non-markdown links untouched', () => {
    const content = 'Download [file](./file.txt) here.'
    const result = rewriteLinks({
      content,
      sourcePath: 'docs/index.md',
      outputPath: 'guides/index.md',
      sourceMap,
    })

    expect(result).toBe(content)
  })

  it('should return content unchanged when no links match sourceMap', () => {
    const content = 'See [unknown](./unknown.md) for details.'
    const result = rewriteLinks({
      content,
      sourcePath: 'docs/index.md',
      outputPath: 'guides/index.md',
      sourceMap,
    })

    expect(result).toBe(content)
  })

  it('should rewrite .mdx links', () => {
    const mdxSourceMap = new Map([['docs/component.mdx', 'components/component.mdx']])
    const result = rewriteLinks({
      content: 'See [component](./component.mdx) for details.',
      sourcePath: 'docs/index.md',
      outputPath: 'components/index.md',
      sourceMap: mdxSourceMap,
    })

    expect(result).toBe('See [component](component.mdx) for details.')
  })

  it('should rewrite multiple links in the same content', () => {
    const result = rewriteLinks({
      content: 'See [guide](./guide.md) and [intro](./intro.md).',
      sourcePath: 'docs/index.md',
      outputPath: 'guides/index.md',
      sourceMap,
    })

    expect(result).toBe('See [guide](guide.md) and [intro](../getting-started/intro.md).')
  })

  it('should rewrite link with title attribute', () => {
    const result = rewriteLinks({
      content: 'See [guide](./guide.md "Guide Title") for details.',
      sourcePath: 'docs/index.md',
      outputPath: 'guides/index.md',
      sourceMap,
    })

    expect(result).toBe('See [guide](guide.md "Guide Title") for details.')
  })
})
