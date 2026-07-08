/**
 * Sidebar badge rendering — overrides Rspress's `Tag` component.
 *
 * Rspress renders `<Tag tag={...} />` inside every sidebar item. Ciderpress
 * encodes page badges (label + variant + tooltip) into that `tag` string via
 * `@ciderpress/config`'s `encodeBadges`. This override decodes ciderpress
 * badges and renders styled chips; any other tag falls through to Rspress's
 * native `Tag` so existing tag behavior (images, keyword badges) is preserved.
 */

import { decodeBadges } from '@ciderpress/config'
import type { BadgeConfig, BadgeVariant } from '@ciderpress/config'
import { Tag as RspressTag } from '@rspress/core/theme-original'
import { match, P } from 'massaman/match'
import type React from 'react'

/**
 * Props mirror Rspress's `Tag` — a single (optional) tag string.
 *
 * @private
 */
interface TagProps {
  readonly tag?: string
}

/**
 * Sidebar tag renderer. Renders ciderpress badge chips for encoded tags,
 * delegating everything else to Rspress's native `Tag`.
 *
 * @param props - The sidebar item's tag string
 * @returns Badge chips, a native tag, or `null` when there is no tag
 */
export function Tag({ tag }: TagProps): React.ReactElement | null {
  const badges = decodeTag(tag)
  if (badges === null) {
    return <RspressTag tag={tag} />
  }
  return <BadgeChips badges={badges} />
}

/**
 * Props for {@link BadgeChips}.
 */
export interface BadgeChipsProps {
  readonly badges: readonly BadgeConfig[]
}

/**
 * Render a list of badge chips (variant color, custom-color tint, hover
 * tooltip). Used by the sidebar `Tag` override and the breadcrumb bar.
 *
 * @param props - The badges to render
 * @returns Chip elements, or `null` when there are no badges
 */
export function BadgeChips({ badges }: BadgeChipsProps): React.ReactElement | null {
  if (badges.length === 0) {
    return null
  }
  return (
    <>
      {badges.map((badge, index) => (
        <SidebarBadge key={`${badge.text}-${String(index)}`} badge={badge} />
      ))}
    </>
  )
}

/**
 * Decode a tag string into ciderpress badges, or `null` when the tag is
 * absent or not ciderpress-encoded.
 *
 * @private
 * @param tag - Raw tag string from the sidebar item
 * @returns Decoded badges, or `null` to signal native fallback
 */
function decodeTag(tag: string | undefined): readonly BadgeConfig[] | null {
  if (tag === undefined) {
    return null
  }
  return decodeBadges(tag)
}

/**
 * A single sidebar badge chip.
 *
 * @private
 */
interface SidebarBadgeProps {
  readonly badge: BadgeConfig
}

/**
 * Render one badge chip with variant color (or a custom color tint) and a
 * hover tooltip.
 *
 * @private
 * @param props - The badge to render
 * @returns A styled badge chip element
 */
function SidebarBadge({ badge }: SidebarBadgeProps): React.ReactElement {
  const tooltip = resolveTooltip(badge)
  return match(badge.color)
    .with(P.string, (color) => (
      <span className="cp-sbadge" style={{ color, backgroundColor: tint(color) }} title={tooltip}>
        {badge.text}
      </span>
    ))
    .otherwise(() => (
      <span className={variantClass(badge.variant)} title={tooltip}>
        {badge.text}
      </span>
    ))
}

/**
 * Resolve the hover tooltip for a badge, defaulting to its label text.
 *
 * @private
 * @param badge - The badge to resolve a tooltip for
 * @returns The tooltip string
 */
function resolveTooltip(badge: BadgeConfig): string {
  return badge.tooltip ?? badge.text
}

/**
 * Map a badge variant to its chip class, defaulting to `neutral`.
 *
 * @private
 * @param variant - The badge variant, if any
 * @returns The full class string for the chip
 */
function variantClass(variant: BadgeVariant | undefined): string {
  return match(variant)
    .with('info', () => 'cp-sbadge cp-sbadge--info')
    .with('success', () => 'cp-sbadge cp-sbadge--success')
    .with('warning', () => 'cp-sbadge cp-sbadge--warning')
    .with('danger', () => 'cp-sbadge cp-sbadge--danger')
    .with('neutral', () => 'cp-sbadge cp-sbadge--neutral')
    .with(undefined, () => 'cp-sbadge cp-sbadge--neutral')
    .exhaustive()
}

/**
 * Build a subtle background tint from a custom color.
 *
 * @private
 * @param color - CSS color value
 * @returns A `color-mix` background at low opacity
 */
function tint(color: string): string {
  return `color-mix(in srgb, ${color} 14%, transparent)`
}
