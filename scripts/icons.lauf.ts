import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { lauf, z } from 'laufen'
import { isErr } from 'massaman/control'

import { collectAllIcons } from './icons/collect.ts'
import { renderOutput } from './icons/render.ts'

export default lauf({
  description: 'Generate typed icon IDs from bundled @iconify-json sets',
  args: {
    verbose: z.boolean().default(false).describe('Enable verbose logging'),
  },
  run(ctx) {
    ctx.spinner.start('Generating icon type definitions')

    const result = collectAllIcons(join(ctx.dirs.root, 'packages/ui/node_modules/@iconify-json'))

    if (isErr(result)) {
      ctx.spinner.stop('Failed to generate icon type definitions')
      ctx.logger.error(`${result.error}`)
      return 1
    }

    const output = result.value

    if (ctx.args.verbose) {
      ctx.logger.info(`Collected ${output.ids.length} icon IDs from ${output.prefixes.length} sets`)
    }

    const outPath = join(ctx.dirs.root, 'packages/config/src/icons.generated.ts')
    writeFileSync(outPath, renderOutput(output))

    ctx.spinner.stop(
      `Generated ${output.ids.length} icon IDs from ${output.prefixes.length} sets → ${outPath.replace(ctx.dirs.root, '.')}`
    )
  },
})
