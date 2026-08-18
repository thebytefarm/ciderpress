import type React from 'react'

/**
 * Ladle stub for `@rspress/core/theme-original`.
 *
 * Replaces the default Rspress layout and sidebar list with empty
 * placeholders so stories that import them render in isolation.
 *
 * @private
 */

export interface LayoutProps {
  readonly children?: React.ReactNode
}

/**
 * Pass-through stand-in for Rspress's default `Layout`.
 *
 * @param props - Layout children
 * @returns Fragment of children
 */
export function Layout({ children }: LayoutProps): React.ReactElement {
  return <>{children}</>
}

/**
 * Empty stand-in for Rspress's `SidebarList`.
 *
 * @returns Empty `<ul>`
 */
export function SidebarList(): React.ReactElement {
  return <ul />
}

/**
 * Props for {@link Tag} — mirrors Rspress's own `Tag`, which takes a single
 * optional tag string.
 */
export interface TagProps {
  readonly tag?: string
}

/**
 * Plain stand-in for Rspress's `Tag`, used by the sidebar badge fallback path.
 *
 * @param props - The tag text to render
 * @returns Span wrapping the tag text
 */
export function Tag({ tag }: TagProps): React.ReactElement {
  return <span>{tag}</span>
}
