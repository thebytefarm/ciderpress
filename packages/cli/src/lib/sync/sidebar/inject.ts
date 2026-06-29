import { ICON_COLORS, resolveOptionalIcon, serializeIcon } from '@ciderpress/config'
import type { IconColor, Page, Workspace } from '@ciderpress/config'
import { match, P } from 'massaman/match'
import { isNil, isNotNil } from 'massaman/predicate'

import { linkToOutputPath } from '../resolve/path.ts'
import type { ResolvedEntry } from '../types.ts'
import { buildWorkspaceCardJsx, generateLandingContent } from './landing.ts'

/**
 * Walk the resolved tree and inject virtual landing pages
 * for any section that has a `link` and children but no page of its own.
 *
 * Landing pages with React components use `.mdx` extension;
 * simple text pages stay as `.md`.
 *
 * Pure: returns a new tree rather than mutating `entries`. The recursion
 * threads `colorIndex` through each call so cycling icon colors remain
 * deterministic without a mutable counter.
 *
 * @param entries - Resolved entry tree to walk
 * @param configSections - Original config pages for metadata lookup
 * @param workspaces - Workspace items for generating workspace landing pages
 * @returns New resolved entry tree with landing pages injected
 */
export function injectLandingPages(
  entries: readonly ResolvedEntry[],
  configSections: readonly Page[],
  workspaces: readonly Workspace[]
): readonly ResolvedEntry[] {
  const { entries: result } = injectMany({
    entries,
    configSections,
    workspaces,
    colorIndex: 0,
  })
  return result
}

/**
 * Recursion frame for `injectMany` / `injectOne`. Threads the current
 * `colorIndex` through the tree so cycling icon colors stay deterministic
 * without a mutable counter.
 *
 * @private
 */
interface InjectFrame {
  readonly entries: readonly ResolvedEntry[]
  readonly configSections: readonly Page[]
  readonly workspaces: readonly Workspace[]
  readonly colorIndex: number
}

/**
 * Result of an `injectMany` / `injectOne` pass — the rebuilt subtree
 * and the next color-index the parent should use for its next child.
 *
 * @private
 */
interface InjectResult {
  readonly entries: readonly ResolvedEntry[]
  readonly nextColorIndex: number
}

/**
 * Recursively inject landing pages across an array of entries, threading
 * the color index so siblings continue cycling from where the previous
 * sibling left off.
 *
 * @private
 * @param frame - Current recursion state (entries + threaded color index)
 * @returns Rebuilt entry array and the next available color index
 */
function injectMany(frame: InjectFrame): InjectResult {
  return frame.entries.reduce<InjectResult>(
    (acc, entry) => {
      const { entry: rebuilt, nextColorIndex } = injectOne({
        entry,
        configSections: frame.configSections,
        workspaces: frame.workspaces,
        colorIndex: acc.nextColorIndex,
      })
      return {
        entries: [...acc.entries, rebuilt],
        nextColorIndex,
      }
    },
    { entries: [], nextColorIndex: frame.colorIndex }
  )
}

/**
 * Frame for a single-entry inject pass.
 *
 * @private
 */
interface InjectOneFrame {
  readonly entry: ResolvedEntry
  readonly configSections: readonly Page[]
  readonly workspaces: readonly Workspace[]
  readonly colorIndex: number
}

/**
 * Result of injecting a single entry — the rebuilt entry and the next
 * color index after any landing-page color was consumed.
 *
 * @private
 */
interface InjectOneResult {
  readonly entry: ResolvedEntry
  readonly nextColorIndex: number
}

/**
 * Rebuild a single entry with an injected landing page when applicable.
 * Recurses into `entry.items` so the entire subtree is replaced rather
 * than mutated.
 *
 * @private
 * @param frame - Current single-entry inject frame
 * @returns Rebuilt entry and next color index
 */
