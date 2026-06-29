import { autoGenHeader } from '../lib/auto-gen-header.ts'
import type { GeneratedOutput } from './collect.ts'

const HEADER = autoGenHeader({ cmd: 'lauf run icons', style: 'js' })

/**
 * Render the collected icon prefixes and IDs into the
 * `packages/config/src/icons.generated.ts` source file.
 * @param output - the collected prefixes and IDs
 * @returns the generated TypeScript source, terminated by a newline
 */
export function renderOutput(output: GeneratedOutput): string {
  const prefixUnion = output.prefixes.map((p) => `'${p}'`).join(' | ')
  const prefixArray = output.prefixes.map((p) => `'${p}'`).join(', ')
  const iconLines = output.ids.map((id) => `  '${id}',`).join('\n')

  return `${HEADER}

export type IconPrefix = ${prefixUnion}

// oxlint-disable-next-line no-template-curly-in-string -- intentional: generating source code string
export type IconId = \`\${IconPrefix}:\${string}\`

export const ICON_PREFIXES: readonly IconPrefix[] = [${prefixArray}]

export const VALID_ICON_IDS: ReadonlySet<string> = new Set([
${iconLines}
])
`
}
