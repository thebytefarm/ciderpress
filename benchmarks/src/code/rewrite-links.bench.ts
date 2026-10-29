import { bench, describe } from 'vitest'

import { rewriteLinks } from '../../../packages/cli/src/lib/sync/rewrite-links.ts'

const SOURCE_MAP = new Map([['docs/guide.md', 'guides/guide.md']])
const BODY = '# Guide\n\n' + 'Documentation content without a destination. '.repeat(200)
const SCENARIOS = [
  { name: 'no links', content: BODY },
  { name: 'real destination', content: BODY + '\n\n[Guide](./guide.md)' },
  { name: 'code label', content: BODY + '\n\n[`[Guide](./guide.md)`](./guide.md)' },
] as const

describe('rewriteLinks()', () => {
  SCENARIOS.map(({ name, content }) =>
    bench(
      name,
      () => {
        rewriteLinks({
          content,
          sourcePath: 'docs/index.md',
          outputPath: 'guides/index.md',
          sourceMap: SOURCE_MAP,
        })
      },
      { time: 500, warmupTime: 100, iterations: 20 }
    )
  )
})
