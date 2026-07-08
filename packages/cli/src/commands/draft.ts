import fs from 'node:fs/promises'
import path from 'node:path'

import { loadConfig } from '@ciderpress/config/loader'
import { findMarkers, render, toSlug } from '@ciderpress/templates'
import type { TemplateVar, TemplateVariables } from '@ciderpress/templates'
import type { Prompts } from '@kidd-cli/core'
import { command } from '@kidd-cli/core'
import { match, P } from 'massaman/match'
import { z } from 'zod'

import { createPaths } from '../lib/paths.ts'
import { configTemplates, resolveTemplates, toTemplateSelectOptions } from '../lib/templates.ts'
import { buildBuiltInVars, parseVarArgs } from '../lib/vars.ts'

/**
 * Scaffold a new documentation file from a template.
 *
 * With a known `type` arg, scaffolds straight away. With no `type`, walks the
 * user through an interactive picker — a single grouped list of built-in and
 * config templates — then prompts for a title. Templates declared via the
 * `templates` config field are merged with the built-ins (user templates
 * override built-ins by type); when no config or `templates` field is present,
 * only built-ins are offered.
 *
 * Built-in variables (`title`, `slug`, `date`, `filename`) are always
 * substituted. A template's declared `vars` are filled from `--var id=value`
 * arguments, then — on an interactive terminal — prompted for; any left blank
 * (or every declared var when running non-interactively) stay as raw `{{ id }}`
 * markers for a human or agent to fill in later, and are reported as a
 * checklist. Undeclared `{{ }}` markers always pass through untouched.
 */
export default command({
  name: 'draft',
  description: 'Scaffold a new documentation file from a template',
  options: z.object({
    type: z.string().optional(),
    title: z.string().optional(),
    out: z.string().optional().default('.'),
    var: z
      .array(z.string())
      .optional()
      .describe('Fill a template variable, repeatable: --var id=value'),
  }),
  handler: async (ctx) => {
    ctx.log.intro('ciderpress draft')

    const paths = createPaths(process.cwd())
    const [, config] = await loadConfig(paths.repoRoot)
    const { registry, resolved } = await resolveTemplates({
      templates: configTemplates(config),
      paths,
    })

    const typeArg = ctx.args.type
    const hasValidType = match(typeArg)
      .with(P.string.minLength(1), (t) => registry.has(t))
      .otherwise(() => false)

    const selectedType: string = await match(hasValidType)
      .with(true, () => Promise.resolve(typeArg as string))
      .otherwise(() =>
        ctx.prompts.select<string>({
          message: 'Select a doc type',
          options: [...toTemplateSelectOptions(resolved)],
        })
      )

    const template = registry.get(selectedType)
    if (!template) {
      ctx.log.error(`Unknown template type: ${selectedType}`)
      return
    }

    const title = await match(ctx.args.title)
      .with(P.string.minLength(1), (t) => Promise.resolve(t))
      .otherwise(() =>
        ctx.prompts.text({
          message: 'Document title',
          placeholder: 'e.g. Authentication',
          validate: (value): string | undefined => {
            if (!value || value.trim().length === 0) {
              return 'Title is required'
            }
          },
        })
      )

    const slug = toSlug(title)
    if (slug.length === 0) {
      ctx.log.error('Title must include at least one letter or number')
      return
    }

    const extension = template.extension ?? '.md'
    const filename = `${slug}${extension}`

    const { values: argVars, invalid } = parseVarArgs(ctx.args.var)
    if (invalid.length > 0) {
      ctx.log.warn(`Ignoring malformed --var (expected id=value): ${invalid.join(', ')}`)
    }

    const filledVars = await resolveDeclaredVars({
      vars: template.vars,
      provided: argVars,
      prompts: ctx.prompts,
      interactive: process.stdout.isTTY === true,
    })

    const builtIns = buildBuiltInVars({ title, slug, filename, now: new Date() })
    const variables: TemplateVariables = { ...argVars, ...filledVars, ...builtIns, title }

    const content = render(template, variables)
    const outDir = path.resolve(process.cwd(), ctx.args.out)
    const filePath = path.join(outDir, filename)

    const exists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false)

    if (exists) {
      ctx.log.error(`File already exists: ${path.relative(process.cwd(), filePath)}`)
      return
    }

    await fs.mkdir(outDir, { recursive: true })
    await fs.writeFile(filePath, content, 'utf8')

    ctx.log.success(`Created ${path.relative(process.cwd(), filePath)}`)

    const remaining = findMarkers(content)
    if (remaining.length > 0) {
      ctx.log.warn(`${remaining.length} marker(s) still to fill:`)
      ctx.log.message(remaining.map((marker) => `  ${marker}`).join('\n'))
    }

    ctx.log.outro('Done')
  },
})

/**
 * Resolve a template's declared `vars` into a value map, filling each from the
 * provided `--var` args, then — when interactive — prompting for the rest.
 *
 * Values are collected sequentially so prompts appear one at a time. A var
 * already provided via args is not prompted; a var left blank (or every var
 * when non-interactive) is omitted so {@link render} leaves its raw marker.
 *
 * @private
 * @param input - Declared vars, provided arg values, the prompt API, and
 *   whether the session is interactive
 * @returns A map of resolved var id to value (omitting skipped vars)
 */
function resolveDeclaredVars(input: {
  readonly vars: readonly TemplateVar[] | undefined
  readonly provided: Readonly<Record<string, string>>
  readonly prompts: Prompts
  readonly interactive: boolean
}): Promise<Readonly<Record<string, string>>> {
  const { vars, provided, prompts, interactive } = input
  if (vars === undefined || vars.length === 0) {
    return Promise.resolve({})
  }
  return vars.reduce<Promise<Readonly<Record<string, string>>>>(async (accPromise, variable) => {
    const acc = await accPromise
    if (Object.hasOwn(provided, variable.id) || !interactive) {
      return acc
    }
    const answer = await prompts.text({
      message: promptMessage(variable),
      placeholder: 'Leave blank to fill in later',
    })
    if (answer.trim().length === 0) {
      return acc
    }
    return { ...acc, [variable.id]: answer }
  }, Promise.resolve({}))
}

/**
 * Build the prompt message for a declared var from its title/description,
 * falling back to the id.
 *
 * @private
 * @param variable - The declared template var
 * @returns The prompt message string
 */
function promptMessage(variable: TemplateVar): string {
  const label = match(variable.title)
    .with(P.string.minLength(1), (title) => title)
    .otherwise(() => variable.id)
  return match(variable.description)
    .with(P.string.minLength(1), (description) => `${label} — ${description}`)
    .otherwise(() => label)
}
