import { useSite } from '@rspress/core/runtime'
import type { FooterConfig, HomeConfig, SiteConfig } from '@ciderpress/config'

export interface CiderpressSidebarItem {
  readonly text?: string
  readonly link?: string
  readonly icon?: string
  readonly items?: readonly CiderpressSidebarItem[]
}

export interface CiderpressSidebarLink {
  readonly text: string
  readonly link: string
  readonly icon?: string | { readonly id: string; readonly color: string }
  readonly style?: 'brand' | 'alt' | 'ghost'
  readonly shape?: 'square' | 'rounded' | 'circle'
}

export interface WorkspaceCardData {
  readonly title: string
  readonly href: string
  readonly icon: string | { readonly id: string; readonly color: string } | undefined
  readonly scope: string | undefined
  readonly description: string | undefined
  readonly tags: readonly string[]
  readonly badge: { readonly src: string; readonly alt: string } | undefined
}

export interface WorkspaceGroupData {
  readonly type: 'apps' | 'packages' | 'workspaces'
  readonly heading: string
  readonly description: string
  readonly cards: readonly WorkspaceCardData[]
}

interface CiderpressThemeConfig {
  readonly sidebar: Record<string, readonly CiderpressSidebarItem[]>
  readonly sidebarAbove: readonly CiderpressSidebarLink[] | undefined
  readonly sidebarBelow: readonly CiderpressSidebarLink[] | undefined
  readonly workspaces: readonly WorkspaceGroupData[] | undefined
  readonly standaloneScopePaths: readonly string[] | undefined
  readonly home: HomeConfig | undefined
  readonly ciderpressFooter: FooterConfig | undefined
  readonly site: SiteConfig | undefined
}

/**
 * Typed wrapper around Rspress `useSite()` that exposes
 * ciderpress-specific themeConfig fields.
 *
 * The double cast is necessary because Rspress types `themeConfig` as
 * `NormalizedThemeConfig`, but ciderpress injects custom fields (sidebar,
 * workspaces) via spread at build time. No Zod schema exists for runtime
 * validation yet.
 *
 * @returns ciderpress theme config with sidebar and workspace data.
 */
export function useCiderpress(): CiderpressThemeConfig {
  const { site } = useSite()
  return site.themeConfig as unknown as CiderpressThemeConfig
}
