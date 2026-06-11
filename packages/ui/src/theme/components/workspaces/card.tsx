import { match, P } from 'massaman/match'
import type React from 'react'

import { Card } from '../shared/card'
import { CardIcon } from '../shared/card-icon'
import type { CardIconInput } from '../shared/resolve-card-icon'
import { resolveCardIcon } from '../shared/resolve-card-icon'
import { TechTag } from '../shared/tech-tag'

export interface WorkspaceCardProps {
  /**
   * Display name for the card header.
   */
  readonly title: string
  /**
   * Link target (e.g. "/apps/api").
   */
  readonly href: string
  /**
   * Icon config — Iconify identifier string, `{ id, color }` object, or
   * `{ kind: 'image', src, alt }` for a static image asset.
   */
  readonly icon?: CardIconInput
  /**
   * Scope prefix shown above the name (e.g. "apps/").
   */
  readonly scope?: string
  /**
   * Short description rendered below the header.
   */
  readonly description?: string
  /**
   * Technology tag names resolved via the tech map.
   */
  readonly tags?: readonly string[]
  /**
   * Deploy badge image for the card header.
   */
  readonly badge?: { readonly src: string; readonly alt: string }
  /**
   * Max lines for the title before ellipsis truncation.
   */
  readonly titleLines?: number
  /**
   * Max lines for the description before ellipsis truncation.
   */
  readonly descriptionLines?: number
}

/**
 * Workspace card — renders a clickable link card with icon, name,
 * description, tech tags, and optional deploy badge.
 *
 * @param props - Props with title, href, and optional icon, scope, description, tags, badge, titleLines, descriptionLines
 * @returns React element with a workspace link card
 */
export function WorkspaceCard({
  title,
  href,
  icon,
  scope,
  description,
  tags,
  badge,
  titleLines,
  descriptionLines,
}: WorkspaceCardProps): React.ReactElement {
  const name = title.toLowerCase()
  const resolved = resolveCardIcon(icon)

  const iconEl = match(resolved)
    .with(P.nonNullable, (r) => <CardIcon resolved={r} className="cp-card__icon" />)
    .otherwise(() => null)

  const scopeEl = match(scope)
    .with(
      P.when((s): s is string => s !== undefined && s.length > 0),
      (s) => <span className="cp-workspace-card__scope">{s}</span>
    )
    .otherwise(() => null)

  const badgeEl = match(badge)
    .with(P.nonNullable, (b) => (
      <span className="cp-workspace-card__badge" title={`Deployed on ${b.alt}`}>
        <img src={b.src} alt={b.alt} className="cp-workspace-card__badge-logo" />
      </span>
    ))
    .otherwise(() => null)

  const descEl = match(description)
    .with(P.nonNullable, (d) => (
      <span
        className={clampClass('cp-workspace-card__desc', descriptionLines)}
        style={clampStyle(descriptionLines)}
      >
        {d}
      </span>
    ))
    .otherwise(() => null)

  const tagsEl = match(tags)
    .with(
      P.when((t): t is readonly string[] => t !== undefined && t.length > 0),
      (t) => (
        <div className="cp-workspace-card__tags">
          {t.map((tag) => (
            <TechTag key={tag} name={tag} />
          ))}
        </div>
      )
    )
    .otherwise(() => null)

  return (
    <Card href={href} className="cp-workspace-card">
      <div className="cp-workspace-card__header">
        <div className="cp-workspace-card__identity">
          {iconEl}
          <div className="cp-workspace-card__title">
            {scopeEl}
            <span
              className={clampClass('cp-workspace-card__name', titleLines)}
              style={clampStyle(titleLines)}
            >
              {name}
            </span>
          </div>
        </div>
        {badgeEl}
      </div>
      {descEl}
      {tagsEl}
    </Card>
  )
}

/**
 * Build a className string with optional `cp-clamp` suffix.
 *
 * @private
 * @param base - Base CSS class name
 * @param lines - Optional line clamp value
 * @returns Class string with or without cp-clamp
 */
function clampClass(base: string, lines: number | undefined): string {
  if (lines) {
    return `${base} cp-clamp`
  }
  return base
}

/**
 * Build an inline style object for line clamping.
 *
 * @private
 * @param lines - Optional line clamp value
 * @returns Style object with WebkitLineClamp or undefined
 */
function clampStyle(lines: number | undefined): React.CSSProperties | undefined {
  if (lines) {
    return { WebkitLineClamp: lines }
  }
  return undefined
}
