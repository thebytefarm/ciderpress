// oxlint-disable no-ternary
import fs from 'node:fs'
import path from 'node:path'

import type {
  Disposable,
  Event,
  EventEmitter,
  FileSystemWatcher,
  GlobPattern,
  RelativePattern,
} from 'vscode'

interface ManifestFileEntry {
  readonly source: string
  readonly sourceMtime: number
  readonly contentHash: string
  readonly outputPath: string
}

interface Manifest {
  readonly files: Record<string, ManifestFileEntry>
  readonly timestamp: number
}

interface ManifestReader extends Disposable {
  readonly getUrl: (fsPath: string) => string | undefined
  readonly getPath: (fsPath: string) => string | undefined
  readonly getSourceByUrlPath: (urlPath: string) => string | undefined
  readonly isTracked: (fsPath: string) => boolean
  readonly reload: (baseUrl?: string | null) => void
  readonly onDidChange: Event<void>
}

interface ManifestReaderDeps {
  readonly workspaceRoot: string
  readonly createWatcher: (pattern: GlobPattern) => FileSystemWatcher
  readonly EventEmitter: new () => EventEmitter<void>
  readonly RelativePattern: new (base: string, pattern: string) => RelativePattern
}

const MANIFEST_RELATIVE = path.join('.ciderpress', 'content', '.generated', 'manifest.json')

function readManifest(workspaceRoot: string): Manifest | null {
  const manifestPath = path.join(workspaceRoot, MANIFEST_RELATIVE)
  // oxlint-disable-next-line security/detect-non-literal-fs-filename
  if (!fs.existsSync(manifestPath)) {
    return null
  }
  try {
    // oxlint-disable-next-line security/detect-non-literal-fs-filename
    const raw = fs.readFileSync(manifestPath, 'utf8')
    return JSON.parse(raw) as Manifest
  } catch {
    return null
  }
}

function buildPathMap(
  manifest: Manifest | null,
  workspaceRoot: string
): ReadonlyMap<string, string> {
  if (!manifest) {
    return new Map()
  }

  return new Map(
    Object.values(manifest.files)
      .filter((entry): entry is ManifestFileEntry & { source: string } => Boolean(entry.source))
      .map((entry) => {
        const absoluteSource = path.resolve(workspaceRoot, entry.source)
        const urlPath = entry.outputPath.replace(/\.md$/, '')
        return [absoluteSource, urlPath] as const
      })
  )
}

function buildUrlToSourceMap(
  manifest: Manifest | null,
  workspaceRoot: string
): ReadonlyMap<string, string> {
  if (!manifest) {
    return new Map()
  }

  return new Map(
    Object.values(manifest.files)
      .filter((entry): entry is ManifestFileEntry & { source: string } => Boolean(entry.source))
      .map((entry) => {
        const urlPath = entry.outputPath.replace(/\.md$/, '')
        const normalized = urlPath.startsWith('/') ? urlPath : `/${urlPath}`
        const absoluteSource = path.resolve(workspaceRoot, entry.source)
        return [normalized, absoluteSource] as const
      })
  )
}

/**
 * Creates a manifest reader that watches for changes to the generated manifest.json.
 */
function createManifestReader(deps: ManifestReaderDeps): ManifestReader {
  const emitter = new deps.EventEmitter()
  const initialManifest = readManifest(deps.workspaceRoot)
  const state = {
    pathMap: buildPathMap(initialManifest, deps.workspaceRoot),
    urlToSourceMap: buildUrlToSourceMap(initialManifest, deps.workspaceRoot),
    baseUrl: null as string | null,
  }

  function reload(baseUrl?: string | null): void {
    if (baseUrl !== undefined) {
      state.baseUrl = baseUrl
    }
    const manifest = readManifest(deps.workspaceRoot)
    state.pathMap = buildPathMap(manifest, deps.workspaceRoot)
    state.urlToSourceMap = buildUrlToSourceMap(manifest, deps.workspaceRoot)
    emitter.fire()
  }

  const manifestGlob = new deps.RelativePattern(
    deps.workspaceRoot,
    '.ciderpress/content/.generated/manifest.json'
  )
  const watcher = deps.createWatcher(manifestGlob)
  watcher.onDidChange(() => reload())
  watcher.onDidCreate(() => reload())
  watcher.onDidDelete(() => reload())

  return {
    getPath: (fsPath: string): string | undefined => state.pathMap.get(fsPath),
    getSourceByUrlPath: (urlPath: string): string | undefined => {
      const normalized = urlPath.startsWith('/') ? urlPath : `/${urlPath}`
      /* Try exact match first, then without trailing slash */
      const exact = state.urlToSourceMap.get(normalized)
      if (exact) {
        return exact
      }
      if (normalized.endsWith('/')) {
        return state.urlToSourceMap.get(normalized.slice(0, -1))
      }
      return state.urlToSourceMap.get(`${normalized}/`)
    },
    getUrl: (fsPath: string): string | undefined => {
      const urlPath = state.pathMap.get(fsPath)
      if (!urlPath || !state.baseUrl) {
        return undefined
      }
      /* Normalize slashes: baseUrl never has trailing /, urlPath may or may not start with / */
      const base = state.baseUrl.replace(/\/$/, '')
      if (urlPath.startsWith('/')) {
        return `${base}${urlPath}`
      }
      return `${base}/${urlPath}`
    },
    isTracked: (fsPath: string): boolean => state.pathMap.has(fsPath),
    reload,
    onDidChange: emitter.event,
    dispose: (): void => {
      watcher.dispose()
      emitter.dispose()
    },
  }
}

export { createManifestReader }
export type { ManifestReader }
