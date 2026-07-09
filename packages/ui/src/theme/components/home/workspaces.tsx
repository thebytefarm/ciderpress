import type { TruncateConfig } from '@ciderpress/config'
import { match, P } from 'massaman/match'
import type React from 'react'

import { useCiderpress } from '../../hooks/use-ciderpress'
import type { WorkspaceGroupData } from '../../hooks/use-ciderpress'
import { WorkspaceCard } from '../workspaces/card'
import { WorkspaceGrid } from '../workspaces/grid'

interface FrontmatterWorkspacesHeading {
  readonly label?: string
  readonly title?: string
  readonly subtitle?: string
}

interface HomeWorkspacesProps {
  readonly heading?: FrontmatterWorkspacesHeading
  readonly columns?: 1 | 2 | 3 | 4
  readonly truncate?: TruncateConfig
}

const DEFAULT_COLUMNS: 1 | 2 | 3 | 4 = 2

/**
 * Showcase grid block. Reads workspace card data from the theme config
 * (serialized from the repo at build time) and renders it in grouped
 * grids. Grid layout — heading, columns, truncation — comes from props.
 *
 * @param props - Optional heading, column count, and truncation limits.
 * @returns React element with workspace groups, or null.
 */
export function HomeWorkspaces(props: HomeWorkspacesProps): React.ReactElement | null {
  const { workspaces } = useCiderpress()
  const { heading, columns, truncate } = props
  const resolvedColumns = match(columns)
    .with(P.nonNullable, (c) => c)
    .otherwise(() => DEFAULT_COLUMNS)

  return match(workspaces)
    .with(
      P.when((w): w is readonly WorkspaceGroupData[] => Array.isArray(w) && w.length > 0),
      (groups) => (
        <div className="cp-workspace-section">
          <hr className="cp-divider" />
          {match(heading)
            .with(undefined, () => null)
            .otherwise((h) => (
              <div className="cp-feature-section-head">
                {match(h.label)
                  .with(undefined, () => null)
                  .otherwise((e) => (
                    <div className="cp-feature-section-head__eyebrow">{e}</div>
                  ))}
                {match(h.title)
                  .with(undefined, () => null)
                  .otherwise((t) => (
                    <h2 className="cp-feature-section-head__title">{t}</h2>
                  ))}
                {match(h.subtitle)
                  .with(undefined, () => null)
                  .otherwise((s) => (
                    <p className="cp-feature-section-head__sub">{s}</p>
                  ))}
              </div>
            ))}
          {groups.map((group) => renderGroup(group, resolvedColumns, truncate))}
        </div>
      )
    )
    .otherwise(() => null)
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
  const titleLines = truncate && truncate.title
  const descLines = truncate && truncate.description

  return (
    <WorkspaceGrid
      key={group.heading}
      heading={group.heading}
      description={group.description}
      columns={columns}
    >
      {group.cards.map((card, i) => (
        <WorkspaceCard
          key={`${card.title}-${i}`}
          title={card.title}
          href={card.href}
          icon={card.icon}
          scope={card.scope}
          description={card.description}
          tags={card.tags}
          badge={card.badge}
          titleLines={titleLines}
          descriptionLines={descLines}
        />
      ))}
    </WorkspaceGrid>
  )
}
