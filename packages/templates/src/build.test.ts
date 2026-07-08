import { describe, it, expect } from 'vitest'

import { buildTemplate } from './build'

const validInput = {
  type: 'adr',
  data: { label: 'ADR', hint: 'Architecture decision record' },
  content: '# {{title}}\n\n## Context\n',
  extension: '.md',
} as const

describe('buildTemplate()', () => {
  it('should build a valid template', () => {
    const [error, template] = buildTemplate(validInput)
    expect(error).toBeNull()
    expect(template).toStrictEqual({
      type: 'adr',
      label: 'ADR',
      hint: 'Architecture decision record',
      body: '# {{title}}\n\n## Context\n',
      extension: '.md',
    })
  })

  it('should preserve the .mdx extension', () => {
    const [error, template] = buildTemplate({ ...validInput, extension: '.mdx' })
    expect(error).toBeNull()
    expect(template).toMatchObject({ extension: '.mdx' })
  })

  it('should allow repeated {{title}} placeholders', () => {
    const [error] = buildTemplate({ ...validInput, content: '# {{title}}\n\n{{title}} again\n' })
    expect(error).toBeNull()
  })

  it('should reject a non-slug type', () => {
    const [error] = buildTemplate({ ...validInput, type: 'Not A Slug' })
    expect(error).toMatchObject({ _tag: 'TemplateError', type: 'invalid_type' })
  })

  it('should reject unknown frontmatter fields', () => {
    const [error] = buildTemplate({
      ...validInput,
      data: { label: 'ADR', hint: 'x', author: 'zac' },
    })
    expect(error).toMatchObject({ type: 'unknown_field' })
  })

  it('should reject a missing label', () => {
    const [error] = buildTemplate({ ...validInput, data: { hint: 'x' } })
    expect(error).toMatchObject({ type: 'missing_field' })
  })

  it('should reject an empty-string hint', () => {
    const [error] = buildTemplate({ ...validInput, data: { label: 'ADR', hint: '   ' } })
    expect(error).toMatchObject({ type: 'missing_field' })
  })

  it('should reject an empty body', () => {
    const [error] = buildTemplate({ ...validInput, content: '   \n' })
    expect(error).toMatchObject({ type: 'empty_body' })
  })

  it('should reject a placeholder other than title', () => {
    const [error] = buildTemplate({ ...validInput, content: '# {{title}}\n\n{{author}}\n' })
    expect(error).toMatchObject({ type: 'unknown_placeholder' })
  })
})
