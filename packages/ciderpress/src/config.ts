/**
 * Config-only entry point for `ciderpress` — re-exports `defineConfig` and
 * all config-related types from `@ciderpress/config`.
 *
 * @module
 */
export { defineConfig } from '@ciderpress/config'

export type {
  CiderpressConfig,
  Section,
  Feature,
  Workspace,
  WorkspaceGroup,
  Frontmatter,
  NavItem,
  CardConfig,
  IconConfig,
  IconColor,
  IconId,
  SidebarConfig,
  SidebarLink,
} from '@ciderpress/config'
