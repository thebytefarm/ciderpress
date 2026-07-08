import type { BadgeConfig } from '@ciderpress/config'
import { useFrontmatter, useLocation } from '@rspress/core/runtime'
import {
  LlmsContainer,
  LlmsCopyButton,
  LlmsViewOptions,
  ReadPercent,
  renderInlineMarkdown,
  Toc,
  useActiveAnchor,
  useDynamicToc,
} from '@rspress/core/theme'
import { match, P } from 'massaman/match'
import { useCallback, useEffect, useRef, useState } from 'react'
import type React from 'react'

import { useCiderpress } from '../../hooks/use-ciderpress'
import { RouteLink } from '../../lib/route-link.tsx'
import { Icon } from '../shared/icon.tsx'
import { BadgeChips } from '../sidebar/sidebar-badge'
import { useCiderpressLayout } from './ciderpress-layout-context'

import './ciderpress-docs-bar.css'

const SIDEBAR_STORAGE_KEY = 'ciderpress-sidebar-collapsed'
const SIDEBAR_HTML_ATTR = 'cpSidebarCollapsed'
const OUTLINE_STORAGE_KEY = 'ciderpress-outline-collapsed'
const OUTLINE_HTML_ATTR = 'cpOutlineCollapsed'
/**
 * Below this viewport width, the sidebar behaves as a fixed overlay
 * drawer (drawer-base rules ship in `sidebar/sidebar-toggle.css` —
 * Rspress only provides the rules natively at <=768px, so the same
 * stylesheet extends them up to 1279px to keep this threshold). Above,
 * the sidebar is a sticky rail — `data-cp-sidebar-collapsed` is the
 * right toggle. Matches `OUTLINE_DRAWER_MAX_WIDTH` so Menu and "On
 * this page" flip to mobile behaviour in lockstep — and matches the
 * CSS half (`sidebar-toggle.css`) so clicks fire the right state on
 * either side of the threshold.
 */
const SIDEBAR_DRAWER_MAX_WIDTH = 1279
/**
 * Below this viewport width, Rspress styles `.rp-doc-layout__outline`
 * as a fixed overlay drawer (DocLayout/index.css `@media (width <= 1279px)`).
 * Above, the outline is a sticky rail — `data-cp-outline-collapsed`
 * hides it. Same caveat: must match Rspress's media query exactly.
 */
const OUTLINE_DRAWER_MAX_WIDTH = 1279

/**
 * Sticky bar below the site header that replaces Rspress's built-in
 * `.rp-doc-layout__menu` (which Ciderpress hides via CSS in `rail.css`).
 *
 * Left cluster: sidebar toggle + breadcrumbs (Section › Page).
 *   - Desktop (>= 960px): the toggle collapses/expands the docs sidebar
 *     via `html[data-cp-sidebar-collapsed]`, persisted to localStorage.
 *   - Narrow viewports: the toggle programmatically clicks Rspress's
 *     hidden `.rp-sidebar-menu__left` so the native sidebar drawer
 *     opens (overlay slide-in).
 *
 * Right cluster: "On this page" label + `<ReadPercent />` progress
 * ring + chevron toggle for the outline rail.
 *
 * Mounted from `<Layout />` via `<OriginalLayout>`'s `beforeDoc` slot
 * so it sits between the header and the doc-layout container — outside
 * the sidebar, so it stays reachable even when the sidebar collapses.
 *
 * @returns Sticky docs sub-header.
 */
