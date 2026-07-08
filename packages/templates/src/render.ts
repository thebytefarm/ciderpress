import { kebabCase } from 'massaman/string'

import type { Template, TemplateVariables } from './types.ts'

// Matches a `{{ key }}` marker, tolerating any interior whitespace and
// capturing the trimmed key. The empty-marker form `{{ }}` matches with an
// empty capture. Global so a single pass covers every marker in the body.
const MARKER_PATTERN = /\{\{\s*([^}]*?)\s*\}\}/g

/**
 * Render a template by replacing every `{{ key }}` marker whose key appears in
 * `variables` with its value. Interior whitespace is tolerated, so `{{title}}`
 * and `{{ title }}` are equivalent. Markers whose key is absent from
 * `variables` are left untouched — the raw marker passes through for a human or
 * agent to fill in later.
 *
 * @example
 * ```ts
 * const output = render(template, { title: 'Authentication' })
 * ```
 *
 * @param template - The template whose body contains `{{ key }}` markers
 * @param variables - Key/value map used to replace each matching marker
 * @returns The rendered string with matching markers substituted
 */
export function render(template: Template, variables: TemplateVariables): string {
  return template.body.replaceAll(MARKER_PATTERN, (marker, rawKey: string) => {
    const key = rawKey.trim()
    if (Object.hasOwn(variables, key)) {
      return variables[key]
    }
    return marker
  })
}

/**
 * List the distinct `{{ ... }}` markers remaining in a string, in first-seen
 * order. Used to build the post-draft "still to fill" checklist and to detect
 * leftover markers in published docs.
 *
 * @example
 * ```ts
 * findMarkers('{{ decision }} and {{ decision }}') // ['{{ decision }}']
 * ```
 *
 * @param text - The rendered document text to scan
 * @returns The unique marker strings, each normalized to `{{ key }}`
 */
export function findMarkers(text: string): readonly string[] {
  const normalized = [...text.matchAll(MARKER_PATTERN)].map((match) => {
    const key = (match[1] ?? '').trim()
    if (key.length === 0) {
      return '{{ }}'
    }
    return `{{ ${key} }}`
  })
  return [...new Set(normalized)]
}

/**
 * Convert a title string to a kebab-case filename slug.
 *
 * @example
 * ```ts
 * toSlug('Deploy to Vercel') // 'deploy-to-vercel'
 * ```
 *
 * @param title - The human-readable title to convert
 * @returns A kebab-case slug suitable for use as a filename
 */
export function toSlug(title: string): string {
  return kebabCase(title)
}
