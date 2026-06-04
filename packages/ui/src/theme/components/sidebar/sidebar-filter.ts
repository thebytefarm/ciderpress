/**
 * Pure sidebar filtering logic for multi-scope support.
 *
 * Extracts the runtime filtering from the Sidebar React component so the
 * logic is independently testable without React rendering.
 */

import type { SidebarData } from '@rspress/core'

/**
 * Union element of `SidebarData` — sidebar items may be groups, leaf items,
 * dividers, or section headers.
 *
 * @private
 */
type SidebarDataItem = SidebarData[number]

/**
 * Resolve the sidebar items visible for the current scope.
 *
 * When the current pathname matches a standalone scope (e.g. `/packages`),
 * only that section's sidebar items are returned. For all other paths,
 * standalone sections are excluded and the remaining sections form a
 * unified sidebar.
 *
 * @param items - Full unified sidebar items
 * @param pathname - Current decoded URL pathname
 * @param scopes - Standalone scope paths (e.g. `["/packages", "/contributing"]`)
 * @returns Filtered sidebar items for the active scope
 */
export function resolveScopedSidebar(
  items: SidebarData,
  pathname: string,
  scopes: readonly string[]
): SidebarData {
  if (scopes.length === 0) {
    return [...items]
  }

  const standaloneMatch = scopes.find(
    (scope) => pathname === scope || pathname.startsWith(`${scope}/`)
  )

  const all = [...items]

  if (standaloneMatch) {
    return all.filter((item) => belongsToScope(item, standaloneMatch))
  }

  return all.filter((item) => !scopes.some((scope) => belongsToScope(item, scope)))
}

/**
 * Check whether a sidebar item belongs to a given scope path.
 *
 * Matches when the item's link equals the scope or starts with scope + "/".
 * For groups without a direct link, recursively checks child items.
 * Dividers and section headers (no link, no items) are never matched.
 *
 * @private
 * @param item - Sidebar item to check
 * @param scope - Scope path (e.g. "/packages")
 * @returns True when the item belongs to the scope
 */
export function belongsToScope(item: SidebarDataItem, scope: string): boolean {
  if (Object.hasOwn(item, 'link')) {
    const { link } = item as { readonly link?: string }
    if (link && (link === scope || link.startsWith(`${scope}/`))) {
      return true
    }
  }
  // Check children — auto-discovered groups from _meta.json may have no
  // link on the group itself, only on their child items.
  if (Object.hasOwn(item, 'items')) {
    const { items } = item as { readonly items: readonly SidebarDataItem[] }
    return items.some((child) => belongsToScope(child, scope))
  }
  return false
}
