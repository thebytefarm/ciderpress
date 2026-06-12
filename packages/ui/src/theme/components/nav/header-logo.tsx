/* oxlint-disable no-ternary -- raw-copied file; relaxed rules per packages/ui/CLAUDE.md */
import type { CiderpressConfig, LogoFn, LogoImage } from '@ciderpress/config'
// oxlint-disable-next-line import/no-unresolved -- alias provided by createRspressConfig's resolve.alias
import userConfigModule from '@ciderpress/internal/user-config'
import { BRAND_COLORS, DEFAULT_THEME_NAME } from '@ciderpress/theme'
import React, { useEffect, useState } from 'react'

import './header-logo.css'

interface ThemeContext {
  readonly name: string
  readonly variant: 'light' | 'dark'
  readonly isDark: boolean
  readonly colors: {
    readonly brand: string
    readonly brandHover: string
    readonly brandSoft: string
    readonly bg: string
    readonly text: string
  }
}

const COLOR_VARS = Object.freeze({
  brand: '--rp-c-brand',
  brandHover: '--rp-c-brand-dark',
  brandSoft: '--rp-c-brand-tint',
  bg: '--rp-c-bg',
  text: '--rp-c-text-1',
})

const DEFAULT_BRAND = BRAND_COLORS[DEFAULT_THEME_NAME]
const FALLBACK_COLORS = Object.freeze({
  brand: DEFAULT_BRAND.primary,
  brandHover: DEFAULT_BRAND.hover,
  brandSoft: DEFAULT_BRAND.soft,
  bg: '#ffffff',
  text: '#1f2937',
})

/**
 * Brand mark rendered inside `<RouteLink className="cp-header-logo">`
 * by `<CiderpressHeader />`.
 *
 * Reads `userConfig.logo` from the bundled user config (same
 * `@ciderpress/internal/user-config` alias `NavLogo` uses) and renders:
 *
 * - `string` → `<img src={...}>` pointed at the user's asset path.
 * - `LogoFn` → call with the live theme context. `LogoImage` returns
 *   render as `<img>`; React node returns render as-is. Re-renders
 *   when `data-cp-theme` / `data-cp-variant` flips so theme-aware
 *   logos retint without a reload.
 * - missing → the framework's themed `<CiderpressLogo />` wordmark.
 *
 * Replaces the prior approach where the header was hardcoded to
 * `<CiderpressLogo />` and the user's logo was forwarded only to
 * Rspress's nav slot — which renders at 1×1 on landing pages.
 *
 * @returns Branded logo element ready to drop inside `cp-header-logo`
 */
export function HeaderLogo(): React.ReactElement | null {
  const logoConfig = readLogoConfig(userConfigModule)
  const [themeContext, setThemeContext] = useState<ThemeContext | null>(null)

  useEffect(() => {
    if (typeof logoConfig !== 'function') {
      return
    }
    const html = globalThis.document.documentElement
    setThemeContext(readThemeContext(html))

    const observer = new MutationObserver(() => {
      setThemeContext(readThemeContext(html))
    })
    observer.observe(html, {
      attributes: true,
      attributeFilter: ['data-cp-theme', 'data-cp-variant', 'class', 'style'],
    })
    return () => observer.disconnect()
  }, [logoConfig])

  if (logoConfig === undefined) {
    // Default: the auto-generated `/logo.svg` written to the public dir
    // by the banner module at sync time (derived from `config.title`).
    // Sites that committed their own `public/logo.svg` already win here.
    // The `<CiderpressLogo />` framework wordmark is opt-in via
    // `logo: ({ theme }) => <CiderpressLogo />`.
    return <img src="/logo.svg" alt="" className="cp-header-logo__img" />
  }

  if (typeof logoConfig === 'string') {
    return <img src={logoConfig} alt="" className="cp-header-logo__img" />
  }

  if (themeContext === null) {
    // Function-form logo: render nothing for a frame instead of flashing
    // the ciderpress wordmark while themeContext resolves. The user's
    // logo appears as soon as the layout effect runs.
    return null
  }

  const result = logoConfig({ theme: themeContext })
  if (isLogoImage(result)) {
    return (
      <img
        src={result.src}
        alt={result.alt ?? ''}
        width={result.width}
        height={result.height}
        className="cp-header-logo__img"
      />
    )
  }
  return <>{result as React.ReactNode}</>
}

export { HeaderLogo as default }

/**
 * Extract the `logo` field from the bundled user config module.
 *
 * @private
 * @param mod - Module imported from `@ciderpress/internal/user-config`
 * @returns The `logo` value or `undefined` when none is configured
 */
function readLogoConfig(mod: unknown): string | LogoFn | undefined {
  if (mod === null || mod === undefined) {
    return undefined
  }
  const asRecord = mod as Record<string, unknown>
  const candidate =
    asRecord.default !== null && asRecord.default !== undefined
      ? (asRecord.default as Partial<CiderpressConfig>)
      : (mod as Partial<CiderpressConfig>)
  const { logo } = candidate
  if (typeof logo === 'string') {
    return logo
  }
  if (typeof logo === 'function') {
    return logo
  }
  return undefined
}

/**
 * Type guard distinguishing a `LogoImage` object from a React element.
 *
 * @private
 * @param value - Return value from a `LogoFn`
 * @returns True when `value` should be spread onto an `<img>` element
 */
function isLogoImage(value: unknown): value is LogoImage {
  if (value === null || typeof value !== 'object') {
    return false
  }
  const obj = value as Record<string, unknown>
  if ('$$typeof' in obj) {
    return false
  }
  return typeof obj.src === 'string'
}

/**
 * Build the live `ThemeContext` passed to a function-form `logo`.
 *
 * @private
 * @param html - Document root element
 * @returns Live theme context snapshot
 */
function readThemeContext(html: HTMLElement): ThemeContext {
  const variant: 'light' | 'dark' = html.dataset.cpVariant === 'light' ? 'light' : 'dark'
  const name = typeof html.dataset.cpTheme === 'string' ? html.dataset.cpTheme : DEFAULT_THEME_NAME

  const styles = globalThis.window.getComputedStyle(html)
  function read(cssVar: string, fallback: string): string {
    const raw = styles.getPropertyValue(cssVar).trim()
    if (raw.length === 0) {
      return fallback
    }
    return raw
  }

  return {
    name,
    variant,
    isDark: variant === 'dark',
    colors: {
      brand: read(COLOR_VARS.brand, FALLBACK_COLORS.brand),
      brandHover: read(COLOR_VARS.brandHover, FALLBACK_COLORS.brandHover),
      brandSoft: read(COLOR_VARS.brandSoft, FALLBACK_COLORS.brandSoft),
      bg: read(COLOR_VARS.bg, FALLBACK_COLORS.bg),
      text: read(COLOR_VARS.text, FALLBACK_COLORS.text),
    },
  }
}
