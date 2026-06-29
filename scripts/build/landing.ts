import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { autoGenHeader } from '../lib/auto-gen-header.ts'
import { frontmatter } from '../lib/mdx.ts'
import type { ExampleMeta } from './discover.ts'

const HEADER = autoGenHeader({ cmd: 'pnpm docs:build', style: 'jsx' })

/**
 * Generate the auto-managed `docs/examples/index.mdx` landing page —
 * one flat card per discovered example, linking to its mount path.
 * @param opts.root - absolute path to the repo root
 * @param opts.examples - the examples to render
 */
export function writeLandingMdx(opts: {
  readonly root: string
  readonly examples: readonly ExampleMeta[]
}): void {
  const dir = join(opts.root, 'docs', 'examples')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.mdx'), renderLandingMdx(opts.examples))
}

/**
 * Render the examples landing-page MDX from the discovered example
 * list. Output is deterministic — same input always produces the same
 * file.
 * @param examples - discovered examples (already sorted by slug)
 * @returns MDX source for `docs/examples/index.mdx`
 * @private
 */
function renderLandingMdx(examples: readonly ExampleMeta[]): string {
  const cards = examples.map(renderCard).join('\n\n')

  return `${frontmatter({ title: 'Examples', description: 'Live example sites built with ciderpress.' })}

${HEADER}

# Examples

Each card below links to a full ciderpress site mounted under \`/examples/<name>/\` on this deploy. Source for each example lives in [\`examples/\`](https://github.com/thebytefarm/ciderpress/tree/main/examples).

${cards}
`
}

/**
 * Render one card on the examples landing page.
 * @param e - the example to render
 * @returns the markdown for one card
 * @private
 */
function renderCard(e: ExampleMeta): string {
  const desc = e.tagline ?? e.description
  return `### [${e.title}](${e.mountBase})\n\n${desc}${themeChip(e.theme)}`
}

/**
 * Render the optional " · **theme**: `<name>`" suffix shown on a card
 * when the example sets a theme name.
 * @param theme - theme name or `null`
 * @returns the suffix string, or empty when there's no theme
 * @private
 */
function themeChip(theme: string | null): string {
  if (theme === null) {
    return ''
  }
  return ` · **theme**: \`${theme}\``
}
