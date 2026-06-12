import type { HomeGridConfig } from '@ciderpress/config'
import { useFrontmatter } from '@rspress/core/runtime'
import { match, P } from 'massaman/match'
import type React from 'react'

import { useCiderpress } from '../../hooks/use-ciderpress'
import { FeatureCard } from './feature-card'
import type { FeatureItem } from './feature-card'

interface FrontmatterFeaturesHeading {
  readonly eyebrow?: string
  readonly title?: string
  readonly subtitle?: string
}

const DEFAULT_HEADING_EYEBROW = 'Features'
const DEFAULT_HEADING_TITLE = 'Built for the way you ship.'
const DEFAULT_HEADING_SUBTITLE =
  "Everything you need, nothing you don't. Configured in TypeScript, validated at boot."

/**
 * Custom HomeFeature override for ciderpress.
 * Uses useFrontmatter() hook to read features and renders with FeatureCard/FeatureGrid styling.
 *
 * @returns React element with feature grid or null
 */
export function HomeFeature(): React.ReactElement | null {
  const { frontmatter } = useFrontmatter()
  const { home } = useCiderpress()
  const gridConfig = home && home.features

  // Rspress types frontmatter as its own FrontMatterMeta shape which does not
  // include ciderpress-specific `features`. The double cast is necessary because
  // no shared Zod schema exists for frontmatter validation at runtime.
  const fm = frontmatter as Record<string, unknown>
  const features = fm.features as readonly FeatureItem[] | undefined
  const heading = fm.featuresHeading as FrontmatterFeaturesHeading | undefined
  // Frontmatter is unvalidated user content — a `featuresHeading.title: {}`
  // would otherwise render as `[object Object]` in the H2. Treat any
  // non-string value as missing and fall through to the framework default.
  const headingEyebrow = match(heading && heading.eyebrow)
    .with(P.string, (s) => s)
    .otherwise(() => DEFAULT_HEADING_EYEBROW)
  const headingTitle = match(heading && heading.title)
    .with(P.string, (s) => s)
    .otherwise(() => DEFAULT_HEADING_TITLE)
  const headingSubtitle = match(heading && heading.subtitle)
    .with(P.string, (s) => s)
    .otherwise(() => DEFAULT_HEADING_SUBTITLE)

  return match(features)
    .with(
      P.when((f): f is readonly FeatureItem[] => Array.isArray(f) && f.length > 0),
      (items) => (
        <div className="cp-feature-section">
          <div className="cp-feature-section-head">
            <div className="cp-feature-section-head__eyebrow">{headingEyebrow}</div>
            <h2 className="cp-feature-section-head__title">{headingTitle}</h2>
            <p className="cp-feature-section-head__sub">{headingSubtitle}</p>
          </div>
          <div className="cp-feature-grid">
            {items.map((f, i) => renderFeature(f, i, gridConfig))}
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
 * @param gridConfig - Optional grid config for truncation
 * @returns Feature card element
 */
function renderFeature(
  feature: FeatureItem,
  index: number,
  gridConfig: HomeGridConfig | undefined
): React.ReactElement {
  const titleLines = gridConfig && gridConfig.truncate && gridConfig.truncate.title
  const descLines = gridConfig && gridConfig.truncate && gridConfig.truncate.description

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
