import type { TruncateConfig } from '@ciderpress/config'
import { match, P } from 'massaman/match'
import type React from 'react'

import { useCiderpress } from '../../hooks/use-ciderpress'
import type { WorkspaceCardData, WorkspaceGroupData } from '../../hooks/use-ciderpress'
import { WorkspaceCard } from '../workspaces/card'
import { WorkspaceGrid } from '../workspaces/grid'

/**
 * A single card compiled from `showcase.source` — the same shape as a
 * workspace card, minus the grouping.
 */
export type ShowcaseCard = WorkspaceCardData

interface FrontmatterWorkspacesHeading {
  readonly label?: string
  readonly title?: string
  readonly body?: string
}

interface HomeWorkspacesProps {
  readonly heading?: FrontmatterWorkspacesHeading
  /**
   * Cards compiled from an explicit `showcase.source` path list. When
   * present they render as one ungrouped grid; otherwise the grouped
   * workspace data from the theme config is used.
   */
  readonly cards?: readonly ShowcaseCard[]
  readonly columns?: 1 | 2 | 3 | 4
  readonly truncate?: TruncateConfig
}

const DEFAULT_COLUMNS: 1 | 2 | 3 | 4 = 2

/**
 * Showcase grid block. Renders either the cards compiled from an
 * explicit `showcase.source` path list (one ungrouped grid) or the
 * grouped workspace data serialized from the repo at build time. Grid
 * layout — heading, columns, truncation — comes from props.
 *
 * @param props - Optional heading, cards, column count, and truncation limits.
 * @returns React element with the showcase grid, or null when empty.
 */
export function HomeWorkspaces(props: HomeWorkspacesProps): React.ReactElement | null {
  const { workspaces } = useCiderpress()
  const { heading, cards, columns, truncate } = props
  const resolvedColumns = match(columns)
    .with(P.nonNullable, (c) => c)
    .otherwise(() => DEFAULT_COLUMNS)

  // A `cards` key means the block declared an explicit `showcase.source`
  // — an empty array is "that source resolved to nothing", not "fall back
  // to the workspace deck". Only an absent key takes the fallback.
  const body = match(cards)
    .with(
      P.when((c): c is readonly ShowcaseCard[] => Array.isArray(c)),
      (list) =>
        match(list.length === 0)
          .with(true, () => null)
          .otherwise(() => [renderCardGrid(list, resolvedColumns, truncate)])
    )
    .otherwise(() =>
      match(workspaces)
        .with(
          P.when((w): w is readonly WorkspaceGroupData[] => Array.isArray(w) && w.length > 0),
          (groups) => groups.map((group) => renderGroup(group, resolvedColumns, truncate))
        )
        .otherwise(() => null)
    )

  return match(body)
    .with(null, () => null)
    .otherwise((content) => (
      <div className="cp-workspace-section">
        <hr className="cp-divider" />
        {renderHeading(heading)}
        {content}
      </div>
    ))
}

/**
 * Render the block heading, or nothing when every field is absent.
 *
 * @private
 * @param heading - Flat heading trio from the block
 * @returns Heading element, or null
 */
function renderHeading(
  heading: FrontmatterWorkspacesHeading | undefined
): React.ReactElement | null {
  if (heading === undefined) {
    return null
  }
  const { label, title, body } = heading
  const hasContent = [label, title, body].some((value) => typeof value === 'string')
  if (!hasContent) {
    return null
  }
  return (
    <div className="cp-feature-section-head">
      {match(label)
        .with(P.string, (e) => <div className="cp-feature-section-head__eyebrow">{e}</div>)
        .otherwise(() => null)}
      {match(title)
        .with(P.string, (t) => <h2 className="cp-feature-section-head__title">{t}</h2>)
        .otherwise(() => null)}
      {match(body)
        .with(P.string, (s) => <p className="cp-feature-section-head__sub">{s}</p>)
        .otherwise(() => null)}
    </div>
  )
}

/**
 * Render an ungrouped grid of cards compiled from `showcase.source`.
 *
 * @private
 * @param cards - Resolved showcase cards
 * @param columns - Column count for the grid
 * @param truncate - Optional line-clamp limits for card text
 * @returns Ungrouped workspace grid element
 */
function renderCardGrid(
  cards: readonly ShowcaseCard[],
  columns: 1 | 2 | 3 | 4,
  truncate: TruncateConfig | undefined
): React.ReactElement {
  return (
    <WorkspaceGrid key="showcase-source" columns={columns}>
      {cards.map((card, i) => renderCard(card, i, truncate))}
    </WorkspaceGrid>
  )
}

/**
 * Render a single showcase / workspace card.
 *
 * @private
 * @param card - Card data
 * @param index - Array index for key generation
 * @param truncate - Optional line-clamp limits for card text
 * @returns Workspace card element
 */
function renderCard(
  card: WorkspaceCardData,
  index: number,
  truncate: TruncateConfig | undefined
): React.ReactElement {
  return (
    <WorkspaceCard
      key={`${card.title}-${index}`}
      title={card.title}
      href={card.href}
      icon={card.icon}
      scope={card.scope}
      description={card.description}
      tags={card.tags}
      badge={card.badge}
      titleLines={truncate && truncate.title}
      descriptionLines={truncate && truncate.description}
    />
  )
}

/**
 * Render a single workspace group with its cards.
 *
 * @private
 * @param group - Workspace group data with heading, description, and cards
 * @param columns - Column count for the grid
 * @param truncate - Optional line-clamp limits for card text
 * @returns Workspace grid element
 */
function renderGroup(
  group: WorkspaceGroupData,
  columns: 1 | 2 | 3 | 4,
  truncate: TruncateConfig | undefined
): React.ReactElement {
  return (
    <WorkspaceGrid
      key={group.heading}
      heading={group.heading}
      description={group.description}
      columns={columns}
    >
      {group.cards.map((card, i) => renderCard(card, i, truncate))}
    </WorkspaceGrid>
  )
}
