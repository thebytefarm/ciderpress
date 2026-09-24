import fs from 'node:fs/promises'
import path from 'node:path'

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
    items: [
      {
        title: 'API',
        link: '/apps/api',
        items: [],
        page: { outputPath: 'apps/api/index.md', frontmatter: {} },
      },
    ],
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
      .mock.calls.find(([filePath]) => filePath === path.resolve('/content', 'apps', '_meta.json'))
    expect(appsMetaCall).toBeDefined()
    if (appsMetaCall === undefined) {
      return
    }
    expect(JSON.parse(String(appsMetaCall[1]))).toContainEqual({
      type: 'dir',
      name: 'api',
      label: 'API',
    })

    const apiMetaCall = vi
      .mocked(fs.writeFile)
      .mock.calls.find(
        ([filePath]) => filePath === path.resolve('/content', 'apps', 'api', '_meta.json')
      )
    expect(apiMetaCall).toBeDefined()
    if (apiMetaCall === undefined) {
      return
    }
    expect(JSON.parse(String(apiMetaCall[1]))).toStrictEqual([
      { type: 'file', name: 'index', label: 'Overview' },
      { type: 'dir', name: 'reference', label: 'API Reference' },
    ])
  })

  it('should promote a root workspace file when OpenAPI pages are nested beneath it', async () => {
    const rootEntries: readonly ResolvedEntry[] = [
      {
        title: 'API',
        link: '/api',
        page: { outputPath: 'api.md', frontmatter: {} },
      },
    ]
    const rootOpenapiEntries: readonly OpenAPISidebarEntry[] = [
      {
        prefix: '/api/reference',
        rootLevel: false,
        sidebar: [{ text: 'API Reference', link: '/api/reference', items: [] }],
      },
    ]

    await writeMetaFiles({
      contentDir: '/content',
      entries: rootEntries,
      nav: [],
      openapiEntries: rootOpenapiEntries,
    })

    const rootMetaCall = vi
      .mocked(fs.writeFile)
      .mock.calls.find(([filePath]) => filePath === path.resolve('/content', '_meta.json'))
    expect(rootMetaCall).toBeDefined()
    if (rootMetaCall === undefined) {
      return
    }
    expect(JSON.parse(String(rootMetaCall[1]))).toContainEqual({
      type: 'dir',
      name: 'api',
      label: 'API',
    })
  })
})
