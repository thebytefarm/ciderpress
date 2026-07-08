import fs from 'node:fs/promises'
import path from 'node:path'

import type { CiderpressConfig } from '@ciderpress/config'
import { buildTemplate, createRegistry, getBuiltInTemplates } from '@ciderpress/templates'
import type { Template, TemplateRegistry } from '@ciderpress/templates'
import { groupBy } from 'massaman/array'
import { attemptAsync } from 'massaman/control'
import { isString } from 'massaman/predicate'

import { splitFrontmatter } from './matter.ts'
import type { Paths } from './paths.ts'

/**
 * A resolved template with its origin, ready for display.
 */
export interface ResolvedTemplate {
  readonly template: Template
  /** `'built-in'` for bundled templates, otherwise the source file path. */
  readonly source: 'built-in' | string
  readonly overridesBuiltIn: boolean
}

/**
 * A template-loading problem, flattened to a single presentable shape across
 * directory-read, frontmatter-parse, and template-validation failures.
 */
export interface TemplateIssue {
  /** File or directory path, relative to the repo root. */
  readonly file: string
  readonly type: string
  readonly message: string
}

/**
 * The outcome of resolving templates from config: the effective registry
 * (built-ins overridden by user templates), the display list, and any issues.
 */
export interface ResolvedTemplates {
  readonly registry: TemplateRegistry
  readonly resolved: readonly ResolvedTemplate[]
  readonly issues: readonly TemplateIssue[]
}

/**
 * Resolve documentation templates by merging the built-ins with any user
 * templates declared via `config.templates`. User templates whose type (their
 * filename stem) matches a built-in override it.
 *
 * Never throws — directory, parse, and validation failures are collected into
 * `issues` so callers can present them (used by `templates list/check` and
 * `check`). `draft` treats a missing/empty `templates` config as built-ins only.
 *
 * @param input - The configured template dir(s) and resolved project paths
 * @returns The effective registry, a display list, and any loading issues
 */
export async function resolveTemplates(input: {
  readonly templates: string | readonly string[] | undefined
  readonly paths: Paths
}): Promise<ResolvedTemplates> {
  const { templates, paths } = input
  const dirs = normalizeDirs(templates)

  const dirResults = await Promise.all(
    dirs.map((dir) => loadDir({ repoRoot: paths.repoRoot, dir }))
  )
  const loadedAll = dirResults.flatMap((result) => result.loaded)
  const dirIssues = dirResults.flatMap((result) => result.issues)

  const { unique, issues: duplicateIssues } = dedupeByType(loadedAll)
  const userTemplates = unique.map((entry) => entry.template)

  const registry = createRegistry().merge(createRegistry(userTemplates))
  const resolved = buildResolvedList(unique)

  return { registry, resolved, issues: [...dirIssues, ...duplicateIssues] }
}

/**
 * Extract the `templates` field from a possibly-null config, for callers that
 * tolerate a failed config load by falling back to built-ins only.
 *
 * @param config - The loaded config, or null when loading failed
 * @returns The configured template dir(s), or undefined
 */
export function configTemplates(
  config: CiderpressConfig | null
): string | readonly string[] | undefined {
  if (config === null) {
    return undefined
  }
  return config.templates
}

/**
 * A user template successfully loaded from a file.
 */
interface LoadedTemplate {
  readonly template: Template
  readonly file: string
}

/**
 * Discriminated outcome of loading a single template file.
 */
type FileOutcome =
  | { readonly kind: 'ok'; readonly loaded: LoadedTemplate }
  | { readonly kind: 'issue'; readonly issue: TemplateIssue }

/**
 * Normalize the `templates` config field into an array of directory paths.
 *
 * @private
 * @param templates - The raw config value (string, array, or undefined)
 * @returns An array of directory paths (empty when unset)
 */
function normalizeDirs(templates: string | readonly string[] | undefined): readonly string[] {
  if (templates === undefined) {
    return []
  }
  if (isString(templates)) {
    return [templates]
  }
  return templates
}

/**
 * Map a filename to its supported template extension.
 *
 * @private
 * @param filename - The file name to inspect
 * @returns The extension, or null when unsupported
 */
function toExtension(filename: string): '.md' | '.mdx' | null {
  if (filename.endsWith('.mdx')) {
    return '.mdx'
  }
  if (filename.endsWith('.md')) {
    return '.md'
  }
  return null
}

/**
 * Load every supported template file from a single directory.
 *
 * @private
 * @param input - Repo root and the (relative) template directory
 * @returns Loaded templates and any per-file or directory-read issues
 */
