import { useFrontmatter, useLocation } from '@rspress/core/runtime'
import { DocContent, DocFooter, Outline, Overview, Sidebar, useWatchToc } from '@rspress/core/theme'
import type { DocLayoutProps } from '@rspress/core/theme'
import { clsx } from 'clsx'
import { match } from 'massaman/match'
import { useEffect, useMemo, useState } from 'react'
import type React from 'react'

import { EnhancedMarkdownTable } from '../shared/enhanced-markdown-table'
import { CiderpressLayoutContext } from './ciderpress-layout-context'

/**
 * Ciderpress replacement for Rspress's `<DocLayout />`. Re-exported
 * from the theme entry so Rspress's `<Layout />` (which imports
 * `DocLayout` via `@rspress/core/theme`) picks this version up
 * automatically.
 *
 * Why a full re-implementation instead of a `beforeDoc` wrapper:
 *
 *   1. Rspress's DocLayout unconditionally renders
 *      `<div className="rp-doc-layout__menu">{sidebarMenu}</div>` —
 *      and the inner `<SidebarMenu />` is hardcoded inside the
 *      private `useSidebarMenu` hook (not swappable). CSS-hiding the
 *      wrapper leaves the React subtree (and the focus-trap, body-
 *      scroll-lock, click-outside listeners it installs) live, which
 *      we don't want when our own `<CiderpressDocsBar />` is the
 *      sticky sub-header.
 *
 *   2. The sidebar/outline drawer state lives entirely inside
 *      `useSidebarMenu` and isn't exposed publicly. By owning the
 *      DocLayout we own the state, which then flows through
 *      `<CiderpressLayoutContext />` to `<CiderpressDocsBar />` so
 *      the bar's toggle button drives the drawer directly (no
 *      `document.querySelector` against Rspress internals).
 *
 * Behavioural parity preserved: SSR markdown short-circuit, all
 * `before*` / `after*` slots, frontmatter-driven sidebar / outline /
 * footer toggles, doc-wide variant, overview-page variant, and the
 * `useWatchToc` ref on the article body.
 *
 * @param props - Standard `DocLayoutProps` (slots + components).
 * @returns Doc-layout React element.
 */
