import { BUILT_IN_THEMES, resolveThemeAlias } from '@ciderpress/theme'

import { readCss } from './head/read.ts'

/**
 * Theme CSS injected inline in <head> to prevent FOUC.
 *
 * Contains the :root fallback variables needed for initial paint
 * and the loading overlay styles.
 *
 * Two loader variants ship alongside every theme:
 *   - `'apple'`   (default) — Ciderpress's native apple animation
 *   - `'classic'`           — legacy dots loader ("loading.", "loading..", …)
 *
 * Callers pick by passing the second argument to `getThemeCss`. The
 * site config (`loader: 'apple' | 'classic'`) flows in through
 * `createRspressConfig` → `getThemeCss(themeName, loader)`.
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
export type LoaderStyle = 'apple' | 'classic'

/**
 * Default loader style when none is specified in config.
 */
export const DEFAULT_LOADER_STYLE: LoaderStyle = 'apple'

/**
 * Resolve the inline loader CSS bundle for a given style. Always
 * pairs the chosen text/icon CSS with the shared backdrop.
 *
 * @private
 * @param loader - Loader style to resolve
 * @returns Concatenated backdrop + variant CSS
 */
function resolveLoaderCss(loader: LoaderStyle): string {
  if (loader === 'classic') {
    return BACKDROP_CSS + DOTS_LOADER_CSS
  }
  return BACKDROP_CSS + APPLE_LOADER_CSS
}

/**
 * Generate inline CSS for a given theme + loader style.
 *
 * Always includes the loading overlay CSS. For built-in themes, also
 * includes the theme-specific color variables for correct first paint.
 * Custom themes should provide their own :root fallback in their
 * external CSS.
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
