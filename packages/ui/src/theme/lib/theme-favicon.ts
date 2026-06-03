/**
 * Sync the document favicon with the active theme's brand color.
 *
 * Browsers cache favicons aggressively and don't honour CSS custom
 * properties inside referenced SVGs, so a static `/icon.svg` always
 * paints with whatever colour the asset shipped with. To keep the tab
 * mark in lockstep with the active theme (honeycrisp red, grannysmith
 * green, midnight blue, arcade neon, …), we read the resolved
 * `--cp-c-brand-1` value off `<html>`, bake it into a fresh SVG, and
 * point `<link rel="icon">` at the resulting data URI. Browsers treat a
 * new data URI as a new icon resource and repaint the tab.
 *
 * Safe to call as often as needed — idempotent and inexpensive.
 *
 * @param html - Document root element (`<html>`)
 */
export function syncThemeFavicon(html: HTMLElement): void {
  const brand = resolveBrandColor(html)
  const surface = resolveSurfaceColor(html)
  const dataUri = buildIconDataUri(brand, surface)
  const link = ensureFaviconLink()
  // oxlint-disable-next-line functional/immutable-data -- boundary mutation: updating link element href
  link.type = 'image/svg+xml'
  // oxlint-disable-next-line functional/immutable-data -- boundary mutation: updating link element href
  link.href = dataUri
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

const FALLBACK_BRAND = '#dc2626'
const FALLBACK_SURFACE = '#0a0a0a'

/**
 * Read the resolved `--cp-c-brand-1` CSS custom property off the root
 * element, falling back to the honeycrisp primary when the var is empty
 * (which happens during the brief window before the theme stylesheet
 * loads).
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
 * Read the resolved canvas colour off the root element, falling back to
 * the honeycrisp dark surface when the var is empty.
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
 * surface colours. Renders a rounded square chip with a centred `cp`
 * monogram so the mark stays recognisable at 16×16.
 *
 * @private
 * @param brand - Glyph colour
 * @param surface - Chip background colour
 * @returns `data:image/svg+xml;...` URI
 */
function buildIconDataUri(brand: string, surface: string): string {
  // `dominant-baseline="central"` centres the glyph block on `y` regardless
  // of ascender/descender depth, so the `cp` mark sits at the optical
  // centre of the chip at every favicon size.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="${surface}"/><text x="32" y="34" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="32" font-weight="700" fill="${brand}" text-anchor="middle" dominant-baseline="central">cp</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/**
 * Locate the existing `<link rel="icon">` element, creating one if the
 * document head doesn't have one yet (a defensive fallback — Rspress
 * normally renders one from `config.icon`).
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
  // oxlint-disable-next-line functional/immutable-data -- boundary mutation: initialising newly created link element
  link.rel = 'icon'
  globalThis.document.head.append(link)
  return link
}