export function CiderpressDocLayout(props: DocLayoutProps): React.ReactElement {
  const {
    beforeDocFooter,
    afterDocFooter,
    beforeDoc,
    afterDoc,
    beforeDocContent,
    afterDocContent,
    beforeOutline,
    afterOutline,
    beforeSidebar,
    afterSidebar,
    components,
  } = props
  // Override the intrinsic markdown `table` element so plain markdown
  // tables are automatically upgraded to interactive AdvancedTables.
  const mdxComponents = { ...components, table: EnhancedMarkdownTable }
  const { frontmatter } = useFrontmatter()
  const fmRecord = frontmatter as Record<string, unknown>
  const isOverviewPage = fmRecord.overview === true
  const sidebarConfig = match(fmRecord.sidebar)
    .with(false, () => false as const)
    .with('placeholder', () => 'placeholder' as const)
    .otherwise(() => true as const)
  const showSidebar = sidebarConfig === true
  const showSidebarPlaceholder = sidebarConfig === false || sidebarConfig === 'placeholder'
  const isLegacyPlaceholder = sidebarConfig === 'placeholder'
  const showOutline = match(fmRecord.outline)
    .with(false, () => false)
    .otherwise(() => true)
  const showDocFooter = match(fmRecord.footer)
    .with(false, () => false)
    .otherwise(() => true)
  const isDocWide = fmRecord.pageType === 'doc-wide'

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isOutlineOpen, setIsOutlineOpen] = useState(false)
  const { pathname } = useLocation()

  // Close drawers when navigating to a new page.
  useEffect(() => {
    setIsSidebarOpen(false)
    setIsOutlineOpen(false)
  }, [pathname])

  // Body scroll lock ONLY while the SIDEBAR drawer is open — the
  // outline is now a dropdown / side popout that lives in the bar
  // and doesn't take over the viewport, so locking page scroll for
  // it makes the page feel "frozen" without good reason.
  useEffect(() => {
    if (globalThis.document === undefined) {
      return
    }
    const html = globalThis.document.documentElement
    match(isSidebarOpen)
      .with(true, () => {
        html.dataset.cpDrawerOpen = 'true'
      })
      .otherwise(() => {
        delete html.dataset.cpDrawerOpen
      })
  }, [isSidebarOpen])

  const { rspressDocRef } = useWatchToc()

  const contextValue = useMemo(
    () => ({ isSidebarOpen, setIsSidebarOpen, isOutlineOpen, setIsOutlineOpen }),
    [isSidebarOpen, isOutlineOpen]
  )

  if (process.env.__SSR_MD__) {
    return (
      <>
        {match(isOverviewPage)
          .with(true, () => (
            <Overview content={<DocContent components={mdxComponents} isOverviewPage />} />
          ))
          .otherwise(() => (
            <DocContent components={mdxComponents} />
          ))}
      </>
    )
  }

  const sidebarSlot = match({ showSidebar, showSidebarPlaceholder })
    .with({ showSidebar: true }, () => (
      <aside
        className={clsx(
          'rp-doc-layout__sidebar',
          isSidebarOpen && 'rp-doc-layout__sidebar--open',
          'rp-scrollbar'
        )}
      >
        {beforeSidebar}
        <Sidebar />
        {afterSidebar}
      </aside>
    ))
    .with({ showSidebarPlaceholder: true }, () => (
      <aside
        className={clsx(
          'rp-doc-layout__sidebar-placeholder',
          isLegacyPlaceholder && 'rp-doc-layout__sidebar-placeholder--legacy'
        )}
        style={docWideStyle(isDocWide)}
      />
    ))
    .otherwise(() => null)

  const mainSlot = match(isOverviewPage)
    .with(true, () => (
      <main className="rp-doc-layout__overview">
        {beforeDocContent}
        <Overview content={<DocContent components={mdxComponents} isOverviewPage />} />
        {afterDocContent}
      </main>
    ))
    .otherwise(() => (
      <div className={clsx('rp-doc-layout__doc', isDocWide && 'rp-doc-layout__doc--wide')}>
        <main className="rp-doc-layout__doc-container">
          {beforeDocContent}
          <div className="rp-doc rspress-doc" ref={rspressDocRef}>
            <DocContent components={mdxComponents} />
          </div>
          {afterDocContent}
          {beforeDocFooter}
          {showDocFooter && <DocFooter />}
          {afterDocFooter}
        </main>
      </div>
    ))

  // No `--open` class on the outline rail: at >=1280px it's a sticky
  // desktop rail; at <=1279px Rspress styles it as a fixed overlay
  // drawer that we don't want. <CiderpressDocsBar /> renders its own
  // dropdown using the same `<Toc />` component, so the rail just
  // stays hidden via Rspress's default `visibility: hidden` at narrow
  // widths.
  const outlineSlot = match({ isOverviewPage, showOutline })
    .with({ isOverviewPage: true }, () => null)
    .with({ showOutline: true }, () => (
      <aside className={clsx('rp-doc-layout__outline', 'rp-scrollbar')}>
        {beforeOutline}
        <Outline />
        {afterOutline}
      </aside>
    ))
    .otherwise(() => (
      <aside className="rp-doc-layout__outline-placeholder" style={docWideStyle(isDocWide)} />
    ))

  return (
    <CiderpressLayoutContext.Provider value={contextValue}>
      {beforeDoc}
      <div className="rp-doc-layout__container rp-doc-layout__container--no-menu">
        {/* Mask only renders for the sidebar drawer — the outline
            uses an in-bar dropdown (`<CiderpressDocsBar />`'s
            outline-dropdown) with its own document-mousedown
            click-outside handler, no modal chrome needed. */}
        {isSidebarOpen && (
          <div
            className="cp-drawer-mask"
            onClick={makeCloseDrawers(setIsSidebarOpen, setIsOutlineOpen)}
            aria-hidden="true"
          />
        )}
        {sidebarSlot}
        {mainSlot}
        {outlineSlot}
      </div>
      {afterDoc}
    </CiderpressLayoutContext.Provider>
  )
}

/**
 * Produce the inline style for the placeholder rails when the page is
 * `doc-wide` (zero-width placeholders so the prose can claim the space).
 *
 * @private
 * @param isDocWide - True when the active page is `doc-wide`.
 * @returns Style object or undefined when no override is needed.
 */
function docWideStyle(isDocWide: boolean): React.CSSProperties | undefined {
  if (isDocWide) {
    return { width: '0' }
  }
}

/**
 * Build a single onClick handler that closes both drawers. Inlined so
 * `setIsSidebarOpen` / `setIsOutlineOpen` don't need to be wrapped in
 * `useCallback`s that re-create on every state flip.
 *
 * @private
 * @param setSidebar - Setter for the sidebar drawer state.
 * @param setOutline - Setter for the outline drawer state.
 * @returns Click handler.
 */
function makeCloseDrawers(
  setSidebar: React.Dispatch<React.SetStateAction<boolean>>,
  setOutline: React.Dispatch<React.SetStateAction<boolean>>
): () => void {
  return () => {
    setSidebar(false)
    setOutline(false)
  }
}
