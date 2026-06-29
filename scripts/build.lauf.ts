import { join } from 'node:path'

import { lauf, z } from 'laufen'
import { isOk } from 'massaman/control'

import { discoverExamples } from './build/discover.ts'
import { writeLandingMdx } from './build/landing.ts'
import { mergeExampleDist } from './build/merge.ts'
import { runExampleBuild, runRootBuild } from './build/run.ts'
import { plural } from './lib/plural.ts'

export default lauf({
  description: 'Build the root docs site + all examples and merge under /examples/<name>/',
  args: {
    skipExamples: z.boolean().default(false).describe('Skip example builds (root only)'),
    skipRoot: z
      .boolean()
      .default(false)
      .describe('Skip the root docs build (examples + merge only)'),
    verbose: z.boolean().default(false).describe('Enable verbose logging'),
  },
  async run(ctx) {
    const { root } = ctx.dirs
    const examples = discoverExamples(join(root, 'examples'))

    if (examples.length === 0) {
      ctx.logger.warn('No examples discovered under examples/')
    } else if (ctx.args.verbose) {
      examples.map((e) => ctx.logger.info(`example: ${e.slug} (${e.pkg}) → ${e.mountBase}`))
    }

    ctx.spinner.start('Generating examples landing page')
    writeLandingMdx({ root, examples })
    ctx.spinner.stop(
      `Wrote docs/examples/index.mdx (${examples.length} ${plural(examples.length, 'card')})`
    )

    // Rspress only forwards `base` to Rspack's `assetPrefix` when
    // `NODE_ENV === 'production'`. Force it so example asset URLs
    // (`/static/js/...`) get the mount prefix.
    process.env.NODE_ENV = 'production'

    if (!ctx.args.skipRoot) {
      ctx.spinner.start('Building root docs site')
      const rootResult = await runRootBuild({ cwd: root, logger: ctx.logger })
      if (rootResult !== 0) {
        ctx.spinner.stop('Root docs build failed')
        return rootResult
      }
      ctx.spinner.stop('Built root docs site')
    }

    if (ctx.args.skipExamples || examples.length === 0) {
      return 0
    }

    ctx.spinner.start(`Building ${examples.length} example ${plural(examples.length, 'site')}`)
    const exampleResults = await Promise.all(
      examples.map((example) =>
        runExampleBuild({
          pkg: example.pkg,
          cwd: root,
          env: { CIDERPRESS_BASE: example.mountBase },
          logger: ctx.logger,
        })
      )
    )
    const failedExamples = exampleResults
      .map((code, i) => ({ code, example: examples[i] }))
      .filter((r) => r.code !== 0)
    if (failedExamples.length > 0) {
      ctx.spinner.stop(`Failed to build ${failedExamples.length} example site(s)`)
      failedExamples.map((r) => ctx.logger.error(`build failed: ${r.example.slug}`))
      return 1
    }
    ctx.spinner.stop(`Built ${examples.length} example ${plural(examples.length, 'site')}`)

    ctx.spinner.start('Merging example dists into root dist')
    const mergeFailures = examples.flatMap((example) => {
      const result = mergeExampleDist({ root, example })
      if (isOk(result)) {
        return []
      }
      return [{ example, error: result.error }]
    })
    if (mergeFailures.length > 0) {
      ctx.spinner.stop(`Failed to merge ${mergeFailures.length} example dist(s)`)
      mergeFailures.map((f) =>
        ctx.logger.error(`merge failed: ${f.example.slug} — ${f.error.message}`)
      )
      return 1
    }
    ctx.spinner.stop(
      `Merged ${examples.length} example ${plural(examples.length, 'dist')} into .ciderpress/dist/examples/`
    )
  },
})
