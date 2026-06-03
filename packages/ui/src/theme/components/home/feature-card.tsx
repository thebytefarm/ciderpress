import { match, P } from 'massaman/match'
import type React from 'react'

import './feature-card.css'
import { Card } from '../shared/card'
import { Icon } from '../shared/icon'
import { resolveCardIcon } from '../shared/resolve-card-icon'

export interface FeatureCardProps {
  readonly title: string
  readonly description: string
  readonly href?: string
  readonly icon?: string | { readonly id: string; readonly color: string }
  readonly span?: 2 | 3 | 4 | 6
  readonly titleLines?: number
  readonly descriptionLines?: number
}

/**
 * Frontmatter-shaped data for consumers to map from.
 */
export interface FeatureItem {
  readonly title: string
  readonly details: string
  readonly link?: string
  readonly icon?: string | { readonly id: string; readonly color: string }
  readonly span?: 2 | 3 | 4 | 6
}

/**
 * Feature card for landing pages — matches the workspace/section card design.
 * Renders as `<a>` when `href` is provided, `<div>` otherwise.
 *
 * @param props - Feature card props including title, description, href, icon, span, titleLines, descriptionLines
 * @returns React element with feature card layout
 */
export function FeatureCard({
  title,
  description,
  href,
  icon,
  span = 4,
  titleLines,
  descriptionLines,
}: FeatureCardProps): React.ReactElement {
  const resolved = resolveCardIcon(icon)

  const iconEl = match(resolved)
    .with(P.nonNullable, (r) => (
      <span className={`cp-card__icon cp-card__icon--${r.color}`}>
        <Icon icon={r.id} />
      </span>
    ))
    .otherwise(() => null)

  const linkTail = match(href)
    .with(P.nonNullable, () => <span className="cp-feature-card__link">Learn more →</span>)
    .otherwise(() => null)

  return (
    <div className={`cp-feature-grid__item cp-feature-grid__item--span-${span}`}>
      <div className="cp-feature-grid__item-wrap">
        <Card href={href} className="cp-feature-card">
          <div className="cp-feature-card__header">
            {iconEl}
            <span
              className={clampClass('cp-feature-card__title', titleLines)}
              style={clampStyle(titleLines)}
            >
              {title}
            </span>
          </div>
          <span
            className={clampClass('cp-feature-card__desc', descriptionLines)}
            style={clampStyle(descriptionLines)}
          >
            {description}
          </span>
          {linkTail}
        </Card>
      </div>
    </div>
  )
}

interface FeatureGridProps {
  readonly children: React.ReactNode
}

/**
 * Flex-wrap layout container for feature cards.
 *
 * @param props - Props with children to render inside the grid
 * @returns React element wrapping children in a feature grid
 */
export function FeatureGrid({ children }: FeatureGridProps): React.ReactElement {
  return (
    <div className="cp-feature-section">
      <div className="cp-feature-grid">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

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
