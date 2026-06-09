import type React from 'react'

import './card.css'

export interface WorkspaceGridProps {
  /**
   * Section heading (e.g. "Apps", "Packages").
   */
  readonly heading: string
  /**
   * Brief description rendered below the heading.
   */
  readonly description: string
  /**
   * Number of grid columns.
   */
  readonly columns?: number
  /**
   * WorkspaceCard elements.
   */
  readonly children: React.ReactNode
}

/**
 * Grid container for workspace cards — renders a heading, description,
 * and a CSS grid wrapping its children.
 *
 * @param props - Props with heading, description, columns, and children workspace cards
 * @returns React element with heading, description, and grid layout
 */
export function WorkspaceGrid({
  heading,
  description,
  columns,
  children,
}: WorkspaceGridProps): React.ReactElement {
  const style = columnsStyle(columns)

  return (
    <>
      <h2>{heading}</h2>
      <p className="cp-workspace-section__desc">{description}</p>
      <div className="cp-workspace-grid" style={style}>
        {children}
      </div>
    </>
  )
}

/**
 * Build an inline style object for the workspace grid column count.
 *
 * @private
 * @param columns - Optional column count
 * @returns Style object with CSS variable or undefined
 */
function columnsStyle(columns: number | undefined): React.CSSProperties | undefined {
  if (columns !== undefined) {
    return { '--cp-workspace-cols': String(columns) } as React.CSSProperties
  }
  return undefined
}
