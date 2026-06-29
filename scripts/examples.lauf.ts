import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

import { lauf, z } from 'laufen'

import { discoverExamples } from './examples/discover.ts'

export default lauf({
  description: 'Discover and run ciderpress examples (dev, build, serve, or list)',
  args: {
    name: z.string().optional().describe('Example directory name (omit to list)'),
    cmd: z
      .enum(['dev', 'build', 'serve', 'list'])
      .optional()
      .describe('Command to run — defaults to dev when name is given, else list'),
  },
  run(ctx) {
    const examples = discoverExamples(join(ctx.dirs.root, 'examples'))
    const { name, cmd } = ctx.args

    if (examples.length === 0) {
      ctx.logger.warn('No examples found in examples/')
      return 0
    }

    if (cmd === 'list' || (cmd === undefined && name === undefined)) {
      ctx.logger.info(`Examples (${examples.length}):`)
      examples.map((e) => ctx.logger.info(`  - ${e.name} (${e.pkg})`))
      return 0
    }

    const available = examples.map((e) => e.name).join(', ')

    if (name === undefined) {
      ctx.logger.error(`--name required for ${cmd}. Available: ${available}`)
      return 1
    }

    const example = examples.find((e) => e.name === name)
    if (example === undefined) {
      ctx.logger.error(`Example "${name}" not found. Available: ${available}`)
      return 1
    }

    const effectiveCmd = cmd ?? 'dev'
    ctx.logger.info(`${effectiveCmd} → ${example.pkg}`)

    const result = spawnSync(
      'pnpm',
      ['--filter', example.pkg, 'exec', 'ciderpress', effectiveCmd],
      { cwd: ctx.dirs.root, stdio: 'inherit' }
    )
    return result.status ?? 0
  },
})
