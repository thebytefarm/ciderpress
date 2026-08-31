import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { scanMarkers } from './markers'

// oxlint-disable-next-line ciderpress/no-let -- per-test temp dir, reassigned in beforeEach
let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ciderpress-markers-'))
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('scanMarkers()', () => {
  it('should return no issues when content is clean', async () => {
    write('content/guide.md', '# Guide\n\nAll filled in.\n')
    const issues = await scanMarkers({ contentDir: join(dir, 'content'), repoRoot: dir })
    expect(issues).toStrictEqual([])
  })

  it('should flag leftover markers in prose', async () => {
    write('content/adr.md', '# Title\n\n{{ decision }} and {{ }}\n')
    const issues = await scanMarkers({ contentDir: join(dir, 'content'), repoRoot: dir })
    expect(issues).toStrictEqual([
      { file: join('content', 'adr.md'), markers: ['{{ decision }}', '{{ }}'] },
    ])
  })

  it('should ignore markers inside fenced code blocks', async () => {
    write('content/doc.md', '# Doc\n\n```md\n{{ decision }}\n```\n')
    const issues = await scanMarkers({ contentDir: join(dir, 'content'), repoRoot: dir })
    expect(issues).toStrictEqual([])
  })

  it('should ignore markers inside inline code', async () => {
    write('content/doc.md', '# Doc\n\nUse `{{ decision }}` as a marker.\n')
    const issues = await scanMarkers({ contentDir: join(dir, 'content'), repoRoot: dir })
    expect(issues).toStrictEqual([])
  })

  it('should ignore JSX inline-style objects in mdx', async () => {
    write('content/icons.mdx', "# Icons\n\n<span style={{ color: '#34d399', width: 36 }} />\n")
    const issues = await scanMarkers({ contentDir: join(dir, 'content'), repoRoot: dir })
    expect(issues).toStrictEqual([])
  })

  it('should scan nested directories and mdx files', async () => {
    write('content/guides/deep.mdx', '# Deep\n\n{{ todo }}\n')
    const issues = await scanMarkers({ contentDir: join(dir, 'content'), repoRoot: dir })
    expect(issues).toStrictEqual([
      { file: join('content', 'guides', 'deep.mdx'), markers: ['{{ todo }}'] },
    ])
  })

  it('should return no issues when the content dir is absent', async () => {
    const issues = await scanMarkers({ contentDir: join(dir, 'missing'), repoRoot: dir })
    expect(issues).toStrictEqual([])
  })
})

/**
 * Write a content file into a sub-path of the current temp dir.
 *
 * @private
 * @param name - Relative file path (sub-directories created as needed)
 * @param body - Full file contents
 */
function write(name: string, body: string): void {
  const full = join(dir, name)
  mkdirSync(join(full, '..'), { recursive: true })
  writeFileSync(full, body, 'utf8')
}
