import { BRAND_COLORS, DEFAULT_THEME_NAME } from '@ciderpress/theme'

/**
 * Sync the document favicon with the active theme's brand color.
 *
 * Browsers cache favicons aggressively and don't honour CSS custom
 * properties inside referenced SVGs, so a static `/icon.svg` always
 * paints with whatever colour the asset shipped with. To keep the tab
 * mark in lockstep with the active theme (mulled burgundy, honeycrisp
 * red, grannysmith green, amber hearth, midnight blue, arcade neon, …),
 * we read the resolved `--cp-c-brand-1` / `--cp-c-brand-3` values off
 * `<html>`, bake them into a fresh pixel-apple SVG, and point
 * `<link rel="icon">` at the resulting data URI. Browsers treat a new
 * data URI as a new icon resource and repaint the tab.
 *
 * Safe to call as often as needed — idempotent and inexpensive.
 *
 * @param html - Document root element (`<html>`)
 */
export function syncThemeFavicon(html: HTMLElement): void {
  const brand = resolveBrandColor(html)
  const shadow = resolveBrandShadow(html)
  const surface = resolveSurfaceColor(html)
  const dataUri = buildIconDataUri(brand, shadow, surface)
  const link = ensureFaviconLink()
  link.type = 'image/svg+xml'
  link.href = dataUri
}

const FALLBACK_BRAND = BRAND_COLORS[DEFAULT_THEME_NAME].primary
const FALLBACK_SHADOW = BRAND_COLORS[DEFAULT_THEME_NAME].active
const FALLBACK_SURFACE = '#0a0a0a'

/**
 * Read the resolved `--cp-c-brand-1` CSS custom property off the root
 * element, falling back to the default theme's primary when the var is
 * empty (which happens during the brief window before the theme
 * stylesheet loads).
 *
 * @private
 * @param html - Document root element
 * @returns Brand colour as a CSS-parseable string
 */
function resolveBrandColor(html: HTMLElement): string {
  const raw = globalThis.window.getComputedStyle(html).getPropertyValue('--cp-c-brand-1').trim()
  if (raw.length === 0) {
    return FALLBACK_BRAND
  }
  return raw
}

/**
 * Read the resolved `--cp-c-brand-3` CSS custom property (the deepest
 * brand shade, used for the apple's shadow), falling back to the
 * default theme's active shade when the var is empty.
 *
 * @private
 * @param html - Document root element
 * @returns Brand shadow colour as a CSS-parseable string
 */
function resolveBrandShadow(html: HTMLElement): string {
  const raw = globalThis.window.getComputedStyle(html).getPropertyValue('--cp-c-brand-3').trim()
  if (raw.length === 0) {
    return FALLBACK_SHADOW
  }
  return raw
}

/**
 * Read the resolved canvas colour off the root element, falling back to
 * the shared dark-surface canvas (`#0a0a0a`) when the var is empty.
 *
 * @private
 * @param html - Document root element
 * @returns Surface colour as a CSS-parseable string
 */
function resolveSurfaceColor(html: HTMLElement): string {
  const raw = globalThis.window.getComputedStyle(html).getPropertyValue('--cp-c-bg').trim()
  if (raw.length === 0) {
    return FALLBACK_SURFACE
  }
  return raw
}

/**
 * Construct an SVG favicon data URI carrying the supplied brand +
 * surface colours. Renders the pixel-apple mark (matching the static
 * `/icon.svg` and the loader glyph) on a rounded square chip. Apple
 * body uses the resolved brand colour; the body shadow uses the
 * deepest brand shade; leaf greens and stem browns are constant.
 *
 * @private
 * @param brand - Apple body colour
 * @param shadow - Apple body shadow colour (deepest brand shade)
 * @param surface - Chip background colour
 * @returns `data:image/svg+xml;...` URI
 */
function buildIconDataUri(brand: string, shadow: string, surface: string): string {
  // viewBox 0 0 64 64. Apple source content lives in (60..250, 40..260).
  // translate + scale(0.25) places a 47.5x55 apple centred in the chip.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" shape-rendering="crispEdges"><rect width="64" height="64" rx="12" fill="${surface}"/><g transform="translate(8.25 4.5) scale(0.25) translate(-60 -40)"><path d="M80,40h10v10h-10v-10zM90,50h30v10h10v10h-30v-10h-10v-10z" fill="#99e550"/><path d="M90,40h30v10h-30v-10zM120,50h10v10h-10v-10zM130,60h10v10h-10v-10z" fill="#6abe30"/><path d="M120,40h20v10h10v20h-10v-10h-10v-10h-10v-10z" fill="#4b692f"/><path d="M160,40h20v10h-10v10h-10v10h-10v-20h10v-10z" fill="#d9a066"/><path d="M150,70h10v20h-10v-20z" fill="#8f563b"/><path d="M90,80h20v10h30v10h30v-10h30v-10h20v10h10v10h10v10h10v90h-10v20h-10v20h-10v10h-10v10h-30v-10h-10v-10h-10v-10h-10v10h-10v10h-10v10h-30v-10h-10v-10h-10v-20h-10v-20h-10v-90h10v-10h10v-10h10v-10zM220,200h10v-30h-10v-10h-10v40h-10v20h-10v20h10v-10h10v-10h10v-20z" fill="${brand}"/><path d="M110,80h30v10h-30v-10zM170,80h30v10h-30v-10zM140,90h30v10h-30v-10zM210,160h10v10h10v30h-10v20h-10v10h-10v10h-10v-20h10v-20h10v-40zM150,230h10v10h10v10h10v10h-50v-10h10v-10h10v-10z" fill="${shadow}"/></g></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/**
 * Locate the existing `<link rel="icon">` element, creating one if the
 * document head doesn't have one yet (a defensive fallback — Rspress
 * normally renders one from `brand.favicon`).
 *
 * @private
 * @returns Mutable link element
 */
function ensureFaviconLink(): HTMLLinkElement {
  const existing = globalThis.document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (existing !== null) {
    return existing
  }
  const link = globalThis.document.createElement('link')
  link.rel = 'icon'
  globalThis.document.head.append(link)
  return link
}
