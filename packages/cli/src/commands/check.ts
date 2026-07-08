import { loadConfig } from '@ciderpress/config/loader'
import { command } from '@kidd-cli/core'

import { presentResults, runBuildCheck, runConfigCheck, runTemplatesCheck } from '../lib/check.ts'
import { createPaths } from '../lib/paths.ts'
import { sync } from '../lib/sync/index.ts'

/**
 * Registers the `check` CLI command to validate config and detect deadlinks.
 */
export default command({
  name: 'check',
  description: 'Validate config and check for broken links',
  handler: async (ctx) => {
    const paths = createPaths(process.cwd())
    ctx.log.intro('ciderpress check')

    // Config validation — loadConfig validates via validateConfig and
    // returns a Result tuple. No process.exit, no process overrides.
    ctx.log.step('Validating config...')
    const [configErr, config] = await loadConfig(paths.repoRoot)
    const configResult = runConfigCheck({ config, loadError: configErr })

    // If config is invalid, present the error and bail — sync/build need valid config
    if (configErr || !config) {
      const templatesResult = { status: 'skipped' } as const
      const buildResult = { status: 'skipped' } as const
      presentResults({ configResult, templatesResult, buildResult, logger: ctx.log })
      ctx.log.outro('Checks failed')
      process.exit(1)
    }

    ctx.log.step('Validating templates...')
    const templatesResult = await runTemplatesCheck({ templates: config.templates, paths })

    ctx.log.step('Syncing content...')
    const syncResult = await sync(config, { paths, quiet: true })
    if (syncResult.error) {
      ctx.log.error(syncResult.error)
      process.exit(1)
    }
    ctx.log.success(
      `Synced (${syncResult.pagesWritten} written, ${syncResult.pagesSkipped} unchanged)`
    )

    ctx.log.step('Checking for broken links...')
    const buildResult = await runBuildCheck({ config, paths })

    const passed = presentResults({ configResult, templatesResult, buildResult, logger: ctx.log })

    if (passed) {
      ctx.log.outro('All checks passed')
    } else {
      ctx.log.outro('Checks failed')
      process.exit(1)
    }
  },
})
