import { lauf, z } from 'laufen'
import { rimraf } from 'rimraf'

export default lauf({
  description: 'Clean build artifacts, caches, and generated files',
  args: {
    all: z.boolean().default(false).describe('Clean node_modules in addition to build artifacts'),
    verbose: z.boolean().default(false).describe('Enable verbose logging'),
  },
  async run(ctx) {
    const patterns: string[] = [
      'packages/*/dist',
      'examples/*/dist',
      'extensions/*/dist',

      'examples/*/.ciderpress/dist',
      'examples/*/.ciderpress/cache',
      'examples/*/.ciderpress/content',

      '**/node_modules/.cache',
      '**/.turbo',

      '**/tsconfig.tsbuildinfo',
    ]

    if (ctx.args.all) {
      patterns.push('**/node_modules')
    }

    ctx.spinner.start('Cleaning build artifacts and caches')

    const results = await Promise.all(
      patterns.map(async (pattern) => {
        const fullPattern = `${ctx.root}/${pattern}`

        if (ctx.args.verbose) {
          ctx.logger.info(`Removing: ${pattern}`)
        }

        try {
          const removed = await rimraf(fullPattern, {
            glob: true,
            preserveRoot: true,
          })

          if (removed.length > 0) {
            if (ctx.args.verbose) {
              ctx.logger.info(`  Removed ${removed.length} paths`)
            }
            return pattern
          }
          return null
        } catch (error) {
          const errorMessage = (() => {
            if (error instanceof Error) {
              return error.message
            }
            return String(error)
          })()
          ctx.logger.warn(`Failed to clean ${pattern}: ${errorMessage}`)
          return null
        }
      })
    )

    const cleaned = results.filter((p): p is string => p !== null)

    ctx.spinner.stop(`Cleaned ${cleaned.length} patterns`)

    if (ctx.args.verbose && cleaned.length > 0) {
      ctx.logger.info('Cleaned patterns:')
      cleaned.map((p) => ctx.logger.info(`  ${p}`))
    }

    if (ctx.args.all) {
      ctx.logger.info('Run "pnpm install" to reinstall dependencies')
    }
  },
})
