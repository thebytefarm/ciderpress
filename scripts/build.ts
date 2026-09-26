import { join } from 'node:path'

import { isOk } from 'massaman/control'
import { echo, parseArgv } from 'zx'

import { discoverExamples } from './build/discover.ts'
import { writeLandingMdx } from './build/landing.ts'
import { mergeExampleDist } from './build/merge.ts'
import { runExampleBuild, runRootBuild } from './build/run.ts'
import { plural } from './lib/plural.ts'

interface BuildArgs {
  readonly skipExamples: boolean
  readonly skipRoot: boolean
  readonly verbose: boolean
}

const parsedArgs = parseArgv(process.argv.slice(2), {
  boolean: ['skip-examples', 'skip-root', 'verbose'],
  default: { 'skip-examples': false, 'skip-root': false, verbose: false },
  camelCase: true,
})
const args: BuildArgs = {
  skipExamples: parsedArgs.skipExamples === true,
  skipRoot: parsedArgs.skipRoot === true,
  verbose: parsedArgs.verbose === true,
}

const exitCode = await build({ root: process.cwd(), args })
process.exitCode = exitCode

/**
 * Build the root docs and mount every example beneath `/examples/`.
 * @param opts.root - absolute repository root
 * @param opts.args - command-line build controls
 * @returns the process exit code
 */
async function build(opts: { readonly root: string; readonly args: BuildArgs }): Promise<number> {
  const examples = discoverExamples(join(opts.root, 'examples'))

  if (examples.length === 0) {
    echo('No examples discovered under examples/')
  } else if (opts.args.verbose) {
    examples.map((example) =>
      echo(`example: ${example.slug} (${example.pkg}) -> ${example.mountBase}`)
    )
  }

  writeLandingMdx({ root: opts.root, examples })
  echo(`Wrote docs/examples/index.mdx (${examples.length} ${plural(examples.length, 'card')})`)

  process.env.NODE_ENV = 'production'

  if (!opts.args.skipRoot) {
    echo('Building root docs site')
    const rootResult = await runRootBuild({ cwd: opts.root })
    if (rootResult !== 0) {
      return rootResult
    }
  }

  if (opts.args.skipExamples || examples.length === 0) {
    return 0
  }

  echo(`Building ${examples.length} example ${plural(examples.length, 'site')}`)
  const exampleResults = await examples.reduce<Promise<readonly number[]>>(
    async (accPromise, example) => {
      const acc = await accPromise
      const code = await runExampleBuild({
        pkg: example.pkg,
        cwd: opts.root,
        env: { CIDERPRESS_BASE: example.mountBase },
      })
      return [...acc, code]
    },
    Promise.resolve([])
  )
  const failedExamples = exampleResults
    .map((code, index) => ({ code, example: examples[index] }))
    .filter((result) => result.code !== 0)

  if (failedExamples.length > 0) {
    failedExamples.map((result) => echo(`build failed: ${result.example.slug}`))
    return 1
  }

  const mergeFailures = examples.flatMap((example) => {
    const result = mergeExampleDist({ root: opts.root, example })
    if (isOk(result)) {
      return []
    }
    return [{ example, error: result.error }]
  })

  if (mergeFailures.length > 0) {
    mergeFailures.map((failure) =>
      echo(`merge failed: ${failure.example.slug} - ${failure.error.message}`)
    )
    return 1
  }

  echo(
    `Merged ${examples.length} example ${plural(examples.length, 'dist')} into .ciderpress/dist/examples/`
  )
  return 0
}
