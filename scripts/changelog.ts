import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { echo, parseArgv, spinner } from 'zx'

import { aggregate } from './changelog/aggregate.ts'
import { discoverChangelogs, parseChangelog } from './changelog/parse.ts'
import { render } from './changelog/render.ts'

interface ChangelogArgs {
  readonly verbose: boolean
}

const parsedArgs = parseArgv(process.argv.slice(2), {
  boolean: ['verbose'],
  default: { verbose: false },
})
const args: ChangelogArgs = { verbose: parsedArgs.verbose === true }
const root = process.cwd()
const paths = discoverChangelogs(join(root, 'packages'))
const parsed = paths.map((path) => parseChangelog(readFileSync(path, 'utf8')))

if (args.verbose) {
  const summary = parsed
    .map((changelog) => `  ${changelog.name}: ${changelog.versions.length} versions`)
    .join('\n')
  echo(`Discovered ${paths.length} package changelogs\n${summary}`)
}

const outPath = join(root, 'CHANGELOG.md')
const aggregated = await spinner('Aggregating package changelogs', async () => {
  const versions = aggregate(parsed)
  writeFileSync(outPath, render(versions))
  return versions
})

echo(
  `Aggregated ${aggregated.length} versions from ${parsed.length} packages -> ${outPath.replace(`${root}/`, '')}`
)
