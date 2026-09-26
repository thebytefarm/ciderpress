import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { isErr } from 'massaman/control'
import { echo, parseArgv, spinner } from 'zx'

import { collectAllIcons } from './icons/collect.ts'
import { renderOutput } from './icons/render.ts'

interface IconsArgs {
  readonly verbose: boolean
}

const parsedArgs = parseArgv(process.argv.slice(2), {
  boolean: ['verbose'],
  default: { verbose: false },
})
const args: IconsArgs = { verbose: parsedArgs.verbose === true }

const exitCode = await generateIcons({ root: process.cwd(), args })
process.exitCode = exitCode

/**
 * Generate typed icon identifiers from the bundled Iconify sets.
 * @param opts.root - absolute repository root
 * @param opts.args - command-line generation controls
 * @returns the process exit code
 */
async function generateIcons(opts: {
  readonly root: string
  readonly args: IconsArgs
}): Promise<number> {
  const result = await spinner('Generating icon type definitions', async () =>
    collectAllIcons(join(opts.root, 'packages/ui/node_modules/@iconify-json'))
  )

  if (isErr(result)) {
    echo(`Failed to generate icon type definitions: ${result.error}`)
    return 1
  }

  if (opts.args.verbose) {
    echo(`Collected ${result.value.ids.length} icon IDs from ${result.value.prefixes.length} sets`)
  }

  const outPath = join(opts.root, 'packages/config/src/icons.generated.ts')
  writeFileSync(outPath, renderOutput(result.value))
  echo(
    `Generated ${result.value.ids.length} icon IDs from ${result.value.prefixes.length} sets -> ${outPath.replace(opts.root, '.')}`
  )
  return 0
}
