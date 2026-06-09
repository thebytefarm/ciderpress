import { match } from 'massaman/match'
import { useCallback } from 'react'
import type React from 'react'

import { Icon } from '../shared/icon.tsx'

import './variant-toggle.css'

type Variant = 'dark' | 'light'

/**
 * VariantToggle — single button that flips between the active theme's
 * dark and light variants. Both icons (sun + moon) live in the DOM and
 * are toggled purely via CSS against `html[data-cp-variant]`, so the
 * button carries no React state and survives SSR with no hydration
 * mismatch.
 *
 * Hidden via `variant-toggle.css` when the active theme only declares
 * one variant — mirrors the existing `[data-cp-variants]` rule that
 * already hides Rspress's `.rp-switch-appearance`.
 *
 * Click handler mirrors the same DOM + `localStorage` writes the head
 * IIFE and `<ThemeProvider />` perform — keep all three in sync.
 *
 * @returns Toggle button element
 */
export function VariantToggle(): React.ReactElement {
  const handleClick = useCallback(() => {
    const html = document.documentElement
    const next = match(html.dataset.cpVariant)
      .with('light', () => 'dark' as const)
      .otherwise(() => 'light' as const)
    applyVariant({ html, variant: next })
  }, [])

  return (
    <button
      type="button"
      className="cp-variant-toggle"
      onClick={handleClick}
      aria-label="Toggle light and dark mode"
      title="Toggle light and dark mode"
    >
      <span className="cp-variant-toggle__icon cp-variant-toggle__icon--sun">
        <Icon icon="mdi:weather-sunny" width={16} height={16} />
      </span>
      <span className="cp-variant-toggle__icon cp-variant-toggle__icon--moon">
        <Icon icon="mdi:weather-night" width={16} height={16} />
      </span>
    </button>
  )
}

export { VariantToggle as default }

/**
 * Apply the new variant to the DOM and persist it. Mirrors the writes
 * performed by `buildHeadScriptBody` (head IIFE in
 * `packages/ui/src/config.ts`) and `<ThemeProvider />`'s `applyVariant`
 * so the three sources of truth never diverge.
 *
 * @private
 * @param params - HTML element and target variant
 */
function applyVariant(params: { readonly html: HTMLElement; readonly variant: Variant }): void {
  const { html, variant } = params
  html.dataset.cpVariant = variant
  match(variant)
    .with('dark', () => {
      html.classList.add('rp-dark', 'dark')
      html.dataset.dark = 'true'
    })
    .otherwise(() => {
      html.classList.remove('rp-dark', 'dark')
      html.dataset.dark = 'false'
    })
  try {
    localStorage.setItem('rspress-theme-appearance', variant)
    localStorage.setItem('ciderpress-variant', variant)
  } catch {
    // storage unavailable (privacy mode, quota) — DOM is still correct
  }
}
