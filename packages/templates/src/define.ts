import type { Template } from './types.ts'

/**
 * Define a new documentation template.
 *
 * @example
 * ```ts
 * import { defineTemplate, createRegistry } from '@ciderpress/templates'
 *
 * const adr = defineTemplate({
 *   type: 'adr',
 *   label: 'ADR',
 *   hint: 'Architecture decision record',
 *   body: '# {{title}}\n\n## Context\n\n## Decision\n\n## Consequences\n',
 * })
 *
 * const registry = createRegistry().add(adr)
 * ```
 *
 * @param options - Template definition including type, label, hint, and body
 * @returns A new template object
 */
export function defineTemplate(options: Template): Template {
  return { ...options }
}
