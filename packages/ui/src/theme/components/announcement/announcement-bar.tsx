import { match } from 'massaman/match'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { RouteLink } from '../../lib/route-link.tsx'
import { safeUrl } from '../../lib/safe-url.ts'

import './announcement-bar.css'

const STORAGE_PREFIX = 'ciderpress-announcement-dismissed:'
/**
 * Initial height assumption before the bar mounts and measures itself.
 * Matches the value Rspress's own `<Banner />` uses (`useState(36)`) so
 * downstream sticky offsets are roughly correct on the first paint.
 */
const INITIAL_HEIGHT = 36

export interface AnnouncementBarProps {
  /**
   * Stable ID — when present, dismissal is remembered in localStorage.
   */
  readonly id?: string
  /**
   * Lead text. Use for the highlighted phrase ("ciderpress 1.0", "NEW:", etc).
   */
  readonly lead?: React.ReactNode
  /**
   * Body of the announcement.
   */
  readonly children: React.ReactNode
  /**
   * Optional CTA link rendered after the message.
   */
  readonly cta?: { readonly href: string; readonly label: string }
  /**
   * Hide the dismiss button.
   */
  readonly persistent?: boolean
}

/**
 * AnnouncementBar — full-width banner rendered above the topbar via the
 * Layout `top` slot. Ships with a pulsing accent dot and an optional
 * dismiss button that persists in localStorage when an `id` is provided.
 *
 * @param props - AnnouncementBar configuration.
 * @returns React element, or null when the bar has been dismissed.
 */
export function AnnouncementBar(props: AnnouncementBarProps): React.ReactElement | null {
  const { id, lead, children, cta, persistent } = props
  const [dismissed, setDismissed] = useState(() => readDismissed(id))
  // Track the rendered height so downstream sticky offsets
  // (`--rp-nav-height` calc + the docs bar's sticky `top`) clear the
  // announcement bar without anybody hardcoding a number. Mirrors the
  // pattern Rspress's own `<Banner />` uses: a state value + a
  // callback ref + a sibling `<style>` tag exposing the value as a
  // CSS variable.
  const [height, setHeight] = useState(INITIAL_HEIGHT)
  const measureRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setDismissed(readDismissed(id))
  }, [id])

  const handleDismiss = useCallback(() => {
    writeDismissed(id)
    setDismissed(true)
  }, [id])

  const setMeasureRef = useCallback((element: HTMLDivElement | null) => {
    measureRef.current = element
    if (element !== null && element.offsetHeight > 0) {
      setHeight(element.offsetHeight)
    }
  }, [])

  return match(dismissed)
    .with(true, () => null)
    .otherwise(() => (
      <>
        <div ref={setMeasureRef} className="cp-announce" role="region" aria-label="Announcement">
          <span className="cp-announce__pulse" aria-hidden="true" />
          <span className="cp-announce__msg">
            {match(lead)
              .with(undefined, () => null)
              .otherwise((l) => (
                <em className="cp-announce__lead">{l}</em>
              ))}{' '}
            {children}
            {match(cta)
              .with(undefined, () => null)
              .otherwise((c) => {
                const href = safeUrl(c.href)
                if (href === null) {
                  return null
                }
                return (
                  <RouteLink className="cp-announce__cta" href={href}>
                    {c.label} →
                  </RouteLink>
                )
              })}
          </span>
          {match(persistent === true)
            .with(true, () => null)
            .otherwise(() => (
              <button
                className="cp-announce__close"
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss announcement"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            ))}
        </div>
        {/* Expose the measured height as a CSS variable so the docs
            bar's sticky `top:` and the `--rp-nav-height` calc clear
            the announcement without anybody hardcoding 36px. Pattern
            cribbed directly from Rspress's `<Banner />`. */}
        <style>{`:root { --cp-announcement-height: ${height}px; }`}</style>
      </>
    ))
}

/**
 * Read the dismissed flag from localStorage.
 *
 * @private
 * @param id - Announcement ID, or undefined.
 * @returns true when the announcement has been dismissed.
 */
function readDismissed(id: string | undefined): boolean {
  return match(id)
    .with(undefined, () => false)
    .otherwise((key) => {
      if (globalThis.window === undefined) {
        return false
      }
      try {
        return globalThis.localStorage.getItem(STORAGE_PREFIX + key) === '1'
      } catch {
        return false
      }
    })
}

/**
 * Persist the dismissed flag to localStorage.
 *
 * @private
 * @param id - Announcement ID, or undefined.
 */
function writeDismissed(id: string | undefined): void {
  match(id)
    .with(undefined, () => {})
    .otherwise((key) => {
      try {
        globalThis.localStorage.setItem(STORAGE_PREFIX + key, '1')
      } catch {
        // ignore — storage may be unavailable
      }
    })
}
