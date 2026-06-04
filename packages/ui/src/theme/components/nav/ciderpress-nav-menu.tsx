import { useLocation } from '@rspress/core/runtime'
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
 * Single primary-nav entry — matches the shape of `site.nav[*]` in
 * `ciderpress.config.ts`.
 */
export interface CiderpressNavMenuItem {
  readonly text: string
  readonly link: string
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
    const scrape = (): readonly CiderpressNavMenuItem[] => {
      const anchors = document.querySelectorAll<HTMLAnchorElement>(
        '.rp-nav-menu .rp-nav-menu__item a'
      )
      const result: CiderpressNavMenuItem[] = []
      for (const anchor of anchors) {
        const text = anchor.textContent?.trim() ?? ''
        const link = anchor.getAttribute('href') ?? ''
        if (text !== '' && link !== '') {
          result.push({ text, link })
        }
      }
      return result
    }
    const initial = scrape()
    if (initial.length > 0) {
      setScrapedItems(initial)
      return
    }
    const observer = new MutationObserver(() => {
      const fresh = scrape()
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
    () => (props.items.length > 0 ? props.items : scrapedItems),
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

    const inLayoutFlow = (child: Element): boolean => {
      // Exclude elements removed from the layout (the hidden measure
      // layer is `position: absolute`, anything `display: none` is
      // gone, anything `visibility: hidden` still occupies space so
      // it stays counted). We only want flex-contributing siblings.
      const cs = window.getComputedStyle(child)
      return cs.display !== 'none' && cs.position !== 'absolute' && cs.position !== 'fixed'
    }

    const recompute = (): void => {
      const itemElements = measure.querySelectorAll<HTMLElement>('[data-cp-menu-item]')
      const widths = Array.from(itemElements).map((el) => el.getBoundingClientRect().width)
      // Available room for the menu = parent width minus every layout
      // sibling's width minus the parent's flex gap between them.
      const parentWidth = parent.clientWidth
      const parentGap = parseFloat(getComputedStyle(parent).columnGap || '0') || 0
      const layoutSiblings: Element[] = []
      for (const child of parent.children) {
        if (child === container) {
          continue
        }
        if (!inLayoutFlow(child)) {
          continue
        }
        layoutSiblings.push(child)
      }
      const siblingsWidth = layoutSiblings.reduce(
        (sum, child) => sum + child.getBoundingClientRect().width,
        0
      )
      // gap × (layout-children count − 1), where layout-children includes
      // the menu container itself plus every layout sibling.
      const gapCount = Math.max(0, layoutSiblings.length + 1 - 1)
      const available = Math.max(0, parentWidth - siblingsWidth - gapCount * parentGap)
      const totals = computeVisibleCount({
        widths,
        available,
        gap: DEFAULT_GAP_PX,
        overflowReserve: OVERFLOW_TOGGLE_WIDTH,
      })
      setVisibleCount(totals)
    }

    const observer = new ResizeObserver(recompute)
    observer.observe(parent)
    for (const child of parent.children) {
      if (child !== container && inLayoutFlow(child)) {
        observer.observe(child)
      }
    }
    recompute()
    return () => {
      observer.disconnect()
    }
  }, [items])

  useEffect(() => {
    if (!overflowOpen) {
      return
    }
    const onDocClick = (event: MouseEvent): void => {
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
        {items.map((item) => (
          <span key={item.link} data-cp-menu-item className="cp-nav-menu__item">
            {item.text}
          </span>
        ))}
      </div>

      <nav ref={containerRef} className="cp-nav-menu" aria-label="Primary">
        {visible.map((item) => (
          <RouteLink
            key={item.link}
            href={item.link}
            className={
              isActive(pathname, item.link)
                ? 'cp-nav-menu__item cp-nav-menu__item--active'
                : 'cp-nav-menu__item'
            }
          >
            {item.text}
          </RouteLink>
        ))}
        {hasOverflow ? (
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
            {overflowOpen ? (
              <ul className="cp-nav-menu__overflow-popover" role="menu">
                {overflow.map((item) => (
                  <li key={item.link} role="none">
                    <RouteLink
                      href={item.link}
                      role="menuitem"
                      className={
                        isActive(pathname, item.link)
                          ? 'cp-nav-menu__overflow-item cp-nav-menu__overflow-item--active'
                          : 'cp-nav-menu__overflow-item'
                      }
                      onClick={() => setOverflowOpen(false)}
                    >
                      {item.text}
                    </RouteLink>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </nav>
    </>
  )
}

export { CiderpressNavMenu as default }

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

  const fullTotal = widths.reduce((acc, w, i) => acc + w + (i > 0 ? gap : 0), 0)
  if (fullTotal <= available) {
    return widths.length
  }

  // Otherwise we know we need overflow; reserve space for the toggle.
  const budget = available - overflowReserve
  // oxlint-disable-next-line functional/no-let -- accumulator for budget walk
  let running = 0
  // oxlint-disable-next-line functional/no-let -- counter for fit walk
  let count = 0
  for (const [index, width] of widths.entries()) {
    const next = running + width + (index > 0 ? gap : 0)
    if (next > budget) {
      break
    }
    running = next
    count += 1
  }
  return count
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
