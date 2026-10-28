import fs from 'node:fs/promises'
import path from 'node:path'

import { ciderpressConfigSchema } from '@ciderpress/config'
import type { CiderpressConfig, Page } from '@ciderpress/config'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createPaths } from '../paths.ts'
import { sync } from './index.ts'

vi.mock('node:fs', () => ({
  default: { existsSync: vi.fn<() => boolean>(() => true) },
  existsSync: vi.fn<() => boolean>(() => false),
  readFileSync: vi.fn<() => string>(() => ''),
}))

vi.mock('node:fs/promises', () => ({
  default: {
    mkdir: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    readFile: vi.fn<() => Promise<string>>().mockResolvedValue('# Custom homepage\n'),
    writeFile: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    readdir: vi.fn<() => Promise<readonly never[]>>().mockResolvedValue([]),
    stat: vi.fn<() => Promise<{ mtimeMs: number }>>().mockResolvedValue({ mtimeMs: 1 }),
  },
}))

const PATHS = createPaths(path.resolve('sync-home-fixture'))

describe('sync()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each(['md', 'mdx'])(
    'should preserve an explicit %s homepage without generating a default',
    async (extension) => {
      const config = homeConfig([{ title: 'Home', path: '/', include: `docs/index.${extension}` }])

      const result = await sync(config, { paths: PATHS, quiet: true })

      expect(result.error).toBeUndefined()
      expect(result.pagesWritten).toBe(1)
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.resolve(PATHS.contentDir, `index.${extension}`),
        expect.stringContaining('# Custom homepage'),
        'utf8'
      )
      const pageWrites = vi
        .mocked(fs.writeFile)
        .mock.calls.filter(
          ([file]) =>
            path.dirname(String(file)) === PATHS.contentDir && /\.mdx?$/.test(String(file))
        )
      expect(pageWrites).toHaveLength(1)
    }
  )

  it.each(['md', 'mdx'])(
    'should still generate a homepage when only a nested %s index exists',
    async (extension) => {
      const config = homeConfig([
        { title: 'Guide', path: '/guide/index', include: `docs/index.${extension}` },
      ])

      const result = await sync(config, { paths: PATHS, quiet: true })

      expect(result.error).toBeUndefined()
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.resolve(PATHS.contentDir, 'index.md'),
        expect.stringContaining('pageType: home'),
        'utf8'
      )
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.resolve(PATHS.contentDir, 'guide', `index.${extension}`),
        expect.stringContaining('# Custom homepage'),
        'utf8'
      )
    }
  )
})

/**
 * Build a defaulted config for homepage sync tests.
 * @private
 * @param pages - Pages to sync
 * @returns Config with no generated home blocks
 */
function homeConfig(pages: Page[]): CiderpressConfig {
  return ciderpressConfigSchema.parse({
    title: 'Homepage test',
    pages,
    home: { blocks: [] },
  }) as CiderpressConfig
}
