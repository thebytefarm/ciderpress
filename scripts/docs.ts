import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { attempt, isOk } from 'massaman/control'
import { echo, parseArgv, spinner } from 'zx'

import { PAGE_SPECS } from './docs/data.ts'
import { countEntries, parseTechMap } from './docs/parse.ts'
import { renderColors, renderOverview, renderTechOverview, renderTechPage } from './docs/render.ts'

interface GeneratedFile {
  readonly path: string
  readonly content: string
}

interface DocsArgs {
  readonly verbose: boolean
}

const parsedArgs = parseArgv(process.argv.slice(2), {
  boolean: ['verbose'],
  default: { verbose: false },
})
const args: DocsArgs = { verbose: parsedArgs.verbose === true }

const exitCode = await generateDocs({ root: process.cwd(), args })
process.exitCode = exitCode

/**
 * Generate the icon and technology reference documentation.
 * @param opts.root - absolute repository root
 * @param opts.args - command-line generation controls
 * @returns the process exit code
 */
async function generateDocs(opts: {
  readonly root: string
  readonly args: DocsArgs
}): Promise<number> {
  const techMapPath = join(opts.root, 'packages/ui/src/theme/icons/tech-map.ts')
  if (!existsSync(techMapPath)) {
    echo(`Tech map not found: ${techMapPath}`)
    return 1
  }

  const categories = parseTechMap(readFileSync(techMapPath, 'utf8'))
  if (opts.args.verbose) {
    echo(`Parsed ${categories.length} categories with ${countEntries(categories)} total entries`)
  }

  const outDir = join(opts.root, 'docs/references/icons')
  const techDir = join(opts.root, 'docs/references/technology')
  mkdirSync(outDir, { recursive: true })
  mkdirSync(techDir, { recursive: true })

  const files: readonly GeneratedFile[] = [
    { path: join(outDir, 'overview.mdx'), content: renderOverview() },
    { path: join(outDir, 'colors.mdx'), content: renderColors() },
    { path: join(techDir, 'overview.mdx'), content: renderTechOverview(categories) },
    ...PAGE_SPECS.map((spec) => ({
      path: join(techDir, `${spec.slug}.mdx`),
      content: renderTechPage(spec, categories),
    })),
  ]

  const failures = await spinner('Generating icon reference docs', async () =>
    files.flatMap((file) => {
      const result = attempt(() => writeFileSync(file.path, file.content))
      if (!isOk(result)) {
        return [{ path: file.path, error: result.error }]
      }
      if (opts.args.verbose) {
        echo(`Wrote ${file.path.replace(opts.root, '.')}`)
      }
      return []
    })
  )

  if (failures.length > 0) {
    failures.map((failure) => echo(`Write failed: ${failure.path} - ${failure.error.message}`))
    return 1
  }

  echo(`Generated ${files.length} icon reference docs`)
  return 0
}
