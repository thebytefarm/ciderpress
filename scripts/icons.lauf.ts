import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { lauf, z } from 'laufen'

interface IconSet {
  readonly prefix: string
  readonly icons: Readonly<Record<string, unknown>>
  readonly aliases?: Readonly<Record<string, unknown>>
}

interface GeneratedOutput {
  readonly prefixes: readonly string[]
  readonly ids: readonly string[]
}

const HEADER = '// @auto-generated — do not edit. Regenerate with: lauf run icons'

const ICON_SET_PACKAGES: readonly string[] = [
  'catppuccin',
  'devicon',
  'logos',
  'material-icon-theme',
  'mdi',
  'pixelarticons',
  'simple-icons',
  'skill-icons',
  'vscode-icons',
]

function loadIconSet(basePath: string, name: string): IconSet {
  const raw = readFileSync(join(basePath, name, 'icons.json'), 'utf8')
  return JSON.parse(raw) as IconSet
}

function extractIds(iconSet: IconSet): readonly string[] {
  const iconNames = Object.keys(iconSet.icons)
  const aliasNames = Object.keys(iconSet.aliases ?? {})
  return [...iconNames, ...aliasNames].map((name) => `${iconSet.prefix}:${name}`)
}

function collectAllIcons(basePath: string): GeneratedOutput {
  const sets = ICON_SET_PACKAGES.map((name) => loadIconSet(basePath, name))
  const prefixes = sets.map((s) => s.prefix)
  const ids = sets.flatMap(extractIds)
  return { prefixes, ids }
}

function renderOutput(output: GeneratedOutput): string {
  const prefixUnion = output.prefixes.map((p) => `'${p}'`).join(' | ')
  const prefixArray = output.prefixes.map((p) => `'${p}'`).join(', ')

  return [
    HEADER,
    '',
    `export type IconPrefix = ${prefixUnion}`,
    '',
    // oxlint-disable-next-line no-template-curly-in-string -- intentional: generating source code string
    'export type IconId = `${IconPrefix}:${string}`',
    '',
    `export const ICON_PREFIXES: readonly IconPrefix[] = [${prefixArray}]`,
    '',
    `export const VALID_ICON_IDS: ReadonlySet<string> = new Set([`,
    ...output.ids.map((id) => `  '${id}',`),
    '])',
    '',
  ].join('\n')
}

export default lauf({
  description: 'Generate typed icon IDs from bundled @iconify-json sets',
  args: {
    verbose: z.boolean().default(false).describe('Enable verbose logging'),
  },
  run(ctx) {
    const basePath = join(ctx.root, 'packages/ui/node_modules/@iconify-json')

    ctx.spinner.start('Generating icon type definitions')

    const output = collectAllIcons(basePath)

    if (ctx.args.verbose) {
      ctx.logger.info(`Collected ${output.ids.length} icon IDs from ${output.prefixes.length} sets`)
    }

    const content = renderOutput(output)
    const outPath = join(ctx.root, 'packages/config/src/icons.generated.ts')

    writeFileSync(outPath, content)

    ctx.spinner.stop(
      `Generated ${output.ids.length} icon IDs from ${output.prefixes.length} sets → ${outPath.replace(ctx.root, '.')}`
    )
  },
})
