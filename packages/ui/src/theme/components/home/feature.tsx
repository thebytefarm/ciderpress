import type { TruncateConfig } from '@ciderpress/config'
import { match, P } from 'massaman/match'
import type React from 'react'

import { FeatureCard } from './feature-card'
import type { FeatureItem } from './feature-card'

interface FrontmatterFeaturesHeading {
  readonly label?: string
  readonly title?: string
  readonly body?: string
}

interface HomeFeatureProps {
  readonly items?: readonly FeatureItem[]
  readonly heading?: FrontmatterFeaturesHeading
  readonly columns?: 1 | 2 | 3 | 4
  readonly truncate?: TruncateConfig
}

const DEFAULT_HEADING_EYEBROW = 'Features'
const DEFAULT_HEADING_TITLE = 'Built for the way you ship.'
const DEFAULT_HEADING_SUBTITLE =
  "Everything you need, nothing you don't. Configured in TypeScript, validated at boot."

/**
 * Features grid block. Renders the supplied feature cards under a heading,
 * or nothing when no cards are present.
 *
 * @param props - Resolved feature cards, optional heading, and truncation limits.
 * @returns React element with the feature grid, or null.
 */
export function HomeFeature(props: HomeFeatureProps): React.ReactElement | null {
  const { items, heading, columns, truncate } = props
  // Frontmatter is unvalidated user content — a `heading.title: {}`
  // would otherwise render as `[object Object]` in the H2. Treat any
  // non-string value as missing and fall through to the framework default.
  const headingEyebrow = match(heading && heading.label)
    .with(P.string, (s) => s)
    .otherwise(() => DEFAULT_HEADING_EYEBROW)
  const headingTitle = match(heading && heading.title)
    .with(P.string, (s) => s)
    .otherwise(() => DEFAULT_HEADING_TITLE)
  const headingSubtitle = match(heading && heading.body)
    .with(P.string, (s) => s)
    .otherwise(() => DEFAULT_HEADING_SUBTITLE)
  // Column count rides on a custom property so the grid keeps its CSS
  // media queries — a narrow viewport still collapses to one column.
  const gridStyle = match(columns)
    .with(P.number, (c) => ({ '--cp-feature-cols': String(c) }) as React.CSSProperties)
    .otherwise(() => undefined)

  return match(items)
    .with(
      P.when((f): f is readonly FeatureItem[] => Array.isArray(f) && f.length > 0),
      (list) => (
        <div className="cp-feature-section">
          <div className="cp-feature-section-head">
            <div className="cp-feature-section-head__eyebrow">{headingEyebrow}</div>
            <h2 className="cp-feature-section-head__title">{headingTitle}</h2>
            <p className="cp-feature-section-head__sub">{headingSubtitle}</p>
          </div>
          <div className="cp-feature-grid" style={gridStyle}>
            {list.map((f, i) => renderFeature(f, i, truncate))}
          </div>
        </div>
      )
    )
    .otherwise(() => null)
}

/**
 * Render a single feature as a FeatureCard element.
 * Accepts the array index from `.map()` to guarantee unique keys.
 *
 * @private
 * @param feature - Feature item data
 * @param index - Array index for key generation
 * @param truncate - Optional line-clamp limits for card text
 * @returns Feature card element
 */
function renderFeature(
  feature: FeatureItem,
  index: number,
  truncate: TruncateConfig | undefined
): React.ReactElement {
  const titleLines = truncate && truncate.title
  const descLines = truncate && truncate.description

  return (
    <FeatureCard
      key={`${feature.title}-${index}`}
      title={feature.title}
      description={feature.details}
      href={feature.link}
      icon={feature.icon}
      titleLines={titleLines}
      descriptionLines={descLines}
    />
  )
}