async function loadDir(input: { readonly repoRoot: string; readonly dir: string }): Promise<{
  readonly loaded: readonly LoadedTemplate[]
  readonly issues: readonly TemplateIssue[]
}> {
  const { repoRoot, dir } = input
  const absDir = path.resolve(repoRoot, dir)

  const read = await attemptAsync(() => fs.readdir(absDir, { withFileTypes: true }))
  if (!read.ok) {
    return {
      loaded: [],
      issues: [
        {
          file: dir,
          type: 'read_error',
          message: `Cannot read templates directory: ${read.error.message}`,
        },
      ],
    }
  }

  const candidates = read.value
    .filter((entry) => entry.isFile())
    .map((entry) => ({ name: entry.name, extension: toExtension(entry.name) }))
    .flatMap((candidate) => {
      if (candidate.extension === null) {
        return []
      }
      return [{ name: candidate.name, extension: candidate.extension }]
    })

  const outcomes = await Promise.all(
    candidates.map((candidate) =>
      loadTemplateFile({
        absPath: path.join(absDir, candidate.name),
        relPath: path.join(dir, candidate.name),
        extension: candidate.extension,
      })
    )
  )

  return {
    loaded: outcomes.flatMap((outcome) => {
      if (outcome.kind === 'ok') {
        return [outcome.loaded]
      }
      return []
    }),
    issues: outcomes.flatMap((outcome) => {
      if (outcome.kind === 'issue') {
        return [outcome.issue]
      }
      return []
    }),
  }
}

/**
 * Read, parse, and validate a single template file.
 *
 * @private
 * @param input - Absolute path, repo-relative path, and resolved extension
 * @returns A discriminated `FileOutcome`
 */
async function loadTemplateFile(input: {
  readonly absPath: string
  readonly relPath: string
  readonly extension: '.md' | '.mdx'
}): Promise<FileOutcome> {
  const { absPath, relPath, extension } = input

  const read = await attemptAsync(() => fs.readFile(absPath, 'utf8'))
  if (!read.ok) {
    return {
      kind: 'issue',
      issue: { file: relPath, type: 'read_error', message: read.error.message },
    }
  }

  const [matterError, matter] = splitFrontmatter(read.value)
  if (matterError) {
    return {
      kind: 'issue',
      issue: { file: relPath, type: matterError.type, message: matterError.message },
    }
  }

  const type = path.basename(relPath, extension)
  const [buildError, template] = buildTemplate({
    type,
    data: matter.data,
    content: matter.content,
    extension,
  })
  if (buildError) {
    return {
      kind: 'issue',
      issue: { file: relPath, type: buildError.type, message: buildError.message },
    }
  }

  return { kind: 'ok', loaded: { template, file: relPath } }
}

/**
 * Drop user templates that collide on type (filename stem), keeping the first
 * and reporting the rest as `duplicate_type` issues.
 *
 * @private
 * @param loaded - All user templates loaded across directories
 * @returns The unique templates and duplicate-collision issues
 */
function dedupeByType(loaded: readonly LoadedTemplate[]): {
  readonly unique: readonly LoadedTemplate[]
  readonly issues: readonly TemplateIssue[]
} {
  const groups = groupBy(loaded, (entry) => entry.template.type)
  const grouped = Object.values(groups)

  const unique = grouped.flatMap((group) => {
    const [first] = group
    if (first === undefined) {
      return []
    }
    return [first]
  })

  const issues = grouped.flatMap((group) => {
    const [first, ...rest] = group
    if (first === undefined) {
      return []
    }
    return rest.map((duplicate) => ({
      file: duplicate.file,
      type: 'duplicate_type',
      message: `Duplicate template type "${duplicate.template.type}" (already defined in ${first.file})`,
    }))
  })

  return { unique, issues }
}

/**
 * Build the display list: built-ins not overridden by a user template, followed
 * by user templates (flagged when they override a built-in).
 *
 * @private
 * @param unique - The deduplicated user templates
 * @returns The ordered list of resolved templates
 */
function buildResolvedList(unique: readonly LoadedTemplate[]): readonly ResolvedTemplate[] {
  const builtIns = getBuiltInTemplates()
  const builtInTypes = new Set(Object.keys(builtIns))
  const userTypes = new Set(unique.map((entry) => entry.template.type))

  const builtInResolved = Object.values(builtIns)
    .filter((template) => !userTypes.has(template.type))
    .map((template) => ({ template, source: 'built-in' as const, overridesBuiltIn: false }))

  const userResolved = unique.map((entry) => ({
    template: entry.template,
    source: entry.file,
    overridesBuiltIn: builtInTypes.has(entry.template.type),
  }))

  return [...builtInResolved, ...userResolved]
}
