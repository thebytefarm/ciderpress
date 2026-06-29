/**
 * Config-only entry point for `ciderpress` — re-exports `defineConfig` and
 * all config-related types from `@ciderpress/config`.
 *
 * @module
 */
export { defineConfig } from '@ciderpress/config'

export type {
  CiderpressConfig,
  Page,
  Feature,
  Workspace,
  WorkspaceGroup,
  Frontmatter,
  NavItem,
  CardConfig,
  ButtonConfig,
  IconConfig,
  IconColor,
  IconId,
  SidebarConfig,
  SidebarPromo,
} from '@ciderpress/config'
