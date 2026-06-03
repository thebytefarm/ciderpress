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
      setItems(initial)
      return
    }

    const observer = new MutationObserver(() => {
      const next = scrape()
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
