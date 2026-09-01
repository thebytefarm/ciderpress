import type { BannerFn, CiderpressConfig, ImageSource, LogoContext } from '@ciderpress/config'
// oxlint-disable-next-line import/no-unresolved -- alias provided by createRspressConfig's resolve.alias
import userConfigModule from '@ciderpress/internal/user-config'
import { BRAND_COLORS, DEFAULT_THEME_NAME } from '@ciderpress/theme'
import React, { useEffect, useState } from 'react'

import { withMountBase } from '../../lib/with-mount-base.ts'

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
const FALLBACK_THEME: LogoContext = Object.freeze({
  name: DEFAULT_THEME_NAME,
  variant: 'dark',
  isDark: true,
  colors: FALLBACK_COLORS,
})

/**
 * Resolve and render a function-valued `brand.banner` with the live theme context.
 *
 * @returns Theme-aware banner content, an image, or null.
 */
export function HeroBanner(): React.ReactElement | null {
  const banner = readBannerConfig(userConfigModule)
  const theme = useThemeContext(typeof banner === 'function')

  if (typeof banner !== 'function') {
    return null
  }

  return <>{renderBanner({ banner, theme })}</>
}

interface RenderBannerParams {
  readonly banner: BannerFn
  readonly theme: LogoContext
}

/**
 * Invoke a banner function and normalize image returns into elements.
 *
 * @private
 * @param params - Banner function and active theme context.
 * @returns Renderable banner content.
 */
function renderBanner(params: RenderBannerParams): React.ReactNode {
  const result = params.banner({ theme: params.theme })
  if (typeof result === 'string') {
    return <img src={withMountBase(result)} alt="" />
  }
  if (isImageSource(result)) {
    return (
      <img
        src={withMountBase(result.src)}
        alt={result.alt ?? ''}
        width={result.width}
        height={result.height}
      />
    )
  }
  return result as React.ReactNode
}

/**
 * Read a function-valued banner from the bundled user config.
 *
 * @private
 * @param mod - User config module or its default export.
 * @returns Banner function when configured.
 */
function readBannerConfig(mod: unknown): BannerFn | undefined {
  if (mod === null || mod === undefined) {
    return undefined
  }
  const record = mod as Record<string, unknown>
  const candidate = readConfigExport({ mod, record })
  const brand = candidate.brand
  if (brand === undefined || typeof brand.banner !== 'function') {
    return undefined
  }
  return brand.banner
}

interface ReadConfigExportParams {
  readonly mod: unknown
  readonly record: Record<string, unknown>
}

/**
 * Normalize default and direct user-config module exports.
 *
 * @private
 * @param params - Raw module and record view.
 * @returns Partial Ciderpress config.
 */
function readConfigExport(params: ReadConfigExportParams): Partial<CiderpressConfig> {
  if (params.record.default !== null && params.record.default !== undefined) {
    return params.record.default as Partial<CiderpressConfig>
  }
  return params.mod as Partial<CiderpressConfig>
}

/**
 * Subscribe to theme changes only when a runtime banner needs them.
 *
 * @private
 * @param enabled - Whether the banner is function-valued.
 * @returns Server-safe default context followed by the live browser context.
 */
function useThemeContext(enabled: boolean): LogoContext {
  const [theme, setTheme] = useState<LogoContext>(FALLBACK_THEME)

  useEffect(() => {
    if (!enabled) {
      return
    }
    const html = globalThis.document.documentElement
    function update(): void {
      return setTheme(readThemeContext(html))
    }
    update()

    const observer = new MutationObserver(update)
    observer.observe(html, {
      attributes: true,
      attributeFilter: ['data-cp-theme', 'data-cp-variant', 'class', 'style'],
    })
    return () => observer.disconnect()
  }, [enabled])

  return theme
}

/**
 * Distinguish a structured image source from a React element.
 *
 * @private
 * @param value - Banner return value.
 * @returns Whether the value is an image source object.
 */
function isImageSource(value: unknown): value is Exclude<ImageSource, string> {
  if (value === null || typeof value !== 'object') {
    return false
  }
  const record = value as Record<string, unknown>
  if ('$$typeof' in record) {
    return false
  }
  return typeof record.src === 'string'
}

/**
 * Build the live theme context passed to `brand.banner`.
 *
 * @private
 * @param html - Document root element.
 * @returns Current theme snapshot.
 */
function readThemeContext(html: HTMLElement): LogoContext {
  const variant = readVariant(html)
  const name = readThemeName(html)
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

/**
 * Read the active color variant from the document root.
 *
 * @private
 * @param html - Document root element.
 * @returns Active variant.
 */
function readVariant(html: HTMLElement): 'light' | 'dark' {
  if (html.dataset.cpVariant === 'light') {
    return 'light'
  }
  return 'dark'
}

/**
 * Read the active theme name from the document root.
 *
 * @private
 * @param html - Document root element.
 * @returns Active theme name.
 */
function readThemeName(html: HTMLElement): string {
  if (typeof html.dataset.cpTheme === 'string') {
    return html.dataset.cpTheme
  }
  return DEFAULT_THEME_NAME
}
