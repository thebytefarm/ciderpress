import type { GlobalProvider } from '@ladle/react'
import { match } from 'massaman/match'
import { useEffect, useState } from 'react'
import type React from 'react'

// Rspress base — mirrors `@rspress/core/dist/theme/styles/index.js`. Must
// load first so `--rp-c-*`, `--rp-radius`, `--rp-shadow-*`, preflight
// resets, and the body typography exist before any ciderpress override
// tries to consume them. `nprogress/nprogress.css` is skipped (route
// progress bar isn't relevant in a stories harness).
import '@rspress/core/dist/theme/styles/vars/brand-vars.css'
import '@rspress/core/dist/theme/styles/vars/shiki-vars.css'
import '@rspress/core/dist/theme/styles/vars/code-vars.css'
import '@rspress/core/dist/theme/styles/vars/home-vars.css'
import '@rspress/core/dist/theme/styles/vars/base-vars.css'
import '@rspress/core/dist/theme/styles/base.css'
import '@rspress/core/dist/theme/styles/scrollbar.css'
import '@rspress/core/dist/theme/styles/shiki.css'
// Full theme cascade — mirrors `src/theme/index.tsx` exactly so every
// `.cp-*` and `.rp-*` selector resolves the same way it does on the live
// docs site. Order matters: layers > fonts > tokens > rspress reset >
// palette CSS > overrides > component CSS. Component-colocated CSS files
// (browser-window.css, desktop-window.css, etc.) are picked up
// automatically when their `.tsx` is imported by a story.
import '../src/theme/styles/layers.css'
import '../src/theme/styles/overrides/fonts.css'
import '../src/theme/styles/overrides/tokens.css'
import '../src/theme/styles/overrides/rspress.css'
import '../src/theme/styles/themes/mulled.css'
import '../src/theme/styles/themes/honeycrisp.css'
import '../src/theme/styles/themes/grannysmith.css'
import '../src/theme/styles/themes/amber.css'
import '../src/theme/styles/themes/midnight.css'
import '../src/theme/styles/themes/arcade.css'
import '../src/theme/styles/themes/arcade-fx.css'
import '../src/theme/styles/overrides/details.css'
import '../src/theme/styles/overrides/scrollbar.css'
import '../src/theme/styles/overrides/rail.css'
import '../src/theme/styles/overrides/sidebar.css'
import '../src/theme/styles/overrides/content-footer.css'
import '../src/theme/styles/overrides/home.css'
import '../src/theme/styles/overrides/home-card.css'
import '../src/theme/styles/overrides/section-card.css'
import '../src/theme/styles/overrides/vscode.css'
import '../src/theme/styles/overrides/badge.css'
import '../src/theme/components/announcement/announcement-bar.css'
import '../src/theme/components/ask-ai/ask-ai-button.css'
import '../src/theme/components/content-footer/feedback.css'
import '../src/theme/components/content-footer/meta-actions.css'
import '../src/theme/components/content-footer/page-pager.css'
import '../src/theme/components/sidebar/framework-picker.css'
import '../src/theme/components/sidebar/sidebar-promo.css'
import '../src/theme/components/sidebar/sidebar-toggle.css'
import '../src/theme/components/home/page-rail.css'
import '../src/theme/components/home/hero.css'
import '../src/theme/components/home/hero-demo.css'
import '../src/theme/components/home/trust-strip.css'
import '../src/theme/components/home/split.css'
import '../src/theme/components/home/cta.css'
import '../src/theme/components/nav/nav-logo.css'
import '../src/theme/components/nav/version-chip.css'
import '../src/theme/components/nav/topbar-cta.css'
import '../src/theme/components/openapi/openapi.css'
import '../src/theme/components/shared/accordion.css'
import '../src/theme/components/shared/columns.css'
import '../src/theme/components/shared/status-badge.css'
import '../src/theme/components/shared/frame.css'
import '../src/theme/components/shared/tooltip.css'
import '../src/theme/components/shared/prompt.css'
import '../src/theme/components/shared/color.css'
import '../src/theme/components/shared/steps.css'
import '../src/theme/components/shared/field.css'
import './ladle.css'

