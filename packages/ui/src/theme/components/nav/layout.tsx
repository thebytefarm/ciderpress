import type { SiteEditConfig, SiteReportConfig } from '@ciderpress/config'
import { useFrontmatter, useSite } from '@rspress/core/runtime'
import { Layout as OriginalLayout } from '@rspress/core/theme-original'
import { match, P } from 'massaman/match'
import type React from 'react'

import { useCiderpress } from '../../hooks/use-ciderpress'
import { useNavItems } from '../../hooks/use-nav-items'
import { AnnouncementBar } from '../announcement/announcement-bar'
import { ContentFooterPortal } from '../content-footer/content-footer-portal'
import { Feedback } from '../content-footer/feedback'
import type { MetaAction } from '../content-footer/meta-actions'
import { MetaActions } from '../content-footer/meta-actions'
import { SiteFooter } from '../footer/site-footer'
import { SidebarLinks } from '../sidebar/sidebar-links'
import { SidebarPromo } from '../sidebar/sidebar-promo'
import { CiderpressHeader } from './ciderpress-header'
import type { CiderpressNavMenuItem } from './ciderpress-nav-menu'
import type { CiderpressSocialLink } from './ciderpress-nav-social-links'
import { FloatingBranchIndicator } from './floating-branch-indicator'

/**
 * Custom Layout override for ciderpress.
 *
 * Renders `<CiderpressHeader />` as the entire site header chrome
 * (Rspress's `.rp-nav` is hidden via CSS in `ciderpress-header.css`).
 * `<OriginalLayout />` is kept around purely to render Rspress's
 * sidebar + article body + footer; every nav-related slot is fed
 * `null` so Rspress doesn't render its own chrome.
 *
 * Slots still in use:
 * - `beforeSidebar`: SidebarLinks (above) and the `.cp-sidebar-top` band
 * - `afterSidebar`: SidebarLinks (below) plus SidebarPromo
 * - `afterDoc`: Feedback + MetaActions portalled into the doc footer
 * - `bottom`: SiteFooter on doc pages
 *
 * @returns React element with the custom layout
 */
export function Layout(): React.ReactElement {
  const { sidebarAbove, sidebarBelow, site } = useCiderpress()
  const { site: rspressSite } = useSite()
  const configNavItems = readNavItems(rspressSite)
  const scrapedNavItems = useNavItems()
  const navItems = configNavItems.length > 0 ? configNavItems : scrapedNavItems
  const socialLinks = readSocialLinks(rspressSite)
  const { announcement, topbarCta, sidebarPromo: sidebarPromoConfig, edit, report } = site ?? {}
  const { frontmatter } = useFrontmatter()
  const fmRecord = frontmatter as Record<string, unknown>
  const isHome = fmRecord.pageType === 'home'
  const isBlank = fmRecord.pageType === 'blank'
  const filepathValue = fmRecord.__filepath
  const pagePath = match(filepathValue)
    .with(P.string, (v) => v)
    .otherwise(() => '')

  const announcementSlot = match(announcement)
    .with(undefined, () => null)
    .otherwise((a) => (
      <AnnouncementBar id={a.id} lead={a.lead} cta={a.cta} persistent={a.persistent}>
        {a.message}
      </AnnouncementBar>
    ))

  const aboveItems = sidebarAbove ?? []
  const belowItems = sidebarBelow ?? []

  const beforeSidebar = match(aboveItems.length > 0)
    .with(true, () => (
      <div className="cp-sidebar-top">
        <SidebarLinks items={aboveItems} position="above" />
      </div>
    ))
    .otherwise(() => null)

  const sidebarPromo = match(sidebarPromoConfig)
    .with(undefined, () => null)
    .otherwise((p) => (
      <SidebarPromo title={p.title} body={p.body} ctaText={p.cta.text} ctaHref={p.cta.href} />
    ))

  const belowLinks = match(belowItems.length > 0)
    .with(true, () => <SidebarLinks items={belowItems} position="below" />)
    .otherwise(() => null)

  const afterSidebar = match(belowLinks === null && sidebarPromo === null)
    .with(true, () => null)
    .otherwise(() => (
      <div className="cp-sidebar-bottom">
        {belowLinks}
        {sidebarPromo}
      </div>
    ))

  const bottomSlot = match(isHome || isBlank)
    .with(true, () => null)
    .otherwise(() => <SiteFooter />)

  const metaActions = collectMetaActions({ edit, report, pagePath })

  const afterDocSlot = (
    <ContentFooterPortal>
      <Feedback />
      <MetaActions actions={metaActions} />
    </ContentFooterPortal>
  )

  return (
    <>
      <CiderpressHeader
        announcement={announcementSlot}
        navItems={navItems}
        socialLinks={socialLinks}
        topbarCta={topbarCta}
        isHome={isHome}
      />
      <OriginalLayout
        top={null}
        beforeNavMenu={null}
        afterNavMenu={null}
        beforeSidebar={beforeSidebar}
        afterSidebar={afterSidebar}
        afterDoc={afterDocSlot}
        bottom={bottomSlot}
      />
      <FloatingBranchIndicator />
    </>
  )
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Pull the primary nav menu items off Rspress's `site` shape. The
 * Rspress `SiteData` type doesn't expose `nav` at compile time, so we
 * read through an indexed access and validate the shape at runtime.
 *
 * @private
 * @param site - Rspress site data
 * @returns Array of nav items (empty array when not configured)
 */
function readNavItems(site: unknown): readonly CiderpressNavMenuItem[] {
  const candidate = (site as { readonly nav?: unknown }).nav
  if (!Array.isArray(candidate)) {
    return []
  }
  return candidate.filter(
    (item): item is CiderpressNavMenuItem =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as { text?: unknown }).text === 'string' &&
      typeof (item as { link?: unknown }).link === 'string'
  )
}

