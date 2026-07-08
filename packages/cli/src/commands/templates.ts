import { loadConfig } from '@ciderpress/config/loader'
import { command } from '@kidd-cli/core'

import { createPaths } from '../lib/paths.ts'
import { configTemplates, resolveTemplates } from '../lib/templates.ts'
import type { ResolvedTemplate, ResolvedTemplates, TemplateIssue } from '../lib/templates.ts'

/**
 * List available document templates — built-ins plus any declared via the
 * `templates` config field, with overrides flagged.
 */
const list = command({
  name: 'list',
  description: 'List available document templates',
  handler: async (ctx) => {
    ctx.log.intro('ciderpress templates')

    const { resolved, issues } = await resolveFromCwd()
    ctx.log.message(formatTemplateList(resolved))

    if (issues.length > 0) {
      ctx.log.warn(`${issues.length} template(s) could not be loaded:`)
      ctx.log.message(formatIssues(issues))
    }

    ctx.log.outro('Done')
  },
})

/**
 * Validate every resolved template and report frontmatter, syntax, and
 * collision issues. Exits non-zero when any template is invalid.
 */
const check = command({
  name: 'check',
  description: 'Validate document templates',
  handler: async (ctx) => {
    ctx.log.intro('ciderpress templates check')

    const { resolved, issues } = await resolveFromCwd()

    if (issues.length === 0) {
      ctx.log.success(`All templates valid (${resolved.length} total)`)
      ctx.log.outro('Done')
      return
    }

    ctx.log.error(`${issues.length} template issue(s):`)
    ctx.log.message(formatIssues(issues))
    ctx.log.outro('Templates check failed')
    process.exit(1)
  },
})

/**
 * The `templates` command group: `list` and `check`.
 */
export default command({
  name: 'templates',
  description: 'List and validate document templates',
  commands: { list, check },
})

/**
 * Resolve templates from the current working directory, tolerating a missing
 * or invalid config by falling back to built-ins only.
 *
 * @private
 * @returns The resolved templates for the current project
 */
async function resolveFromCwd(): Promise<ResolvedTemplates> {
  const paths = createPaths(process.cwd())
  const [, config] = await loadConfig(paths.repoRoot)
  return resolveTemplates({ templates: configTemplates(config), paths })
}

/**
 * Format the template list into grouped, aligned sections.
 *
 * @private
 * @param resolved - The resolved templates to display
 * @returns A printable multi-line string
 */
function formatTemplateList(resolved: readonly ResolvedTemplate[]): string {
  const builtIns = resolved.filter((entry) => entry.source === 'built-in')
  const custom = resolved.filter((entry) => entry.source !== 'built-in')
  const width = Math.max(0, ...resolved.map((entry) => rowLabel(entry).length))

  const sections = [
    formatSection('Built-in', builtIns, width),
    formatSection('Custom', custom, width),
  ].filter((section) => section.length > 0)

  return [...sections, ...overrideFootnote(resolved)].join('\n')
}

/**
 * Build the override-marker footnote when any template overrides a built-in.
 *
 * @private
 * @param resolved - The resolved templates
 * @returns Footnote lines, or an empty array
 */
function overrideFootnote(resolved: readonly ResolvedTemplate[]): readonly string[] {
  if (resolved.some((entry) => entry.overridesBuiltIn)) {
    return ['', '  * overrides a built-in template']
  }
  return []
}

/**
 * Format a single named section of the template list.
 *
 * @private
 * @param title - The section heading
 * @param items - Templates in this section
 * @param width - Column width for the label column
 * @returns A printable section string, or '' when empty
 */
function formatSection(title: string, items: readonly ResolvedTemplate[], width: number): string {
  if (items.length === 0) {
    return ''
  }
  const lines = items.map((entry) => `  ${rowLabel(entry).padEnd(width)}  ${entry.template.hint}`)
  return [title, ...lines].join('\n')
}

/**
 * Build the label cell for a template row, marking overrides.
 *
 * @private
 * @param entry - The resolved template
 * @returns The label cell text
 */
function rowLabel(entry: ResolvedTemplate): string {
  if (entry.overridesBuiltIn) {
    return `${entry.template.type} *`
  }
  return entry.template.type
}

/**
 * Format template loading issues as an indented list.
 *
 * @private
 * @param issues - The issues to format
 * @returns A printable multi-line string
 */
function formatIssues(issues: readonly TemplateIssue[]): string {
  return issues.map((issue) => `  ✖ ${issue.file} — ${issue.message}`).join('\n')
}