function injectOne(frame: InjectOneFrame): InjectOneResult {
  const { entry, configSections, workspaces, colorIndex } = frame

  // Recurse into children first so the rebuilt subtree is available when
  // we decide whether to inject a landing page for this entry.
  const childResult = match(entry.items)
    .with(P.nonNullable, (items) =>
      injectMany({ entries: items, configSections, workspaces, colorIndex })
    )
    .otherwise(() => ({
      entries: undefined as readonly ResolvedEntry[] | undefined,
      nextColorIndex: colorIndex,
    }))

  const baseEntry: ResolvedEntry = match(childResult.entries)
    .with(P.nonNullable, (children) => ({ ...entry, items: children }))
    .otherwise(() => entry)

  const shouldInject = Boolean(entry.link) && !entry.page && entry.landing !== false
  if (!shouldInject) {
    return { entry: baseEntry, nextColorIndex: childResult.nextColorIndex }
  }

  const link = entry.link as string
  const configSection = findConfigSection(configSections, link)
  const description: string | undefined = resolveDescription(configSection)
  const rebuiltItems = childResult.entries
  const hasSelfLinkedChild = checkHasSelfLinkedChild(rebuiltItems, link)

  if (rebuiltItems && rebuiltItems.length > 0 && !hasSelfLinkedChild) {
    const color: IconColor = ICON_COLORS[childResult.nextColorIndex % ICON_COLORS.length]
    const children = rebuiltItems
    const page: ResolvedEntry['page'] = {
      content: () => generateLandingContent(entry.title, description, children, color),
      outputPath: linkToOutputPath(link).replace(/\.md$/, '.mdx'),
      frontmatter: {},
    }
    return {
      entry: { ...baseEntry, page },
      nextColorIndex: childResult.nextColorIndex + 1,
    }
  }

  if (!rebuiltItems || rebuiltItems.length === 0) {
    const matching = workspaces.filter((item) => item.path.startsWith(`${link}/`))
    if (matching.length > 0) {
      const segments = link.split('/')
      const lastSegment = segments.findLast((seg) => seg.length > 0)
      const scope = `${lastSegment}/`
      const page: ResolvedEntry['page'] = {
        content: () => generateWorkspaceLandingPage(entry.title, description, matching, scope),
        outputPath: linkToOutputPath(link).replace(/\.md$/, '.mdx'),
        frontmatter: {},
      }
      return { entry: { ...baseEntry, page }, nextColorIndex: childResult.nextColorIndex }
    }

    const exact = workspaces.find((item) => item.path === link)
    if (exact) {
      const titleStr = match(exact.title)
        .with(P.string, (t) => t)
        .otherwise(String)
      const page: ResolvedEntry['page'] = {
        content: () => `# ${titleStr}\n\n${exact.description}\n`,
        outputPath: linkToOutputPath(link),
        frontmatter: {},
      }
      return { entry: { ...baseEntry, page }, nextColorIndex: childResult.nextColorIndex }
    }
  }

  return { entry: baseEntry, nextColorIndex: childResult.nextColorIndex }
}

/**
 * Generate a workspace-style landing page MDX from workspace items.
 *
 * @private
 * @param heading - Page heading
 * @param description - Optional description below heading
 * @param items - Workspace items to render as cards
 * @param scopePrefix - Scope label for cards (e.g. 'apps/')
 * @returns MDX string with React component imports and JSX elements
 */
function generateWorkspaceLandingPage(
  heading: string,
  description: string | undefined,
  items: readonly Workspace[],
  scopePrefix: string
): string {
  const imports = "import { WorkspaceCard, WorkspaceGrid } from '@ciderpress/ui/theme'\n\n"

  const cards = items.map((item) => {
    const tags: readonly string[] | undefined = resolveTags(item.tags)
    const resolved = resolveOptionalIcon(item.icon)
    const titleStr = match(item.title)
      .with(P.string, (t) => t)
      .otherwise(String)
    return buildWorkspaceCardJsx({
      link: item.path,
      title: titleStr,
      icon: serializeIcon(resolved),
      scope: scopePrefix,
      description: item.description,
      tags,
      badge: item.badge,
    })
  })

  const descLine = match(description)
    .with(P.nonNullable, (d) => `\n${d}\n`)
    .otherwise(() => '')

  return `${imports}# ${heading}\n${descLine}\n<WorkspaceGrid>\n${cards.join('\n')}\n</WorkspaceGrid>\n`
}

/**
 * Look up the original config Page by link for extracting metadata.
 *
 * @private
 * @param sections - Config pages to search
 * @param link - Link path to match
 * @returns Matching page, or undefined
 */
function findConfigSection(sections: readonly Page[], link: string): Page | undefined {
  const direct = sections.find((section) => section.path === link)
  if (direct) {
    return direct
  }
  const nested = sections
    .filter((section) => isNotNil(section.pages))
    .map((section) => findConfigSection(section.pages as readonly Page[], link))
    .find((result) => isNotNil(result))
  return nested
}

/**
 * Extract description from a config page.
 *
 * @private
 * @param configSection - Optional config page
 * @returns Description string, or undefined
 */
function resolveDescription(configSection: Page | undefined): string | undefined {
  if (isNil(configSection)) {
    return undefined
  }

  if (configSection.description) {
    return configSection.description
  }

  return undefined
}

/**
 * Check if any child entry has the same link as the parent.
 *
 * @private
 * @param items - Optional child entries
 * @param link - Parent link to check against
 * @returns True if a child has the same link
 */
function checkHasSelfLinkedChild(
  items: readonly ResolvedEntry[] | undefined,
  link: string | undefined
): boolean {
  if (items) {
    return items.some((child) => child.link === link)
  }
  return false
}

/**
 * Copy tags array, or return undefined if not present.
 *
 * @private
 * @param tags - Optional tags array
 * @returns Copied tags array or undefined
 */
function resolveTags(tags: readonly string[] | undefined): readonly string[] | undefined {
  if (tags) {
    return [...tags]
  }
  return undefined
}
