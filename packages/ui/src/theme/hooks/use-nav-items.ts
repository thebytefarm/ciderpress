import { removeBase } from '@rspress/core/runtime'
import { useEffect, useState } from 'react'

import type { CiderpressNavMenuItem } from '../components/nav/ciderpress-nav-menu'

/**
 * Hook that yields the primary nav items.
 *
 * Rspress's `site` object doesn't surface its top-level `nav` field on
 * the public typings reachable from a custom layout. We fall back to
 * scraping the items off Rspress's auto-rendered `.rp-nav-menu` (which
 * is mounted but visually hidden by `<CiderpressHeader />`). A
 * `MutationObserver` retries if the items haven't been written into
 * the DOM by first paint.
 *
 * @returns Live array of `{ text, link }` items; empty until Rspress mounts
 */
export function useNavItems(): readonly CiderpressNavMenuItem[] {
  const [items, setItems] = useState<readonly CiderpressNavMenuItem[]>([])

  useEffect(() => {
    const initial = scrapeNavItems()
    if (initial.length > 0) {
      setItems(initial)
      return
    }

    const observer = new MutationObserver(() => {
      const next = scrapeNavItems()
      if (next.length > 0) {
        setItems(next)
        observer.disconnect()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
    }
  }, [])

  return items
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
  // Un-base the scraped href so `<Link>` re-applies the site `base` once
  // rather than doubling the mount prefix on subpath deploys.
  return { text, link: removeBase(href) }
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
      // Rspress's rendered hrefs already include the site `base`; strip it so
      // the consuming `<Link>` re-applies it once instead of doubling the mount
      // prefix on subpath deploys (the `/examples/<slug>/examples/<slug>/…` 404).
      link: removeBase(anchor.getAttribute('href') ?? ''),
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
