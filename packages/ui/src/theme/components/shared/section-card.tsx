import type { BadgeConfig } from '@ciderpress/config'
import { match, P } from 'massaman/match'
import type React from 'react'

import { useCiderpress } from '../../hooks/use-ciderpress'
import { BadgeChips } from '../sidebar/sidebar-badge'
import { Card } from './card'
import { CardIcon } from './card-icon'
import type { CardIconInput } from './resolve-card-icon'
import { resolveCardIcon } from './resolve-card-icon'

export interface SectionCardProps {
  readonly href: string
  readonly title: string
  readonly description?: string
  readonly icon?: CardIconInput
}

/**
 * Section card — simple icon + title + description link card
 * used on auto-generated section landing pages.
 *
 * @param props - Props with href, title, optional description and icon
 * @returns React element with a linked section card
 */
export function SectionCard({
  href,
  title,
  description,
  icon = 'pixelarticons:file',
}: SectionCardProps): React.ReactElement {
  const { pageBadges } = useCiderpress()
  const badges = lookupBadges({ pageBadges, href })
  const resolved = resolveCardIcon(icon) ?? {
    kind: 'iconify' as const,
    id: 'pixelarticons:file',
    color: 'purple',
  }
  const descEl = match(description)
    .with(P.nonNullable, (d) => <span className="cp-section-card__desc">{d}</span>)
    .otherwise(() => null)

  return (
    <Card href={href} className="cp-section-card">
      <div className="cp-section-card__header">
        <CardIcon resolved={resolved} className="cp-section-card__icon" />
        <span className="cp-section-card__title">{title}</span>
        {badges.length > 0 && (
          <span className="cp-section-card__badges">
            <BadgeChips badges={badges} />
          </span>
        )}
      </div>
      {descEl}
    </Card>
  )
}

/**
 * Look up a page's badges from the route→badges map by its href.
 *
 * @private
 * @param params - The route→badges map (if present) and card destination.
 * @returns The page's badges, or an empty array when none apply
 */
function lookupBadges(params: {
  readonly pageBadges: Record<string, readonly BadgeConfig[]> | undefined
  readonly href: string
}): readonly BadgeConfig[] {
  const { pageBadges, href } = params
  if (pageBadges === undefined) {
    return []
  }
  return pageBadges[href] ?? []
}
