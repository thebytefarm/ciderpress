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

  it('should preserve pages without candidate destinations', () => {
    const content = '# Guide\r\n\r\nPlain text, `code`, and [a label].\r\n'
    expect(
      rewriteLinks({
        content,
        sourcePath: 'docs/index.md',
        outputPath: 'guides/index.md',
        sourceMap,
      })
    ).toBe(content)
  })

  it('should preserve content when there are no mapped pages', () => {
    const content = '[intro](./intro.md "Intro")'
    expect(
      rewriteLinks({
        content,
        sourcePath: 'docs/index.md',
        outputPath: 'guides/index.md',
        sourceMap: new Map(),
      })
    ).toBe(content)
  })

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

  it.each([
    'Text `\n\n[intro](./intro.md)\n\n`',
    '`first\n\n[intro](./intro.md)\n\n`last',
    'Text `\n# Heading\n[intro](./intro.md)\n`',
    'Text `\n```md\n[guide](./guide.md)\n```\n[intro](./intro.md)\n`',
  ])('should rewrite real links across Markdown block boundaries in %s', (content) => {
    const result = rewriteLinks({
      content,
      sourcePath: 'docs/index.md',
      outputPath: 'guides/index.md',
      sourceMap,
    })

    expect(result).toBe(
      content.replace('[intro](./intro.md)', '[intro](../getting-started/intro.md)')
    )
  })

  it.each([
    '`code\n[intro](./intro.md)\ncode`',
    '> ```md\n> [guide](./guide.md)\n> ````',
    '- ```md\n  [guide](./guide.md)\n  ````',
    '~~~md\n[guide](./guide.md)\n~~~',
    '    [guide](./guide.md)',
    '```md\n[guide](./guide.md)',
    '<!--CIDERPRESS_CODE_BLOCK_0-->\n\n`[guide](./guide.md)`',
  ])('should preserve parsed code and surrounding content in %s', (content) => {
    const result = rewriteLinks({
      content,
      sourcePath: 'docs/index.md',
      outputPath: 'guides/index.md',
      sourceMap,
    })

    expect(result).toBe(content)
  })

  it.each([
    {
      content: '<Tab>\n[`[guide](./guide.md)`](./intro.md)\n</Tab>',
      expected: '<Tab>\n[`[guide](./guide.md)`](../getting-started/intro.md)\n</Tab>',
    },
    {
      content: '<Tab>\n```md\n[guide](./guide.md)\n```\n[intro](./intro.md)\n</Tab>',
      expected:
        '<Tab>\n```md\n[guide](./guide.md)\n```\n[intro](../getting-started/intro.md)\n</Tab>',
    },
    {
      content: '<Tabs>\n<Tab>\n[`[guide](./guide.md)`](./intro.md "Intro")\n</Tab>\n</Tabs>',
      expected:
        '<Tabs>\n<Tab>\n[`[guide](./guide.md)`](../getting-started/intro.md "Intro")\n</Tab>\n</Tabs>',
    },
  ])('should preserve code inside MDX component children in $content', ({ content, expected }) => {
    const result = rewriteLinks({
      content,
      sourcePath: 'docs/index.mdx',
      outputPath: 'guides/index.mdx',
      sourceMap,
    })

    expect(result).toBe(expected)
  })

  it.each(['md', 'mdx'])('should respect GFM table cell boundaries in %s files', (extension) => {
    const result = rewriteLinks({
      content: '| A | B | C |\n| --- | --- | --- |\n| ` | [intro](./intro.md) | ` |',
      sourcePath: `docs/index.${extension}`,
      outputPath: `guides/index.${extension}`,
      sourceMap,
    })

    expect(result).toBe(
      '| A | B | C |\n| --- | --- | --- |\n| ` | [intro](../getting-started/intro.md) | ` |'
    )
  })

  it.each(['md', 'mdx'])(
    'should preserve code labels inside GFM tables in %s files',
    (extension) => {
      const result = rewriteLinks({
        content: '| Link |\n| --- |\n| [`[guide](./guide.md)`](./intro.md) |',
        sourcePath: `docs/index.${extension}`,
        outputPath: `guides/index.${extension}`,
        sourceMap,
      })

      expect(result).toBe(
        '| Link |\n| --- |\n| [`[guide](./guide.md)`](../getting-started/intro.md) |'
      )
    }
  )

  it.each([
    { prefix: '', newline: '\n', metadata: 'title: <Product>' },
    { prefix: '', newline: '\n', metadata: 'description: "Use { for interpolation"' },
    { prefix: '\uFEFF', newline: '\r\n', metadata: 'title: "Use <Button>"' },
    { prefix: '', newline: '\n', metadata: 'description: "[intro](./intro.md)"' },
  ])(
    'should exclude YAML frontmatter from MDX parsing in $metadata',
    ({ prefix, newline, metadata }) => {
      const frontmatter = `${prefix}---${newline}${metadata}${newline}---${newline}`
      const result = rewriteLinks({
        content: `${frontmatter}<Tab>${newline}[\`[guide](./guide.md)\`](./intro.md)${newline}</Tab>`,
        sourcePath: 'docs/index.mdx',
        outputPath: 'guides/index.mdx',
        sourceMap,
      })

      expect(result).toBe(
        `${frontmatter.replace('[intro](./intro.md)', '[intro](../getting-started/intro.md)')}<Tab>${newline}[\`[guide](./guide.md)\`](../getting-started/intro.md)${newline}</Tab>`
      )
    }
  )

  it.each(['md', 'mdx'])(
    'should preserve fenced examples in YAML metadata in %s files',
    (extension) => {
      const content = [
        '---',
        'title: "Use <Button> or {"',
        'description: |',
        '  [intro](./intro.md)',
        '  ```md',
        '  [guide](./guide.md)',
        '  ```',
        '---',
        '',
        '[intro](./intro.md)',
      ].join('\n')
      const result = rewriteLinks({
        content,
        sourcePath: `docs/index.${extension}`,
        outputPath: `guides/index.${extension}`,
        sourceMap,
      })

      expect(result).toBe(
        content.replaceAll('[intro](./intro.md)', '[intro](../getting-started/intro.md)')
      )
    }
  )

  it.each(
    ['md', 'mdx'].flatMap((extension) =>
      ['\n', '\r\n'].flatMap((newline) =>
        ['', '\uFEFF'].map((prefix) => ({ extension, newline, prefix }))
      )
    )
  )(
    'should isolate YAML scalar code ranges with $extension $newline $prefix',
    ({ extension, newline, prefix }) => {
      const content =
        prefix +
        [
          '---',
          'title: "The ` character"',
          'description: "[intro](./intro.md)"',
          'footer: "Another `"',
          'links:',
          '  - label: "[`Guide`](./intro.md)"',
          '---',
          '',
          '[intro](./intro.md)',
        ].join(newline)
      const result = rewriteLinks({
        content,
        sourcePath: `docs/index.${extension}`,
        outputPath: `guides/index.${extension}`,
        sourceMap,
      })

      expect(result).toBe(content.replaceAll('(./intro.md)', '(../getting-started/intro.md)'))
    }
  )

  it('should retain CommonMark syntax for ordinary Markdown files', () => {
    const result = rewriteLinks({
      content: '<https://example.com> {literal}\n\n[intro](./intro.md)',
      sourcePath: 'docs/index.md',
      outputPath: 'guides/index.md',
      sourceMap,
    })

    expect(result).toBe('<https://example.com> {literal}\n\n[intro](../getting-started/intro.md)')
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
