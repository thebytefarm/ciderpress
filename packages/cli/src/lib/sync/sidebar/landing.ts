import { resolveOptionalIcon, serializeIcon } from '@ciderpress/config'
import type { DescriptionFallback, IconColor, SerializedIcon } from '@ciderpress/config'
import { match, P } from 'massaman/match'
import { isNotNil, isString } from 'massaman/predicate'

import { extractFileDescription } from '../resolve/description.ts'
import type { ResolvedEntry } from '../types.ts'

/**
 * Input data for building a workspace card JSX string.
 */
export interface WorkspaceCardData {
  /**
   * Card link target.
   */
  readonly link: string
  /**
   * Display name for the card.
   */
  readonly title: string
  /**
   * Icon config — Iconify identifier string, `{ id, color }` object, or
   * `{ kind: 'image', src, alt }` for a static image asset.
   */
  readonly icon?: SerializedIcon
  /**
   * Scope label shown above the name (e.g. 'apps/').
   */
  readonly scope?: string
  /**
   * Short description shown on the card.
   */
  readonly description?: string
  /**
   * Technology tags — kebab-case tag keys resolved by UI TechTag.
   */
  readonly tags?: readonly string[]
  /**
   * Deploy badge image.
   */
  readonly badge?: { readonly src: string; readonly alt: string }
  /**
   * Whether this entry has sub-items (used for default icon selection).
   */
  readonly hasChildren?: boolean
}

/**
 * Generate section landing page MDX from resolved children.
 *
 * Uses **workspace cards** when any child has `card` metadata
 * (richer cards with scope, tags, deploy badges — like the homepage).
 * Falls back to **section cards** (simple icon + title + description).
 *
 * @param sectionText - Section heading text
 * @param description - Optional section description
 * @param children - Resolved child entries
 * @param iconColor - Color theme for section card icons
 * @param fallback - Strategy for sourcing a card description from prose
 *   when a child's file has no frontmatter `description`
 * @returns MDX string with React component imports and JSX elements
 */
export async function generateLandingContent(
  sectionText: string,
  description: string | undefined,
  children: readonly ResolvedEntry[],
  iconColor: IconColor,
  fallback: DescriptionFallback
): Promise<string> {
  const visible = children.filter((c) => !c.hidden && c.link)
  const useWorkspace = visible.some((c) => c.card)

  const descLine = match(description)
    .with(P.nonNullable, (d) => `\n${d}\n`)
    .otherwise(() => '')

  const imports =
    'import { WorkspaceCard, WorkspaceGrid, SectionCard, SectionGrid } from ' +
    "'@ciderpress/ui/theme'\n\n"

  if (useWorkspace) {
    const cards = await Promise.all(visible.map((child) => buildWorkspaceCard(child, fallback)))
    const grid = cards.join('\n')
    return `${imports}# ${sectionText}\n${descLine}\n<WorkspaceGrid>\n${grid}\n</WorkspaceGrid>\n`
  }

  const cards = await Promise.all(
    visible.map((child) => buildSectionCard(child, iconColor, fallback))
  )
  const grid = cards.join('\n')
  return `${imports}# ${sectionText}\n${descLine}\n<SectionGrid>\n${grid}\n</SectionGrid>\n`
}

/**
 * Build a workspace card JSX string from structured data.
 *
 * Shared builder used by both the landing page generator (for resolved entries)
 * and the workspace module (for WorkspaceItem arrays).
 *
 * @param data - Card data with link, text, icon, tags, etc.
 * @returns JSX string for a single WorkspaceCard component
 */
export function buildWorkspaceCardJsx(data: WorkspaceCardData): string {
  const defaultIcon = match(data.hasChildren === true)
    .with(true, () => 'pixelarticons:folder')
    .otherwise(() => 'pixelarticons:file')
  const icon = data.icon ?? defaultIcon

  const props: readonly string[] = [
    `title="${escapeJsxProp(data.title)}"`,
    `href="${data.link}"`,
    ...serializeIconProp(icon),
    ...maybeScopeProp(data.scope),
    ...maybeDescriptionProp(data.description),
    ...maybeTagsProp(data.tags),
    ...maybeBadgeProp(data.badge),
  ]

  return `  <WorkspaceCard ${props.join(' ')} />`
}

/**
 * Build a workspace card JSX string from a resolved entry with card metadata.
 *
 * @private
 * @param entry - Resolved entry with card metadata
 * @param fallback - Strategy for sourcing a description from prose
 * @returns JSX string for a WorkspaceCard component
 */
async function buildWorkspaceCard(
  entry: ResolvedEntry,
  fallback: DescriptionFallback
): Promise<string> {
  const card = entry.card ?? {}
  const description = card.description ?? (await resolveDescription(entry, fallback))
  const resolved = resolveOptionalIcon(card.icon)

  return buildWorkspaceCardJsx({
    link: entry.link ?? '',
    title: entry.title,
    icon: serializeIcon(resolved),
    scope: card.scope,
    description,
    tags: card.tags,
    badge: card.badge,
    hasChildren: isNotNil(entry.items) && entry.items.length > 0,
  })
}

/**
 * Build a section card JSX string from a resolved entry.
 *
 * @private
 * @param entry - Resolved entry to render as a card
 * @param iconColor - Color theme for the icon
 * @param fallback - Strategy for sourcing a description from prose
 * @returns JSX string for a single SectionCard component
 */
