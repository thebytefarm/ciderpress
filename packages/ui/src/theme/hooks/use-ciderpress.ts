import type { BadgeConfig, FooterConfig, HomeConfig, SerializedIcon } from '@ciderpress/config'
import { useSite } from '@rspress/core/runtime'

export interface CiderpressSidebarItem {
  readonly text?: string
  readonly link?: string
  readonly icon?: SerializedIcon
  readonly items?: readonly CiderpressSidebarItem[]
}

export interface CiderpressSidebarLink {
  readonly text: string
  readonly link: string
  readonly icon?: SerializedIcon
  readonly style?: 'brand' | 'alt' | 'ghost'
  readonly shape?: 'square' | 'rounded' | 'circle'
}

export interface WorkspaceCardData {
  readonly title: string
  readonly href: string
  readonly icon: SerializedIcon | undefined
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

/**
 * Serialised view of the unified `CiderpressConfig` that the runtime
 * theme components still read through. The `site` field is rebuilt in
 * `packages/ui/src/config.ts` (`buildSiteBlock`) from the new top-level
 * `editLink` / `reportLink` / `topbar` / `sidebar` / `footer` / `version`
 * config — kept under the legacy `site.*` name so theme components don't
 * need to be rewired to look up each field individually.
 */
export interface CiderpressSiteBlock {
  readonly version: string | undefined
  readonly edit:
    | {
        readonly repo: string
        readonly branch?: string
        readonly directory?: string
        readonly label?: string
      }
    | undefined
  readonly report:
    | {
        readonly repo: string
        readonly branch?: string
        readonly directory?: string
        readonly label?: string
      }
    | undefined
  readonly topbarCta: { readonly text: string; readonly href: string } | undefined
  readonly sidebarPromo:
    | {
        readonly title: string
        readonly body: string
        readonly cta: { readonly text: string; readonly href: string }
      }
    | undefined
  readonly announcement:
    | {
        readonly id?: string
        readonly lead?: string
        readonly message: string
        readonly cta?: { readonly href: string; readonly label: string }
        readonly persistent?: boolean
      }
    | undefined
  readonly footer:
    | {
        readonly columns?: readonly {
          readonly heading: string
          readonly links: readonly { readonly text: string; readonly href: string }[]
        }[]
        readonly tagline?: string
        readonly brandMark?: string
      }
    | undefined
  readonly feedback: {
    readonly enabled: boolean
    readonly question: string | undefined
  }
}

interface CiderpressThemeConfig {
  readonly sidebar: Record<string, readonly CiderpressSidebarItem[]>
  readonly sidebarAbove: readonly CiderpressSidebarLink[] | undefined
  readonly sidebarBelow: readonly CiderpressSidebarLink[] | undefined
  readonly workspaces: readonly WorkspaceGroupData[] | undefined
  readonly standaloneScopePaths: readonly string[] | undefined
  readonly home: HomeConfig | undefined
  readonly ciderpressFooter: FooterConfig | undefined
  readonly site: CiderpressSiteBlock | undefined
  readonly pageBadges: Record<string, readonly BadgeConfig[]> | undefined
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
