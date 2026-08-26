import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { Template, TemplateType } from './types.ts'

/**
 * All built-in documentation templates keyed by type.
 * Loaded synchronously at module initialisation time.
 */
const BUILT_IN_TEMPLATE_RECORD: Record<TemplateType, Template> = {
  tutorial: {
    type: 'tutorial',
    label: 'Tutorial',
    hint: 'Guided learning experience',
    body: readTemplate('tutorial.md'),
    extension: '.md',
  },
  guide: {
    type: 'guide',
    label: 'Guide',
    hint: 'Step-by-step task instructions',
    body: readTemplate('guide.md'),
    extension: '.md',
  },
  quickstart: {
    type: 'quickstart',
    label: 'Quickstart',
    hint: 'Fast-track to working result',
    body: readTemplate('quickstart.md'),
    extension: '.md',
  },
  explanation: {
    type: 'explanation',
    label: 'Explanation',
    hint: 'Conceptual background',
    body: readTemplate('explanation.md'),
    extension: '.md',
  },
  reference: {
    type: 'reference',
    label: 'Reference',
    hint: 'Technical descriptions',
    body: readTemplate('reference.md'),
    extension: '.md',
  },
  standard: {
    type: 'standard',
    label: 'Standard',
    hint: 'Rules and conventions',
    body: readTemplate('standard.md'),
    extension: '.md',
  },
  troubleshooting: {
    type: 'troubleshooting',
    label: 'Troubleshooting',
    hint: 'Common problems and fixes',
    body: readTemplate('troubleshooting.md'),
    extension: '.md',
  },
  runbook: {
    type: 'runbook',
    label: 'Runbook',
    hint: 'Operational procedures',
    body: readTemplate('runbook.md'),
    extension: '.md',
  },
}

/**
 * Get all built-in documentation templates keyed by type.
 *
 * @returns Record of all built-in templates keyed by type
 */
export function getBuiltInTemplates(): Record<TemplateType, Template> {
  return BUILT_IN_TEMPLATE_RECORD
}

/**
 * Reads a markdown template file from the `templates/` directory.
 *
 * @private
 * @param filename - The filename of the template to read (e.g. `'guide.md'`)
 * @returns The raw template string
 */
function readTemplate(filename: string): string {
  // oxlint-disable-next-line ciderpress/no-dynamic-filesystem-path -- safe: reads from known templates directory
  return readFileSync(join(import.meta.dirname, '..', 'templates', filename), 'utf8')
}
