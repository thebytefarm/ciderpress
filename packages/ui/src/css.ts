import type { LoaderConfig } from '@ciderpress/config'
import { BUILT_IN_THEMES, resolveThemeAlias } from '@ciderpress/theme'
import { match } from 'massaman/match'

import { readCss } from './head/read.ts'

/**
 * Theme CSS injected inline in <head> to prevent FOUC.
 *
 * Contains the :root fallback variables needed for initial paint
 * and the loading overlay styles.
 *
 * Four loader variants ship alongside every theme:
 *   - `'apple'`   (default) — Ciderpress's native apple animation
 *   - `'classic'`           — legacy dots loader ("loading.", "loading..", …)
 *   - `false`               — no loader chrome at all
 *   - `LoaderConfig`        — custom SVG glyph + label
 *
 * Callers pick by passing the second argument to `getThemeCss`. The
 * site config (`loader: false | 'apple' | 'classic' | LoaderConfig`)
 * flows in through `createRspressConfig` → `getThemeCss(themeName, loader)`.
 */

const THEME_CSS_MAP: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(
    Object.keys(BUILT_IN_THEMES).map((name) => [name, readCss(`css/themes/${name}.css`)])
  )
)

const BACKDROP_CSS = readCss('css/loader-backdrop.css')
const APPLE_LOADER_CSS = readCss('css/loader-apple.css')
const DOTS_LOADER_CSS = readCss('css/loader-dots.css')

/**
 * Supported loader styles for the inline FOUC overlay.
 */
export type LoaderStyle = false | 'apple' | 'classic' | LoaderConfig

/**
 * Default loader style when none is specified in config.
 */
export const DEFAULT_LOADER_STYLE: LoaderStyle = 'apple'

/**
 * Resolve the inline loader CSS bundle for a given style.
 *
 * - `false` → empty string (no loader chrome).
 * - `'apple' | 'classic'` → backdrop + matching preset CSS.
 * - `LoaderConfig` → backdrop + a synthesized custom-loader rule painting
 *   the user's SVG/asset as the glyph and their `label` as the text.
 *
 * @private
 * @param loader - Loader style to resolve
 * @returns Concatenated backdrop + variant CSS
 */
function resolveLoaderCss(loader: LoaderStyle): string {
  if (loader === false) {
    return ''
  }
  if (loader === 'classic') {
    return BACKDROP_CSS + DOTS_LOADER_CSS
  }
  if (loader === 'apple') {
    return BACKDROP_CSS + APPLE_LOADER_CSS
  }
  return BACKDROP_CSS + buildCustomLoaderCss(loader)
}

/**
 * Generate inline CSS for a given theme + loader style.
 *
 * Always includes the loading overlay CSS (unless `loader === false`).
 * For built-in themes, also includes the theme-specific color variables
 * for correct first paint. Custom themes should provide their own
 * `:root` fallback in their external CSS.
 *
 * @param themeName - Name of the active theme
 * @param loader - Loader style — defaults to `'apple'`
 * @returns Inline CSS string to inject in the document head
 */
export function getThemeCss(themeName: string, loader: LoaderStyle = DEFAULT_LOADER_STYLE): string {
  const loaderCss = resolveLoaderCss(loader)
  const resolved = resolveThemeAlias(themeName)
  if (!Object.hasOwn(THEME_CSS_MAP, resolved)) {
    return loaderCss
  }
  const themeColors = THEME_CSS_MAP[resolved]
  if (themeColors) {
    return themeColors + loaderCss
  }
  return loaderCss
}

/**
 * Build the custom-loader CSS for a `LoaderConfig`. The glyph paints
 * via `html::before` (matching the canonical apple loader's element)
 * and the label via `html::after`. Both pseudos share the existing
 * fade + `data-cp-ready` lifecycle so dismissal works identically.
 *
 * @private
 * @param config - User-supplied loader config
 * @returns CSS string painting the custom loader
 */
function buildCustomLoaderCss(config: LoaderConfig): string {
  const glyph = resolveGlyphUrl(config.content)
  const label = config.label ?? 'loading'
  const hasLabel = label.length > 0
  const labelRule = match(hasLabel)
    .with(true, () => buildLabelCss(label))
    .otherwise(() => '')
  const marginLeft = match(hasLabel)
    .with(true, () => '-110px')
    .otherwise(() => '-32px')

  return `
html::before {
  content: '';
  position: fixed;
  top: 50%;
  left: 50%;
  width: 64px;
  height: 64px;
  margin-left: ${marginLeft};
  margin-top: -32px;
  background-image: ${glyph};
  background-repeat: no-repeat;
  background-position: center center;
  background-size: contain;
  image-rendering: pixelated;
  z-index: 9999;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.2s ease;
}
${labelRule}
html.cp-loader-fade::before,
html.cp-loader-fade::after {
  opacity: 0;
}
html[data-cp-ready]::before,
html[data-cp-ready]::after {
  display: none;
}
`
}

/**
 * Coerce a loader `content` string into a CSS `url(...)` expression.
 *
 * Inline SVG markup (anything containing `<svg`) is URI-encoded into a
 * `data:image/svg+xml` URL. Asset paths and full URLs are wrapped in
 * `url(...)` directly. Quotes inside the value are escaped so the
 * resulting rule never breaks the surrounding string boundary.
 *
 * @private
 * @param content - User-supplied loader content (SVG markup or asset URL)
 * @returns CSS `url(...)` expression usable as `background-image`
 */
function resolveGlyphUrl(content: string): string {
  if (content.includes('<svg')) {
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(content)}")`
  }
  return `url("${content.replaceAll('"', String.raw`\"`)}")`
}

/**
 * Build the CSS rule for the loader text label. Label colour/font/etc.
 * mirror the apple loader's text pseudo so themes don't need bespoke
 * tuning to style the custom variant.
 *
 * @private
 * @param label - Visible label string (already validated as non-empty)
 * @returns CSS rule painting `html::after`
 */
function buildLabelCss(label: string): string {
  const escaped = label.replaceAll('\\', String.raw`\\`).replaceAll("'", String.raw`\'`)
  return `html::after {
  content: '${escaped}';
  position: fixed;
  top: 50%;
  left: 50%;
  width: 160px;
  margin-left: -40px;
  margin-top: -14px;
  text-align: left;
  color: var(--cp-c-text-2, #888);
  font-family: 'Geist Pixel Square', ui-sans-serif, system-ui, sans-serif;
  font-size: 28px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.04em;
  z-index: 9999;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.2s ease;
}`
}
