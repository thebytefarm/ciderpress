import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { lauf, z } from 'laufen'
import { attempt, isOk } from 'massaman/control'

import { PAGE_SPECS } from './docs/data.ts'
import { countEntries, parseTechMap } from './docs/parse.ts'
import { renderColors, renderOverview, renderTechOverview, renderTechPage } from './docs/render.ts'

interface GeneratedFile {
  readonly path: string
  readonly content: string
}

export default lauf({
  description: 'Generate icon reference docs from TECH_ICONS source of truth',
  args: {
    verbose: z.boolean().default(false).describe('Enable verbose logging'),
  },
  run(ctx) {
    const techMapPath = join(ctx.dirs.root, 'packages/ui/src/theme/icons/tech-map.ts')

    if (!existsSync(techMapPath)) {
      ctx.logger.error(`Tech map not found: ${techMapPath}`)
      return 1
    }

    ctx.spinner.start('Generating icon reference docs')

    const categories = parseTechMap(readFileSync(techMapPath, 'utf8'))

    if (ctx.args.verbose) {
      ctx.logger.info(
        `Parsed ${categories.length} categories with ${countEntries(categories)} total entries`
      )
    }

    const outDir = join(ctx.dirs.root, 'docs/references/icons')
    const techDir = join(ctx.dirs.root, 'docs/references/technology')

    mkdirSync(outDir, { recursive: true })
    mkdirSync(techDir, { recursive: true })

    const files: readonly GeneratedFile[] = [
      { path: join(outDir, 'overview.mdx'), content: renderOverview() },
      { path: join(outDir, 'colors.mdx'), content: renderColors() },
      { path: join(techDir, 'overview.mdx'), content: renderTechOverview(categories) },
      ...PAGE_SPECS.map((spec) => ({
        path: join(techDir, `${spec.slug}.mdx`),
        content: renderTechPage(spec, categories),
      })),
    ]

    const failures = files.flatMap((f) => {
      const result = attempt(() => writeFileSync(f.path, f.content))
      if (!isOk(result)) {
        return [{ path: f.path, error: result.error }]
      }
      if (ctx.args.verbose) {
        ctx.logger.info(`Wrote ${f.path.replace(ctx.dirs.root, '.')}`)
      }
      return []
    })

    if (failures.length > 0) {
      ctx.spinner.stop(`Failed to write ${failures.length} of ${files.length} icon reference docs`)
      failures.map((f) => ctx.logger.error(`Write failed: ${f.path} — ${f.error.message}`))
      return 1
    }

    ctx.spinner.stop(`Generated ${files.length} icon reference docs`)
  },
})