/**
 * Available built-in theme palettes. Keep in sync with the imports above
 * and with `packages/theme/src/themes/*`.
 */
const THEMES = ['mulled', 'honeycrisp', 'grannysmith', 'amber', 'midnight', 'arcade'] as const

type ThemeName = (typeof THEMES)[number]

/**
 * localStorage key used to persist the selected palette across reloads.
 */
const STORAGE_KEY = 'ciderpress-ladle-theme'

/**
 * Global Ladle Provider — wires Ladle's light/dark switcher to
 * `data-cp-variant` and exposes an in-page palette picker that drives
 * `data-cp-theme` on `<html>`.
 *
 * Must be `export const` — Ladle's Babel-driven story discovery reads
 * `declaration.declarations[0]` and crashes on `function` declarations.
 *
 * @param props - Ladle global provider props (children + globalState)
 * @returns Wrapped story with theme controls
 */
// oxlint-disable-next-line func-style -- Ladle's parser requires `export const`
export const Provider: GlobalProvider = ({ children, globalState }) => {
  const [theme, setTheme] = useState<ThemeName>(readStoredTheme)

  useEffect(() => {
    const html = document.documentElement
    html.dataset.cpTheme = theme
    writeStoredTheme(theme)
  }, [theme])

  useEffect(() => {
    const html = document.documentElement
    const variant = match(globalState.theme)
      .with('light', () => 'light')
      .otherwise(() => 'dark')
    html.dataset.cpVariant = variant
    match(variant)
      .with('dark', () => {
        html.classList.add('rp-dark', 'dark')
      })
      .otherwise(() => {
        html.classList.remove('rp-dark', 'dark')
      })
  }, [globalState.theme])

  return (
    <div className="cp-ladle-shell">
      <ThemePicker value={theme} onChange={setTheme} />
      <div className="cp-ladle-canvas">{children}</div>
    </div>
  )
}

interface ThemePickerProps {
  readonly value: ThemeName
  readonly onChange: (next: ThemeName) => void
}

/**
 * Inline palette picker rendered above every story. Lets reviewers
 * switch `data-cp-theme` without leaving the canvas.
 *
 * @private
 * @param props - Current palette and change handler
 * @returns Header element with palette buttons
 */
function ThemePicker({ value, onChange }: ThemePickerProps): React.ReactElement {
  return (
    <header className="cp-ladle-picker">
      <span className="cp-ladle-picker__label">Palette</span>
      <div className="cp-ladle-picker__group">
        {THEMES.map((name) => {
          const className = match(name === value)
            .with(true, () => 'cp-ladle-picker__btn cp-ladle-picker__btn--active')
            .otherwise(() => 'cp-ladle-picker__btn')
          return (
            <button key={name} type="button" className={className} onClick={() => onChange(name)}>
              {name}
            </button>
          )
        })}
      </div>
    </header>
  )
}

/**
 * Read the persisted palette name from localStorage. Returns the default
 * when storage is unavailable or holds an unrecognised value.
 *
 * @private
 * @returns Resolved palette name
 */
function readStoredTheme(): ThemeName {
  if (globalThis.window === undefined) {
    return 'mulled'
  }
  try {
    const raw = globalThis.window.localStorage.getItem(STORAGE_KEY)
    const found = THEMES.find((t) => t === raw)
    return match(found)
      .with(undefined, () => 'mulled' as ThemeName)
      .otherwise((t) => t)
  } catch {
    return 'mulled'
  }
}

/**
 * Persist the selected palette name. Silently ignores storage errors.
 *
 * @private
 * @param name - Palette name to persist
 */
function writeStoredTheme(name: ThemeName): void {
  if (globalThis.window === undefined) {
    return
  }
  try {
    globalThis.window.localStorage.setItem(STORAGE_KEY, name)
  } catch {
    // storage unavailable
  }
}