async function buildSectionCard(
  entry: ResolvedEntry,
  iconColor: IconColor,
  fallback: DescriptionFallback
): Promise<string> {
  const hasChildren = entry.items && entry.items.length > 0
  const iconId = match(hasChildren)
    .with(true, () => 'pixelarticons:folder')
    .otherwise(() => 'pixelarticons:file')
  const icon: SerializedIcon = match(iconColor)
    .with('purple', () => iconId as SerializedIcon)
    .otherwise(() => ({ id: iconId, color: iconColor }) as SerializedIcon)
  const card = entry.card ?? {}
  const description = card.description ?? (await resolveDescription(entry, fallback))

  const baseProps = [
    `href="${entry.link}"`,
    `title="${escapeJsxProp(entry.title)}"`,
    ...serializeIconProp(icon),
  ]
  const descriptionProps = match(description)
    .with(P.string, (d) => [`description="${escapeJsxProp(d)}"`])
    .otherwise(() => [] as string[])
  const allProps = [...baseProps, ...descriptionProps]

  return `  <SectionCard ${allProps.join(' ')} />`
}

/**
 * Resolve a description for a card.
 * Priority: source file frontmatter/prose > resolved config/group description.
 *
 * Card-level `card.description` overrides are applied by the callers
 * ({@link buildWorkspaceCard} / {@link buildSectionCard}) before this runs.
 *
 * @private
 * @param entry - Resolved entry to extract description from
 * @param fallback - Strategy for sourcing a description from prose
 * @returns Description string, or undefined if none found
 */
async function resolveDescription(
  entry: ResolvedEntry,
  fallback: DescriptionFallback
): Promise<string | undefined> {
  if (isNotNil(entry.page) && isNotNil(entry.page.source)) {
    const desc = await extractFileDescription(entry.page.source, fallback)
    if (isNotNil(desc)) {
      return desc
    }
  }

  // Resolved config/group description as fallback (virtual page, or file
  // with no description). Populated by the resolve layer for group entries.
  if (isNotNil(entry.description)) {
    return entry.description
  }

  return undefined
}

/**
 * Escape special characters in JSX prop values.
 *
 * @private
 * @param str - Raw string to escape for use in JSX attribute values
 * @returns Escaped string safe for JSX prop interpolation
 */
function escapeJsxProp(str: string): string {
  // Backslash must escape first, otherwise the entity-replacement passes below
  // would multiply existing backslashes. Without this, a trailing odd-count
  // backslash (`alt: 'x\\'`) escapes the closing `"` of the emitted JSX
  // attribute and the parser swallows the next character into the string —
  // adjacent props become part of the value or the build errors confusingly.
  return str
    .replaceAll('\\', String.raw`\\`)
    .replaceAll('"', '&quot;')
    .replaceAll('{', '&#123;')
    .replaceAll('}', '&#125;')
}

/**
 * Serialize a unified icon config into JSX prop strings.
 *
 * - String → `icon="prefix:name"`
 * - Object → `icon={{ id: "prefix:name", color: "blue" }}`
 *
 * @private
 * @param icon - Icon config value (string or object)
 * @returns Array with the icon JSX prop string
 */
function serializeIconProp(icon: SerializedIcon): readonly string[] {
  if (isString(icon)) {
    return [`icon="${icon}"`]
  }
  // Match on the discriminant value rather than `'kind' in icon` so a
  // future variant that also carries a `kind` field (or a malformed
  // runtime input) can't silently slip into the image branch.
  return match(icon)
    .with({ kind: 'image' }, (img) => {
      const src = escapeJsxProp(img.src)
      const alt = escapeJsxProp(img.alt)
      return [`icon={{ kind: "image", src: "${src}", alt: "${alt}" }}`]
    })
    .otherwise((i) => [`icon={{ id: "${i.id}", color: "${i.color}" }}`])
}

/**
 * Return a scope JSX prop array if scope is defined.
 *
 * @private
 * @param scope - Optional scope string
 * @returns Array with scope prop string, or empty
 */
function maybeScopeProp(scope: string | undefined): readonly string[] {
  if (scope) {
    return [`scope="${escapeJsxProp(scope)}"`]
  }
  return []
}

/**
 * Return a description JSX prop array if description is defined.
 *
 * @private
 * @param description - Optional description string
 * @returns Array with description prop string, or empty
 */
function maybeDescriptionProp(description: string | undefined): readonly string[] {
  if (description) {
    return [`description="${escapeJsxProp(description)}"`]
  }
  return []
}

/**
 * Return a tags JSX prop array if tags are present and non-empty.
 *
 * @private
 * @param tags - Optional array of tag strings
 * @returns Array with tags prop string, or empty
 */
function maybeTagsProp(tags: readonly string[] | undefined): readonly string[] {
  if (tags && tags.length > 0) {
    return [`tags={${JSON.stringify(tags)}}`]
  }
  return []
}

/**
 * Return a badge JSX prop array if badge is defined.
 *
 * @private
 * @param badge - Optional badge object with src and alt
 * @returns Array with badge prop string, or empty
 */
function maybeBadgeProp(
  badge: { readonly src: string; readonly alt: string } | undefined
): readonly string[] {
  if (badge) {
    return [`badge={${JSON.stringify(badge)}}`]
  }
  return []
}