export function CiderpressDocsBar(): React.ReactElement | null {
  const { pathname } = useLocation()
  const { frontmatter } = useFrontmatter()
  const headers = useDynamicToc()
  const { scrolledHeader } = useActiveAnchor(headers)
  const { isOutlineOpen, setIsSidebarOpen, setIsOutlineOpen } = useCiderpressLayout()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed)
  const [outlineCollapsed, setOutlineCollapsed] = useState(readOutlineCollapsed)
  const outlineWrapRef = useRef<HTMLDivElement | null>(null)

  // Close the outline dropdown when the user clicks anywhere outside
  // it. Cheaper than a transparent backdrop element, and means clicks
  // *inside* the dropdown (notably on TOC `<a>` links) still bubble
  // up to React-Router's link handler and actually navigate. Only
  // arms while the dropdown is open.
  useEffect(() => {
    if (!isOutlineOpen) {
      return
    }
    // Use `click` not `mousedown` — on touch devices `mousedown`
    // fires at the START of a touch-scroll gesture, which would
    // close the dropdown the moment the user tries to scroll the
    // page. `click` only fires on a completed tap (no drag), so
    // touch-scrolling outside the dropdown leaves it alone.
    function handleDocumentClick(event: MouseEvent): void {
      const wrap = outlineWrapRef.current
      if (wrap === null) {
        return
      }
      if (event.target instanceof Node && wrap.contains(event.target)) {
        return
      }
      setIsOutlineOpen(false)
    }
    globalThis.document.addEventListener('click', handleDocumentClick)
    return () => {
      globalThis.document.removeEventListener('click', handleDocumentClick)
    }
  }, [isOutlineOpen, setIsOutlineOpen])

  useEffect(() => {
    applyAttr(SIDEBAR_HTML_ATTR, sidebarCollapsed)
  }, [sidebarCollapsed])

  useEffect(() => {
    applyAttr(OUTLINE_HTML_ATTR, outlineCollapsed)
  }, [outlineCollapsed])

  const fmRecord = frontmatter as Record<string, unknown>
  const isHome = fmRecord.pageType === 'home'
  const isBlank = fmRecord.pageType === 'blank'

  const pageTitle = readStringField(fmRecord.title)

  const { pageBadges } = useCiderpress()
  const badges = lookupPageBadges(pageBadges, pathname)

  const breadcrumbs = buildBreadcrumbs(pathname, pageTitle)
  const outlineEnabled = match(fmRecord.outline)
    .with(false, () => false)
    .otherwise(() => true)

  const handleMenuClick = useCallback(() => {
    if (globalThis.innerWidth <= SIDEBAR_DRAWER_MAX_WIDTH) {
      setIsSidebarOpen((prev) => !prev)
      return
    }
    setSidebarCollapsed((prev) => {
      const next = !prev
      writeStorage(SIDEBAR_STORAGE_KEY, next)
      return next
    })
  }, [setIsSidebarOpen])

  const handleOutlineClick = useCallback(() => {
    if (globalThis.innerWidth <= OUTLINE_DRAWER_MAX_WIDTH) {
      setIsOutlineOpen((prev) => !prev)
      return
    }
    setOutlineCollapsed((prev) => {
      const next = !prev
      writeStorage(OUTLINE_STORAGE_KEY, next)
      return next
    })
  }, [setIsOutlineOpen])

  if (isHome || isBlank) {
    return null
  }

  return (
    <div className="cp-docs-bar">
      <div className="cp-docs-bar__menu">
        <button
          type="button"
          className="cp-docs-bar__menu-btn"
          onClick={handleMenuClick}
          aria-label="Toggle sidebar"
        >
          <Icon icon="pixelarticons:layout-sidebar-left" width={14} height={14} />
          <span>Menu</span>
        </button>
      </div>
      <div className="cp-docs-bar__center">
        {breadcrumbs.length > 0 && (
          <nav className="cp-docs-bar__crumbs" aria-label="Breadcrumb">
            <RouteLink href="/" className="cp-docs-bar__crumb-home" aria-label="Home">
              <Icon icon="pixelarticons:home" width={14} height={14} />
            </RouteLink>
            {breadcrumbs.map((crumb) => (
              <span key={crumb.href} className="cp-docs-bar__crumb-wrap">
                <span className="cp-docs-bar__sep">›</span>
                {match(crumb.current)
                  .with(true, () => (
                    <span className="cp-docs-bar__crumb" aria-current="page">
                      {crumb.label}
                    </span>
                  ))
                  .otherwise(() => (
                    <RouteLink href={crumb.href} className="cp-docs-bar__crumb">
                      {crumb.label}
                    </RouteLink>
                  ))}
              </span>
            ))}
          </nav>
        )}
        {badges.length > 0 && (
          <span className="cp-docs-bar__badges">
            <BadgeChips badges={badges} />
          </span>
        )}
        <div className="cp-docs-bar__llms">
          <LlmsContainer>
            <LlmsCopyButton />
            <LlmsViewOptions />
          </LlmsContainer>
        </div>
      </div>
      {outlineEnabled && (
        <div className="cp-docs-bar__outline-wrap" ref={outlineWrapRef}>
          <button
            type="button"
            className="cp-docs-bar__outline"
            onClick={handleOutlineClick}
            aria-label="Toggle outline"
            aria-expanded={isOutlineOpen}
          >
            <span className="cp-docs-bar__label">On this page</span>
            {match(scrolledHeader)
              .with(P.nullish, () => null)
              .with({ text: P.string }, (header) => (
                <span className="cp-docs-bar__section" {...renderInlineMarkdown(header.text)} />
              ))
              .otherwise(() => null)}
            <ReadPercent size={14} strokeWidth={2} />
            <Icon
              icon="pixelarticons:chevron-down"
              width={14}
              height={14}
              className="cp-docs-bar__chev"
            />
          </button>
          {isOutlineOpen && (
            <nav
              /* `rp-doc-layout__outline` is here ONLY so Rspress's
                 `<TocItem>` auto-scroll-into-view boundary check stops
                 at this element (its boundary returns false for
                 elements with that class). Without it the library walks
                 up past our dropdown and scrolls the WHOLE PAGE every
                 time the active section changes — which felt like the
                 page was jumping every time you opened the menu or
                 scrolled past a heading. The `cp-docs-bar__outline-dropdown`
                 styles below override every Rspress outline rule we
                 don't want (position, visibility, layout). */
              className="cp-docs-bar__outline-dropdown rp-doc-layout__outline"
              aria-label="On this page"
              onClick={makeLinkClickCloser(setIsOutlineOpen)}
            >
              <Toc />
            </nav>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Single rendered breadcrumb — its display label, the route it links to,
 * and whether it represents the current page (the last crumb, which
 * renders as a non-link span with `aria-current="page"`).
 */
interface Crumb {
  readonly label: string
  readonly href: string
  readonly current: boolean
}

/**
 * Look up the current page's badges from the route→badges map, tolerating
 * a trailing slash on the pathname (map keys are stored without one).
 *
 * @private
 * @param pageBadges - Route→badges map from theme config, if present.
 * @param pathname - The current location pathname.
 * @returns The page's badges, or an empty array when none apply.
 */
function lookupPageBadges(
  pageBadges: Record<string, readonly BadgeConfig[]> | undefined,
  pathname: string
): readonly BadgeConfig[] {
  if (pageBadges === undefined) {
    return []
  }
  const stripped = pathname.replace(/\/$/, '')
  return pageBadges[pathname] ?? pageBadges[stripped] ?? []
}

/**
 * Build a 1- or 2-level breadcrumb trail from the current path and the
 * page's frontmatter title. The section label comes from titlecasing
 * the first path segment (e.g. `framework` → `Framework`) and links to
 * that section's index page (`/framework/`). The page crumb links to
 * the current pathname and is marked `current` so the renderer skips
 * the anchor (you don't link to where you already are).
 *
 * @private
 * @param pathname - The current location pathname.
 * @param pageTitle - The page's frontmatter `title`, if defined.
 * @returns Ordered breadcrumb entries (section first).
 */
function buildBreadcrumbs(pathname: string, pageTitle: string | undefined): readonly Crumb[] {
  const segments = pathname.split('/').filter((s) => s !== '')
  if (segments.length === 0) {
    return []
  }
  const section = titleCase(segments[0])
  const sectionHref = `/${segments[0]}/`
  const pageLabel = match(pageTitle)
    .with(P.string, (t) => t)
    .otherwise(() =>
      match(segments.length > 1)
        .with(true, () => titleCase(segments.at(-1) ?? ''))
        .otherwise(() => '')
    )
  return match(pageLabel === '' || pageLabel === section)
    .with(true, () => [{ label: section, href: sectionHref, current: true }])
    .otherwise(() => [
      { label: section, href: sectionHref, current: false },
      { label: pageLabel, href: pathname, current: true },
    ])
}

/**
 * Build an onClick handler for the outline TOC dropdown that closes
 * it whenever the user clicks an `<a>` (or anything nested under
 * one). Hash-only navigation doesn't trigger React Router's pathname
 * effect, so the drawer-close useEffect in `<CiderpressDocLayout />`
 * never fires for TOC clicks — this handler is what actually closes
 * the dropdown.
 *
 * @private
 * @param setIsOutlineOpen - Outline open-state setter from the layout context.
 * @returns Click handler suitable for the dropdown root element.
 */
function makeLinkClickCloser(
  setIsOutlineOpen: React.Dispatch<React.SetStateAction<boolean>>
): React.MouseEventHandler<HTMLElement> {
  return (event) => {
    const { target } = event
    if (!(target instanceof HTMLElement)) {
      return
    }
    if (target.closest('a') !== null) {
      setIsOutlineOpen(false)
    }
  }
}

/**
 * Convert a kebab-case path segment into Title Case.
 *
 * @private
 * @param segment - A single path segment (e.g. `getting-started`).
 * @returns Title-cased label (e.g. `Getting Started`).
 */
function titleCase(segment: string): string {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Narrow an `unknown` frontmatter field to `string`, returning a bare
 * (no explicit `undefined`) absent value when the field is missing or
 * non-string. Used to coerce gray-matter's loose typing into the
 * `string | undefined` shape downstream helpers expect.
 *
 * @private
 * @param value - Frontmatter field value.
 * @returns The string when typed as such, otherwise an absent value.
 */
function readStringField(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value
  }
}

/**
 * Read the persisted sidebar-collapsed state from localStorage.
 *
 * @private
 * @returns true when the sidebar should start collapsed.
 */
function readSidebarCollapsed(): boolean {
  return readStorage(SIDEBAR_STORAGE_KEY)
}

/**
 * Read the persisted outline-collapsed state from localStorage.
 *
 * @private
 * @returns true when the outline should start collapsed.
 */
function readOutlineCollapsed(): boolean {
  return readStorage(OUTLINE_STORAGE_KEY)
}

/**
 * Read a boolean flag from localStorage.
 *
 * @private
 * @param key - localStorage key.
 * @returns true when the stored value is `'1'`.
 */
function readStorage(key: string): boolean {
  if (globalThis.window === undefined) {
    return false
  }
  try {
    return globalThis.localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

/**
 * Persist a boolean flag to localStorage. Removes the entry when
 * `value` is false so the key is absent rather than `'0'`.
 *
 * @private
 * @param key - localStorage key.
 * @param value - true to write `'1'`, false to delete the key.
 */
function writeStorage(key: string, value: boolean): void {
  if (globalThis.window === undefined) {
    return
  }
  try {
    match(value)
      .with(true, () => globalThis.localStorage.setItem(key, '1'))
      .otherwise(() => globalThis.localStorage.removeItem(key))
  } catch {
    // ignore — storage may be unavailable
  }
}

/**
 * Apply a boolean flag to the html dataset for CSS targeting.
 *
 * @private
 * @param attr - Dataset key (camelCase, mapped to `data-*` by React).
 * @param value - true to write `'true'`, false to delete the attribute.
 */
function applyAttr(attr: string, value: boolean): void {
  if (globalThis.document === undefined) {
    return
  }
  const html = globalThis.document.documentElement
  match(value)
    .with(true, () => {
      html.dataset[attr] = 'true'
    })
    .otherwise(() => {
      delete html.dataset[attr]
    })
}
