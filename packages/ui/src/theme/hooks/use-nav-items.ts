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
 * Read every anchor under Rspress's hidden `.rp-nav-menu` and project
 * it into a `{ text, link }` item. Anchors with empty text or `href`
 * are dropped so we never surface a placeholder entry.
 *
 * @private
 * @returns Nav items currently in the DOM (empty array when not mounted).
 */
function scrapeNavItems(): readonly CiderpressNavMenuItem[] {
  const anchors = document.querySelectorAll<HTMLAnchorElement>('.rp-nav-menu .rp-nav-menu__item a')
  return [...anchors]
    .map((anchor) => ({
      text: readAnchorText(anchor),
      // Rspress's rendered hrefs already include the site `base`; strip it so
      // the consuming `<Link>` re-applies it once instead of doubling the mount
      // prefix on subpath deploys (the `/examples/<slug>/examples/<slug>/…` 404).
      link: removeBase(anchor.getAttribute('href') ?? ''),
    }))
    .filter((item) => item.text !== '' && item.link !== '')
}

/**
 * Pull the trimmed text content from an anchor. Returns an empty
 * string when `textContent` is missing — callers treat empty as "skip
 * this anchor".
 *
 * @private
 * @param anchor - Anchor element to read.
 * @returns Trimmed inner text, or empty string when absent.
 */
function readAnchorText(anchor: HTMLAnchorElement): string {
  const text = anchor.textContent
  if (text === null) {
    return ''
  }
  return text.trim()
}
