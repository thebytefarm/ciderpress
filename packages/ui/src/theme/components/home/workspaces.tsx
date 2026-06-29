import type { HomeShowcaseConfig } from '@ciderpress/config'
import { useFrontmatter } from '@rspress/core/runtime'
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

/**
 * Smart orchestrator that reads workspace data from themeConfig
 * and renders workspace groups with the correct card component per type.
 *
 * Optionally renders a top-level heading above the workspace groups
 * when `home.showcase.heading` is configured. The sync engine writes
 * it into frontmatter as `workspacesHeading`.
 *
 * @returns React element with workspace groups or null
 */
export function HomeWorkspaces(): React.ReactElement | null {
  const { workspaces, home } = useCiderpress()
  const gridConfig = home && home.showcase
  const { frontmatter } = useFrontmatter()
  const heading = (frontmatter as Record<string, unknown>).workspacesHeading as
    | FrontmatterWorkspacesHeading
    | undefined

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
          {groups.map((group) => renderGroup(group, gridConfig))}
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
 * @param gridConfig - Optional grid layout config for columns and truncation
 * @returns Workspace grid element
 */
function renderGroup(
  group: WorkspaceGroupData,
  gridConfig: HomeShowcaseConfig | undefined
): React.ReactElement {
  const titleLines = gridConfig && gridConfig.truncate && gridConfig.truncate.title
  const descLines = gridConfig && gridConfig.truncate && gridConfig.truncate.description

  return (
    <WorkspaceGrid
      key={group.heading}
      heading={group.heading}
      description={group.description}
      columns={gridConfig && gridConfig.columns}
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
