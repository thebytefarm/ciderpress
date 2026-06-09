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
