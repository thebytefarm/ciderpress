import { describe, it, expect } from 'vitest'

import { splitFrontmatter } from './matter'

describe('splitFrontmatter()', () => {
  it('should split frontmatter data from the body', () => {
    const [error, file] = splitFrontmatter('---\nlabel: Guide\nhint: Steps\n---\n# {{title}}\n')
    expect(error).toBeNull()
    expect(file).toStrictEqual({
      data: { label: 'Guide', hint: 'Steps' },
      content: '# {{title}}\n',
      matter: 'label: Guide\nhint: Steps',
      excerpt: '',
    })
  })

  it('should error when there is no frontmatter block', () => {
    const [error] = splitFrontmatter('# Just a heading\n')
    expect(error).toMatchObject({ _tag: 'MatterFileError', type: 'missing_frontmatter' })
  })

  it('should error on malformed YAML', () => {
    const [error] = splitFrontmatter('---\nlabel: "unterminated\n---\nbody\n')
    expect(error).toMatchObject({ type: 'invalid_yaml' })
  })

  it('should handle CRLF line endings', () => {
    const [error, file] = splitFrontmatter('---\r\nlabel: Guide\r\n---\r\n# Body\r\n')
    expect(error).toBeNull()
    expect(file).toMatchObject({ data: { label: 'Guide' }, content: '# Body\r\n' })
  })

  it('should yield an empty body when there is no content after the fence', () => {
    const [error, file] = splitFrontmatter('---\nlabel: Guide\n---\n')
    expect(error).toBeNull()
    expect(file).toMatchObject({ content: '' })
  })

  it('should handle a closing fence with no trailing newline', () => {
    const [error, file] = splitFrontmatter('---\nlabel: Guide\n---')
    expect(error).toBeNull()
    expect(file).toMatchObject({ content: '' })
  })

  it('should preserve multi-line bodies verbatim', () => {
    const [error, file] = splitFrontmatter('---\nlabel: Guide\n---\nline 1\n\nline 2\n')
    expect(error).toBeNull()
    expect(file).toMatchObject({ content: 'line 1\n\nline 2\n' })
  })
})
