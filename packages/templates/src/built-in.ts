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
    body: readTemplate('tutorial.liquid'),
  },
  guide: {
    type: 'guide',
    label: 'Guide',
    hint: 'Step-by-step task instructions',
    body: readTemplate('guide.liquid'),
  },
  quickstart: {
    type: 'quickstart',
    label: 'Quickstart',
    hint: 'Fast-track to working result',
    body: readTemplate('quickstart.liquid'),
  },
  explanation: {
    type: 'explanation',
    label: 'Explanation',
    hint: 'Conceptual background',
    body: readTemplate('explanation.liquid'),
  },
  reference: {
    type: 'reference',
    label: 'Reference',
    hint: 'Technical descriptions',
    body: readTemplate('reference.liquid'),
  },
  standard: {
    type: 'standard',
    label: 'Standard',
    hint: 'Rules and conventions',
    body: readTemplate('standard.liquid'),
  },
  troubleshooting: {
    type: 'troubleshooting',
    label: 'Troubleshooting',
    hint: 'Common problems and fixes',
    body: readTemplate('troubleshooting.liquid'),
  },
  runbook: {
    type: 'runbook',
    label: 'Runbook',
    hint: 'Operational procedures',
    body: readTemplate('runbook.liquid'),
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
 * Reads a `.liquid` template file from the `templates/` directory.
 *
 * @private
 * @param filename - The filename of the template to read (e.g. `'guide.liquid'`)
 * @returns The raw template string
 */
function readTemplate(filename: string): string {
  // oxlint-disable-next-line security/detect-non-literal-fs-filename -- safe: reads from known templates directory
  return readFileSync(join(import.meta.dirname, '..', 'templates', filename), 'utf8')
}
