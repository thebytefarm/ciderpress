import type { GlobalProvider } from '@ladle/react'
import { match } from 'massaman/match'
import { useEffect, useState } from 'react'
import type React from 'react'

// Theme palette CSS — order mirrors `src/theme/index.tsx`. Mulled is loaded
// first because it doubles as the FOUC fallback in production.
import '../src/theme/styles/layers.css'
import '../src/theme/styles/overrides/fonts.css'
import '../src/theme/styles/overrides/tokens.css'
import '../src/theme/styles/themes/mulled.css'
import '../src/theme/styles/themes/honeycrisp.css'
import '../src/theme/styles/themes/grannysmith.css'
import '../src/theme/styles/themes/amber.css'
import '../src/theme/styles/themes/midnight.css'
import '../src/theme/styles/themes/arcade.css'
import '../src/theme/styles/themes/arcade-fx.css'

// Component CSS — pull in everything stories under shared/ can reach for.
import '../src/theme/components/shared/browser-window.css'
import '../src/theme/components/shared/desktop-window.css'
import '../src/theme/components/shared/status-badge.css'
import '../src/theme/components/shared/accordion.css'
import '../src/theme/components/shared/columns.css'
import '../src/theme/components/shared/field.css'
import '../src/theme/components/shared/frame.css'
import '../src/theme/components/shared/prompt.css'
import '../src/theme/components/shared/steps.css'
import '../src/theme/components/shared/tooltip.css'

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
 * @param props - Ladle global provider props (children + globalState)
 * @returns Wrapped story with theme controls
 */
export const Provider: GlobalProvider = ({ children, globalState }) => {
  const [theme, setTheme] = useState<ThemeName>(readStoredTheme)

  useEffect(() => {
    const html = document.documentElement
    html.dataset.cpTheme = theme
    html.dataset.cpReady = 'true'
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
            <button
              key={name}
              type="button"
              className={className}
              onClick={() => onChange(name)}
            >
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
  if (typeof window === 'undefined') {
    return 'mulled'
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
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
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, name)
  } catch {
    // storage unavailable
  }
}
