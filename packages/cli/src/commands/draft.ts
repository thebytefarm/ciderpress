import fs from 'node:fs/promises'
import path from 'node:path'

import { loadConfig } from '@ciderpress/config/loader'
import { render, toSlug } from '@ciderpress/templates'
import type { Template } from '@ciderpress/templates'
import { command } from '@kidd-cli/core'
import { match, P } from 'massaman/match'
import { z } from 'zod'

import { createPaths } from '../lib/paths.ts'
import { configTemplates, resolveTemplates } from '../lib/templates.ts'

/**
 * Scaffold a new documentation file from a template.
 *
 * Prompts for the doc type and title when not provided via args,
 * then writes the rendered template to the specified output directory.
 * Templates declared via the `templates` config field are merged with the
 * built-ins (user templates override built-ins by type); when no config or
 * `templates` field is present, only built-ins are offered.
 */
export default command({
  name: 'draft',
  description: 'Scaffold a new documentation file from a template',
  options: z.object({
    type: z.string().optional(),
    title: z.string().optional(),
    out: z.string().optional().default('.'),
  }),
  handler: async (ctx) => {
    ctx.log.intro('ciderpress draft')

    const paths = createPaths(process.cwd())
    const [, config] = await loadConfig(paths.repoRoot)
    const { registry } = await resolveTemplates({ templates: configTemplates(config), paths })

    const typeArg = ctx.args.type
    const hasValidType = match(typeArg)
      .with(P.string.minLength(1), (t) => registry.has(t))
      .otherwise(() => false)

    const selectedType: string = await match(hasValidType)
      .with(true, () => Promise.resolve(typeArg as string))
      .otherwise(() =>
        ctx.prompts.select<string>({
          message: 'Select a doc type',
          options: registry.list().map((t: Template) => ({
            value: t.type,
            label: t.label,
            hint: t.hint,
          })),
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

    const content = render(template, { title })
    const extension = template.extension ?? '.md'
    const filename = `${slug}${extension}`
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
    ctx.log.outro('Done')
  },
})
