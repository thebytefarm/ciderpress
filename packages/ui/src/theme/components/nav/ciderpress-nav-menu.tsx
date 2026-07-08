import { useLocation } from '@rspress/core/runtime'
import { clsx } from 'clsx'
import { match } from 'massaman/match'
import { useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'

import { RouteLink } from '../../lib/route-link.tsx'
import { Icon } from '../shared/icon.tsx'

import './ciderpress-nav-menu.css'

/**
 * Width reserved at the end of the menu strip for the overflow toggle
 * (the "More ▾" button). Subtracted from the available width when
 * deciding how many items can fit inline.
 */
const OVERFLOW_TOGGLE_WIDTH = 96

/**
 * Inter-item gap matching `--cp-nav-menu-gap`. Used during width
 * accounting so we don't have to query computed style on every frame.
 */
const DEFAULT_GAP_PX = 16

/**
 * Grace period before a hover-opened dropdown closes on mouse-leave.
 * Long enough to cross the gap into the popover without it snapping
 * shut, short enough not to feel sticky.
 */
const CLOSE_DELAY_MS = 220

/**
 * Single primary-nav entry — matches the shape of `site.nav[*]` in
 * `ciderpress.config.ts`.
 *
 * An entry is either a leaf (has `link`, no `items`) or a dropdown
 * parent (has `items`, `link` optional). When a parent has children,
 * its own `link` is ignored — the label toggles the submenu rather
 * than navigating.
 */
export interface CiderpressNavMenuItem {
  readonly text: string
  readonly link?: string
  readonly items?: readonly CiderpressNavMenuItem[]
}

/**
 * Props for `<CiderpressNavMenu />`.
 */
export interface CiderpressNavMenuProps {
  readonly items: readonly CiderpressNavMenuItem[]
}

/**
 * Primary nav menu with overflow → dropdown handling. Renders all items
 * inline when they fit; when the container is too narrow, the trailing
 * items collapse into a "More ▾" popover so the strip never pushes off
 * screen.
 *
 * Sizing is measured with a `ResizeObserver` on the wrapper plus a
 * hidden measurement row that always renders every item at full width.
 * The hidden row gives us a stable per-item width to walk against the
 * live available width.
 *
 * @param props - Item list
 * @returns Nav element
 */
export function CiderpressNavMenu(props: CiderpressNavMenuProps): React.ReactElement {
  // Pull items from props when configured, otherwise fall back to scraping
  // Rspress's hidden `.rp-nav-menu` (it's the source of truth at runtime
  // when the `nav` field isn't exposed on the Rspress site typings).
  const [scrapedItems, setScrapedItems] = useState<readonly CiderpressNavMenuItem[]>([])
  useEffect(() => {
    if (props.items.length > 0) {
      return
    }
    const initial = scrapeNavItems()
    if (initial.length > 0) {
      setScrapedItems(initial)
      return
    }
    const observer = new MutationObserver(() => {
      const fresh = scrapeNavItems()
      if (fresh.length > 0) {
        setScrapedItems(fresh)
        observer.disconnect()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
    }
  }, [props.items])
  const items = useMemo<readonly CiderpressNavMenuItem[]>(
    () =>
      match(props.items.length > 0)
        .with(true, () => props.items)
        .otherwise(() => scrapedItems),
    [props.items, scrapedItems]
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(items.length)
  const [overflowOpen, setOverflowOpen] = useState(false)
  const overflowRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    const container = containerRef.current
    const measure = measureRef.current
    if (container === null || measure === null) {
      return
    }

    // We observe the menu's PARENT (the wrap), not the menu itself.
    // Measuring the menu would self-collapse: when items hide, the
    // menu shrinks, clientWidth drops, the budget shrinks, more items
    // hide. Observing the parent gives us a width that's a function of
    // the layout (not of how many items we currently render).
    const parent = container.parentElement
    if (parent === null) {
      return
    }

    const observer = new ResizeObserver(() => {
      setVisibleCount(computeMenuFit({ measure, parent, container }))
    })
    observer.observe(parent)
    const observedChildren = [...parent.children].filter(
      (child) => child !== container && inLayoutFlow(child)
    )
    observedChildren.map((child) => observer.observe(child))
    setVisibleCount(computeMenuFit({ measure, parent, container }))
    return () => {
      observer.disconnect()
    }
  }, [items])

  useEffect(() => {
    if (!overflowOpen) {
      return
    }
    function onDocClick(event: MouseEvent): void {
      const target = event.target as Node | null
      if (
        target !== null &&
        overflowRef.current !== null &&
        !overflowRef.current.contains(target)
      ) {
        setOverflowOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
    }
  }, [overflowOpen])

  const visible = items.slice(0, visibleCount)
  const overflow = items.slice(visibleCount)
  const hasOverflow = overflow.length > 0

  return (
    <>
      <div ref={measureRef} className="cp-nav-menu-measure" aria-hidden="true">
        {items.map((item, index) => (
          <span
            key={`${itemKey(item)}::${index}`}
            data-cp-menu-item
            className={clsx('cp-nav-menu__item', {
              // Mirror the live dropdown toggle's label→chevron gap so the
              // measured width matches what actually renders inline.
              'cp-nav-menu__item--measured-dropdown': hasChildren(item),
            })}
          >
            {item.text}
            {hasChildren(item) && <Icon icon="pixelarticons:chevron-down" width={12} height={12} />}
          </span>
        ))}
      </div>

      <nav ref={containerRef} className="cp-nav-menu" aria-label="Primary">
        {visible.map((item, index) => (
          <NavMenuEntry key={`${itemKey(item)}::${index}`} item={item} pathname={pathname} />
        ))}
        {hasOverflow && (
          <div ref={overflowRef} className="cp-nav-menu__overflow">
            <button
              type="button"
              className="cp-nav-menu__overflow-toggle"
              onClick={() => setOverflowOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={overflowOpen}
            >
              <span>More</span>
              <Icon icon="pixelarticons:chevron-down" width={12} height={12} />
            </button>
            {overflowOpen && (
              <ul className="cp-nav-menu__overflow-popover" role="menu">
                {overflow.map((item, index) => (
                  <OverflowEntry
                    key={`${itemKey(item)}::${index}`}
                    item={item}
                    pathname={pathname}
                    onNavigate={() => setOverflowOpen(false)}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </nav>
    </>
  )
}

export { CiderpressNavMenu as default }

/**
 * Render a single inline nav entry — a plain link when the item is a
 * leaf, or a hover/click dropdown when it carries child `items`.
 *
 * @private
 * @param props - The nav item and the current pathname.
 * @returns The entry element.
 */
function NavMenuEntry(props: {
  readonly item: CiderpressNavMenuItem
  readonly pathname: string
}): React.ReactElement {
  const { item, pathname } = props
  return match(hasChildren(item))
    .with(true, () => <NavMenuDropdown item={item} pathname={pathname} />)
    .otherwise(() => (
      <RouteLink
        href={item.link ?? '#'}
        className={clsx('cp-nav-menu__item', {
          'cp-nav-menu__item--active': isActiveLink(pathname, item.link),
        })}
      >
        {item.text}
      </RouteLink>
    ))
}

/**
 * A topbar dropdown: a toggle button plus a popover of child links.
 * Opens on hover and on click, closes on outside click, on child
 * navigation, or on `Escape`. The toggle is marked active when the
 * current route matches any child link.
 *
 * @private
 * @param props - The dropdown item and the current pathname.
 * @returns The dropdown element.
 */
function NavMenuDropdown(props: {
  readonly item: CiderpressNavMenuItem
  readonly pathname: string
}): React.ReactElement {
  const { item, pathname } = props
  // Two independent inputs: `hovering` (pointer preview) and `pinned`
  // (an explicit click/tap/Enter latch). The menu is open when either is
  // set. This keeps hover-to-preview and click-to-toggle from fighting —
  // clicking an already-hover-open menu pins it instead of closing it.
  const [hovering, setHovering] = useState(false)
  const [pinned, setPinned] = useState(false)
  const open = hovering || pinned
  const ref = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const children = item.items ?? []

  // Cancel any pending hover-close (mouse re-entered, or an explicit action).
  function cancelClose(): void {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  // Fully close: drop both hover and pin. Used by Escape, outside-click,
  // and child navigation.
  function close(): void {
    cancelClose()
    setHovering(false)
    setPinned(false)
  }

  // Drop the hover preview after a short grace period so brief excursions
  // off the toggle (crossing into the popover, a jittery pointer) don't
  // snap it shut. A pinned menu stays open regardless.
  function scheduleClose(): void {
    cancelClose()
    closeTimer.current = setTimeout(() => setHovering(false), CLOSE_DELAY_MS)
  }

  useEffect(() => () => cancelClose(), [])

  useEffect(() => {
    if (!open) {
      return
    }
    function onDocClick(event: MouseEvent): void {
      const target = event.target as Node | null
      if (target !== null && ref.current !== null && !ref.current.contains(target)) {
        close()
      }
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        close()
        // Return focus to the toggle so a keyboard user isn't stranded
        // on a link that just unmounted.
        if (toggleRef.current !== null) {
          toggleRef.current.focus()
        }
      }
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const active = children.some((child) => isActiveLink(pathname, child.link))

  function handleMouseEnter(): void {
    cancelClose()
    setHovering(true)
  }

  // Close when focus leaves the dropdown entirely (Tab past the last
  // link). Keep it open while focus moves between the toggle and items.
  function handleBlur(event: React.FocusEvent<HTMLDivElement>): void {
    const next = event.relatedTarget
    if (ref.current !== null && next instanceof Node && ref.current.contains(next)) {
      return
    }
    close()
  }

  // Click/tap/Enter is an explicit latch: pin it open, or unpin (and drop
  // any lingering hover) to close. Works identically for mouse, touch,
  // and keyboard.
  function handleToggleClick(): void {
    cancelClose()
    if (pinned) {
      setPinned(false)
      setHovering(false)
      return
    }
    setPinned(true)
  }

  return (
    <div
      ref={ref}
      className="cp-nav-menu__dropdown"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={scheduleClose}
      onBlur={handleBlur}
    >
      <button
        ref={toggleRef}
        type="button"
        className={clsx('cp-nav-menu__item', 'cp-nav-menu__dropdown-toggle', {
          'cp-nav-menu__item--active': active,
        })}
        onClick={handleToggleClick}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span>{item.text}</span>
        <Icon icon="pixelarticons:chevron-down" width={12} height={12} />
      </button>
      {open && (
        <ul className="cp-nav-menu__dropdown-popover" role="menu" aria-label={item.text}>
          {children.map((child, index) => (
            <li key={`${itemKey(child)}::${index}`} role="none">
              <RouteLink
                href={child.link ?? '#'}
                role="menuitem"
                className={clsx('cp-nav-menu__overflow-item', {
                  'cp-nav-menu__overflow-item--active': isActiveLink(pathname, child.link),
                })}
                onClick={close}
              >
                {child.text}
              </RouteLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Render an entry inside the "More" overflow popover. Leaf items become
 * a single menu link; dropdown parents become a labelled group with
 * their children listed beneath.
 *
 * @private
 * @param props - The item, current pathname, and a navigate callback.
 * @returns The overflow entry list element.
 */
function OverflowEntry(props: {
  readonly item: CiderpressNavMenuItem
  readonly pathname: string
  readonly onNavigate: () => void
}): React.ReactElement {
  const { item, pathname, onNavigate } = props
  const children = item.items ?? []
  return match(children.length > 0)
    .with(true, () => (
      <li className="cp-nav-menu__overflow-group" role="none">
        <span className="cp-nav-menu__overflow-group-label" aria-hidden="true">
          {item.text}
        </span>
        <ul className="cp-nav-menu__overflow-sublist" role="menu" aria-label={item.text}>
          {children.map((child, index) => (
            <li key={`${itemKey(child)}::${index}`} role="none">
              <RouteLink
                href={child.link ?? '#'}
                role="menuitem"
                className={clsx('cp-nav-menu__overflow-item', {
                  'cp-nav-menu__overflow-item--active': isActiveLink(pathname, child.link),
                })}
                onClick={onNavigate}
              >
                {child.text}
              </RouteLink>
            </li>
          ))}
        </ul>
      </li>
    ))
    .otherwise(() => (
      <li role="none">
        <RouteLink
          href={item.link ?? '#'}
          role="menuitem"
          className={clsx('cp-nav-menu__overflow-item', {
            'cp-nav-menu__overflow-item--active': isActiveLink(pathname, item.link),
          })}
          onClick={onNavigate}
        >
          {item.text}
        </RouteLink>
      </li>
    ))
}

/**
 * Whether a nav item carries a non-empty `items` array (making it a
 * dropdown parent rather than a leaf).
 *
 * @private
 * @param item - Nav item to test.
 * @returns True when the item has at least one child.
 */
function hasChildren(item: CiderpressNavMenuItem): boolean {
  return item.items !== undefined && item.items.length > 0
}

/**
 * Stable React key for a nav item — its link when present, otherwise
 * its label (dropdown parents may have no link of their own).
 *
 * @private
 * @param item - Nav item to key.
 * @returns Key string.
 */
function itemKey(item: CiderpressNavMenuItem): string {
  if (item.link !== undefined && item.link !== '') {
    return item.link
  }
  return item.text
}

/**
 * Active-route test that tolerates an absent link (dropdown parents),
 * delegating to {@link isActive} only when a link is present.
 *
 * @private
 * @param pathname - Current route pathname.
 * @param link - Item link, possibly undefined.
 * @returns True when the link is present and matches the route.
 */
function isActiveLink(pathname: string, link: string | undefined): boolean {
  if (link === undefined) {
    return false
  }
  return isActive(pathname, link)
}

/**
 * Walk the per-item widths left-to-right, accumulating until we'd
 * exceed the available width. When the accumulator already exceeds the
 * cheap-fit budget, reserve space for the overflow toggle so the toggle
 * itself doesn't push the last visible item out.
 *
 * @private
 */
function computeVisibleCount(params: {
  readonly widths: readonly number[]
  readonly available: number
  readonly gap: number
  readonly overflowReserve: number
}): number {
  const { widths, available, gap, overflowReserve } = params
  // No items, or the container hasn't been laid out yet — assume every
  // item fits. The ResizeObserver will recompute as soon as the
  // container has a real width.
  if (widths.length === 0 || available <= 0) {
    return widths.length
  }

  const fullTotal = widths.reduce((acc, w, i) => acc + w + gapAt(i, gap), 0)
  if (fullTotal <= available) {
    return widths.length
  }

  // Otherwise we know we need overflow; reserve space for the toggle.
  const budget = available - overflowReserve
  const walked = widths.reduce<{
    readonly running: number
    readonly count: number
    readonly done: boolean
  }>(
    (state, width, index) => {
      if (state.done) {
        return state
      }
      const next = state.running + width + gapAt(index, gap)
      if (next > budget) {
        return { ...state, done: true }
      }
      return { running: next, count: state.count + 1, done: false }
    },
    { running: 0, count: 0, done: false }
  )
  return walked.count
}

/**
 * Gap to add before the item at `index` when summing widths. Index 0
 * has no leading gap; subsequent items get the menu's inter-item gap.
 *
 * @private
 * @param index - Position of the item in the width array.
 * @param gap - Inter-item gap in pixels.
 * @returns Leading gap to add before this item.
 */
function gapAt(index: number, gap: number): number {
  if (index === 0) {
    return 0
  }
  return gap
}

/**
 * Reconstruct the primary nav from Rspress's hidden `.rp-nav-menu`,
 * preserving dropdowns. Each top-level `.rp-nav-menu__item` is either a
 * leaf (its container is an anchor) or a dropdown parent (it wraps a
 * `.rp-hover-group` of child links). Items with empty text, or dropdown
 * parents with no usable children, are dropped.
 *
 * @private
 * @returns Nav items currently in the DOM (empty array when not mounted).
 */
function scrapeNavItems(): readonly CiderpressNavMenuItem[] {
  return navMenuRoots()
    .map(scrapeNavItem)
    .filter((item): item is CiderpressNavMenuItem => item !== null)
}

/**
 * Collect the top-level `.rp-nav-menu__item` `<li>`s to scrape. Rspress
 * renders separate left and right nav `<ul>`s; the ciderpress topbar is
 * right-aligned, so we read the right menu and only fall back to the
 * unscoped selector when it isn't present.
 *
 * @private
 * @returns Top-level nav item elements.
 */
function navMenuRoots(): readonly HTMLElement[] {
  const right = document.querySelectorAll<HTMLElement>('.rp-nav-menu--right > .rp-nav-menu__item')
  if (right.length > 0) {
    return [...right]
  }
  return [...document.querySelectorAll<HTMLElement>('.rp-nav-menu > .rp-nav-menu__item')]
}

/**
 * Project a single top-level `.rp-nav-menu__item` element into a nav
 * item, recursing one level into its `.rp-hover-group` dropdown when
 * present.
 *
 * @private
 * @param root - Top-level nav `<li>` element.
 * @returns Parsed nav item, or `null` when unusable.
 */
function scrapeNavItem(root: HTMLElement): CiderpressNavMenuItem | null {
  const container = root.querySelector(':scope > .rp-nav-menu__item__container')
  if (container === null) {
    return null
  }
  const text = readElementText(container)
  if (text === '') {
    return null
  }
  const group = root.querySelector(':scope > .rp-hover-group')
  if (group !== null) {
    const items = scrapeGroupItems(group)
    if (items.length === 0) {
      return null
    }
    return { text, items }
  }
  const href = container.getAttribute('href')
  if (href === null || href === '') {
    return null
  }
  return { text, link: href }
}

/**
 * Read the child links out of a Rspress `.rp-hover-group` dropdown.
 *
 * @private
 * @param group - The `.rp-hover-group` element.
 * @returns Child nav items with text + link (empties dropped).
 */
function scrapeGroupItems(group: Element): readonly CiderpressNavMenuItem[] {
  const anchors = group.querySelectorAll<HTMLAnchorElement>('.rp-hover-group__item__link')
  return [...anchors]
    .map((anchor) => ({
      text: readElementText(anchor),
      link: anchor.getAttribute('href') ?? '',
    }))
    .filter((item) => item.text !== '' && item.link !== '')
}

/**
 * Pull the trimmed text content from an element. Returns an empty
 * string when `textContent` is missing — callers treat empty as "skip
 * this element".
 *
 * @private
 * @param element - Element to read.
 * @returns Trimmed inner text, or empty string when absent.
 */
function readElementText(element: Element): string {
  const text = element.textContent
  if (text === null) {
    return ''
  }
  return text.trim()
}

/**
 * Exclude elements removed from the layout — the hidden measure layer
 * is `position: absolute`, anything `display: none` is gone, anything
 * `visibility: hidden` still occupies space so it stays counted. We
 * only want flex-contributing siblings.
 *
 * @private
 * @param child - Sibling element to test.
 * @returns True when the element contributes to the parent's flex layout.
 */
function inLayoutFlow(child: Element): boolean {
  const cs = globalThis.getComputedStyle(child)
  return cs.display !== 'none' && cs.position !== 'absolute' && cs.position !== 'fixed'
}

/**
 * Compute how many items fit inline given the live layout. Measures
 * each item's full-width footprint from the hidden measure row, then
 * subtracts every layout sibling's width (plus inter-flex gaps) from
 * the parent's clientWidth to derive the budget for the menu strip.
 *
 * @private
 * @param params - Refs to the measure row, container, and parent.
 * @returns Number of items that fit inline.
 */
function computeMenuFit(params: {
  readonly measure: HTMLDivElement
  readonly parent: HTMLElement
  readonly container: HTMLDivElement
}): number {
  const { measure, parent, container } = params
  const itemElements = measure.querySelectorAll<HTMLElement>('[data-cp-menu-item]')
  const widths = [...itemElements].map((el) => el.getBoundingClientRect().width)
  const parentWidth = parent.clientWidth
  const parentGap = parseFloat(globalThis.getComputedStyle(parent).columnGap || '0') || 0
  const layoutSiblings = [...parent.children].filter(
    (child) => child !== container && inLayoutFlow(child)
  )
  const siblingsWidth = layoutSiblings.reduce(
    (sum, child) => sum + child.getBoundingClientRect().width,
    0
  )
  const gapCount = Math.max(0, layoutSiblings.length + 1 - 1)
  const available = Math.max(0, parentWidth - siblingsWidth - gapCount * parentGap)
  return computeVisibleCount({
    widths,
    available,
    gap: DEFAULT_GAP_PX,
    overflowReserve: OVERFLOW_TOGGLE_WIDTH,
  })
}

/**
 * @private
 */
function isActive(pathname: string, link: string): boolean {
  if (link === '/') {
    return pathname === '/'
  }
  return pathname.startsWith(link)
}
