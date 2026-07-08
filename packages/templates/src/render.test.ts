import { describe, it, expect } from 'vitest'

import { findMarkers, render, toSlug } from './render'
import type { Template } from './types'

const MOCK_TEMPLATE: Template = {
  type: 'test',
  label: 'Test',
  hint: 'test template',
  body: '# {{title}}\n\nWelcome to {{title}}.',
}

describe('render()', () => {
  it('should replace all {{title}} placeholders', () => {
    const result = render(MOCK_TEMPLATE, { title: 'Authentication' })
    expect(result).toBe('# Authentication\n\nWelcome to Authentication.')
  })

  it('should handle custom variables', () => {
    const template: Template = {
      type: 'test',
      label: 'Test',
      hint: 'test',
      body: '# {{title}}\n\nAuthor: {{author}}',
    }
    const result = render(template, { title: 'Auth', author: 'Alice' })
    expect(result).toBe('# Auth\n\nAuthor: Alice')
  })

  it('should leave unreferenced placeholders untouched', () => {
    const template: Template = {
      type: 'test',
      label: 'Test',
      hint: 'test',
      body: '# {{title}}\n\n{{unknown}}',
    }
    const result = render(template, { title: 'Auth' })
    expect(result).toContain('{{unknown}}')
  })

  it('should handle empty title', () => {
    const result = render(MOCK_TEMPLATE, { title: '' })
    expect(result).toBe('# \n\nWelcome to .')
  })

  it('should handle titles with special characters', () => {
    const result = render(MOCK_TEMPLATE, { title: 'OAuth 2.0 & OIDC' })
    expect(result).toContain('# OAuth 2.0 & OIDC')
  })

  it('should substitute markers regardless of interior whitespace', () => {
    const template: Template = {
      type: 'test',
      label: 'Test',
      hint: 'test',
      body: '{{title}} — {{ title }} — {{  title  }}',
    }
    const result = render(template, { title: 'Auth' })
    expect(result).toBe('Auth — Auth — Auth')
  })

  it('should leave an unfilled declared marker untouched', () => {
    const template: Template = {
      type: 'test',
      label: 'Test',
      hint: 'test',
      body: '# {{title}}\n\n{{ decision }}',
    }
    const result = render(template, { title: 'Auth' })
    expect(result).toBe('# Auth\n\n{{ decision }}')
  })
})

describe('findMarkers()', () => {
  it('should list distinct markers normalized to {{ key }}', () => {
    const result = findMarkers('{{ decision }} and {{decision}} and {{ context }}')
    expect(result).toStrictEqual(['{{ decision }}', '{{ context }}'])
  })

  it('should normalize an empty marker to {{ }}', () => {
    expect(findMarkers('fill {{ }} here')).toStrictEqual(['{{ }}'])
  })

  it('should return an empty array when no markers remain', () => {
    expect(findMarkers('nothing to fill here')).toStrictEqual([])
  })
})

describe('toSlug()', () => {
  it('should convert a title to kebab-case', () => {
    expect(toSlug('Deploy to Vercel')).toBe('deploy-to-vercel')
  })

  it('should handle single word', () => {
    expect(toSlug('Authentication')).toBe('authentication')
  })

  it('should handle mixed case', () => {
    expect(toSlug('OAuth Setup')).toBe('o-auth-setup')
  })

  it('should handle already kebab-case input', () => {
    expect(toSlug('deploy-to-vercel')).toBe('deploy-to-vercel')
  })
})
