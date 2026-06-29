import { globSync } from 'node:fs'

import type { Logger } from 'laufen'
import { lauf, z } from 'laufen'
import { attemptAsync, isOk } from 'massaman/control'
import { rimraf } from 'rimraf'

const BASE_PATTERNS = [
  'packages/*/dist',
  'examples/*/dist',
  'extensions/*/dist',

  'examples/*/.ciderpress/dist',
  'examples/*/.ciderpress/cache',
  'examples/*/.ciderpress/content',

  '**/node_modules/.cache',
  '**/.turbo',

  '**/tsconfig.tsbuildinfo',
] as const

const NODE_MODULES_PATTERNS = ['**/node_modules'] as const

export default lauf({
  description: 'Clean build artifacts, caches, and generated files',
  args: {
    all: z.boolean().default(false).describe('Clean node_modules in addition to build artifacts'),
    verbose: z.boolean().default(false).describe('Enable verbose logging'),
  },
  async run(ctx) {
    const patterns = [...BASE_PATTERNS, ...extraPatterns(ctx.args.all)]

    ctx.spinner.start('Cleaning build artifacts and caches')

    const results = await Promise.all(
      patterns.map((pattern) =>
        cleanPattern({
          pattern,
          root: ctx.dirs.root,
          logger: ctx.logger,
          verbose: ctx.args.verbose,
        })
      )
    )

    const cleaned = results.filter((p): p is string => p !== null)

    ctx.spinner.stop(`Cleaned ${cleaned.length} pattern(s)`)

    if (ctx.args.verbose && cleaned.length > 0) {
      ctx.logger.info('Cleaned patterns:')
      cleaned.map((p) => ctx.logger.info(`  ${p}`))
    }

    if (ctx.args.all) {
      ctx.logger.info('Run "pnpm install" to reinstall dependencies')
    }
  },
})

/**
 * Extra patterns to clean when `--all` is passed.
 * @param all - whether the `--all` flag was set
 * @returns the patterns to append to the base set
 * @private
 */
function extraPatterns(all: boolean): readonly string[] {
  if (all) {
    return NODE_MODULES_PATTERNS
  }
  return []
}

/**
 * Clean a single glob pattern relative to the repo root.
 * @param opts.pattern - glob pattern, relative to `opts.root`
 * @param opts.root - absolute repo root
 * @param opts.logger - laufen logger for warn/info output
 * @param opts.verbose - log per-pattern match counts when true
 * @returns the pattern when something was removed, otherwise `null`
 * @private
 */
async function cleanPattern(opts: {
  readonly pattern: string
  readonly root: string
  readonly logger: Logger
  readonly verbose: boolean
}): Promise<string | null> {
  const fullPattern = `${opts.root}/${opts.pattern}`
  const matches = globSync(fullPattern)

  if (matches.length === 0) {
    return null
  }

  if (opts.verbose) {
    opts.logger.info(`Removing ${matches.length} match(es) for: ${opts.pattern}`)
  }

  const result = await attemptAsync(() => rimraf(fullPattern, { glob: true, preserveRoot: true }))

  if (!isOk(result)) {
    opts.logger.warn(`Failed to clean ${opts.pattern}: ${result.error.message}`)
    return null
  }

  return opts.pattern
}