/**
 * Pull social-link entries (GitHub, npm, etc) from Rspress's `site`
 * shape. Lives on `site.themeConfig.socialLinks` after Rspress
 * normalisation but isn't surfaced on the public typings.
 *
 * @private
 * @param site - Rspress site data
 * @returns Array of social-link entries (empty array when not configured)
 */
function readSocialLinks(site: unknown): readonly CiderpressSocialLink[] {
  const themeConfig = (site as { readonly themeConfig?: unknown }).themeConfig
  const candidate = (themeConfig as { readonly socialLinks?: unknown } | undefined)?.socialLinks
  if (!Array.isArray(candidate)) {
    return []
  }
  return candidate.filter(
    (item): item is CiderpressSocialLink =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as { icon?: unknown }).icon === 'string' &&
      typeof (item as { content?: unknown }).content === 'string'
  )
}

/**
 * Build the list of `MetaAction`s to render under each doc page,
 * derived from `site.edit` and `site.report`. Returns an empty array
 * when neither is configured.
 *
 * @private
 * @param params - Site edit/report config plus current page path
 * @returns Ordered list of meta actions
 */
function collectMetaActions(params: {
  readonly edit: SiteEditConfig | undefined
  readonly report: SiteReportConfig | undefined
  readonly pagePath: string
}): readonly MetaAction[] {
  const { edit, report, pagePath } = params
  const editAction = match(edit)
    .with(undefined, () => null)
    .otherwise(
      (e): MetaAction => ({
        label: e.label ?? 'Edit this page on GitHub',
        href: buildEditUrl(e, pagePath),
        icon: <EditIcon />,
      })
    )
  const reportAction = match(report)
    .with(undefined, () => null)
    .otherwise(
      (r): MetaAction => ({
        label: r.label ?? 'Report an issue',
        href: buildReportUrl(r),
        icon: <AlertIcon />,
      })
    )
  return [editAction, reportAction].filter((a): a is MetaAction => a !== null)
}

/**
 * @private
 */
function buildEditUrl(edit: SiteEditConfig, pagePath: string): string {
  if (edit.repo.startsWith('http')) {
    return edit.repo
  }
  const branch = edit.branch ?? 'main'
  const directory = match(edit.directory)
    .with(undefined, () => '')
    .otherwise((d) => `${d.replaceAll(/^\/+|\/+$/g, '')}/`)
  const path = pagePath.replace(/^\/+/, '')
  return `https://github.com/${edit.repo}/edit/${branch}/${directory}${path}`
}

/**
 * @private
 */
function buildReportUrl(report: SiteReportConfig): string {
  if (report.repo.startsWith('http')) {
    return report.repo
  }
  return `https://github.com/${report.repo}/issues/new`
}

/**
 * @private
 */
function EditIcon(): React.ReactElement {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

/**
 * @private
 */
function AlertIcon(): React.ReactElement {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}
