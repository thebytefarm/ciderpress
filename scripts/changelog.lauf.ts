import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { lauf, z } from 'laufen'

import { aggregate } from './changelog/aggregate.ts'
import { discoverChangelogs, parseChangelog } from './changelog/parse.ts'
import { render } from './changelog/render.ts'

export default lauf({
  description: 'Aggregate per-package CHANGELOG.md files into a root CHANGELOG.md',
  args: {
    verbose: z.boolean().default(false).describe('Enable verbose logging'),
  },
  run(ctx) {
    ctx.spinner.start('Aggregating package changelogs')

    const paths = discoverChangelogs(join(ctx.dirs.root, 'packages'))
    const parsed = paths.map((p) => parseChangelog(readFileSync(p, 'utf8')))

    if (ctx.args.verbose) {
      const summary = parsed.map((p) => `  ${p.name}: ${p.versions.length} versions`).join('\n')
      ctx.logger.info(`Discovered ${paths.length} package changelogs\n${summary}`)
    }

    const aggregated = aggregate(parsed)
    const outPath = join(ctx.dirs.root, 'CHANGELOG.md')
    writeFileSync(outPath, render(aggregated))

    ctx.spinner.stop(
      `Aggregated ${aggregated.length} versions from ${parsed.length} packages → ${outPath.replace(`${ctx.dirs.root}/`, '')}`
    )
  },
})
