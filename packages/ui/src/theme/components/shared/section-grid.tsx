import type React from 'react'

export interface SectionGridProps {
  readonly children: React.ReactNode
}

/**
 * Grid container for section cards on landing pages.
 *
 * @param props - Props with children to render inside the grid
 * @returns React element wrapping children in a section grid
 */
export function SectionGrid({ children }: SectionGridProps): React.ReactElement {
  return <div className="cp-section-grid">{children}</div>
}
