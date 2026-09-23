import fs from 'node:fs/promises'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { OpenAPISidebarEntry } from '../openapi.ts'
import type { ResolvedEntry } from '../types.ts'
import { writeMetaFiles } from './write-meta.ts'

vi.mock(import('node:fs/promises'), () => ({
  default: {
    mkdir: vi.fn<() => Promise<void>>().mockResolvedValue(),
    writeFile: vi.fn<() => Promise<void>>().mockResolvedValue(),
  },
}))

const entries: readonly ResolvedEntry[] = [
  {
    title: 'Apps',
    link: '/apps',
    items: [{ title: 'API', link: '/apps/api', items: [] }],
  },
]

const openapiEntries: readonly OpenAPISidebarEntry[] = [
  {
    prefix: '/apps/api/reference',
    rootLevel: false,
    sidebar: [{ text: 'API Reference', link: '/apps/api/reference', items: [] }],
  },
]

describe('writeMetaFiles()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should promote a workspace file when OpenAPI pages are nested beneath it', async () => {
    await writeMetaFiles({ contentDir: '/content', entries, nav: [], openapiEntries })

    const appsMetaCall = vi
      .mocked(fs.writeFile)
      .mock.calls.find(([filePath]) => filePath === '/content/apps/_meta.json')
    expect(appsMetaCall).toBeDefined()
    if (appsMetaCall === undefined) {
      return
    }
    expect(JSON.parse(String(appsMetaCall[1]))).toContainEqual({
      type: 'dir',
      name: 'api',
      label: 'API',
    })
  })
})
