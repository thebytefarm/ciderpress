import type { Workspace, CiderpressConfig } from './types.ts'

/**
 * Collect all workspace items from apps, packages, and workspace categories.
 *
 * Merges the three workspace sources in display order:
 * apps → packages → custom workspace category items.
 *
 * @param config - ciderpress config containing apps, packages, and workspaces
 * @returns Flat array of all workspace items
 */
export function collectAllWorkspaceItems(config: CiderpressConfig): readonly Workspace[] {
  return [
    ...(config.apps ?? []),
    ...(config.packages ?? []),
    ...(config.workspaces ?? []).flatMap((g) => g.items),
  ]
}
