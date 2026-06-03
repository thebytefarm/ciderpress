import type React from 'react'

const FONT_STACK = "'SF Mono', 'Fira Code', 'JetBrains Mono', Consolas, monospace"
const LOGO_VIEWBOX = '0 0 620 130'
const LOGO_FALLBACK_COLOR = '#60a5fa'
const FONT_SIZE = 13
const LINE_HEIGHT = 16
const X_OFFSET = 24
const Y_OFFSET = 24

const CIDERPRESS_ART: readonly string[] = Object.freeze([
  ' ██████╗██╗██████╗ ███████╗██████╗ ██████╗ ██████╗ ███████╗███████╗███████╗',
  '██╔════╝██║██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔════╝██╔════╝',
  '██║     ██║██║  ██║█████╗  ██████╔╝██████╔╝██████╔╝█████╗  ███████╗███████╗',
  '██║     ██║██║  ██║██╔══╝  ██╔══██╗██╔═══╝ ██╔══██╗██╔══╝  ╚════██║╚════██║',
  '╚██████╗██║██████╔╝███████╗██║  ██║██║     ██║  ██║███████╗███████║███████║',
  ' ╚═════╝╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝',
])

export interface CiderpressLogoProps {
  /**
   * Optional className applied to the root `<svg>` element.
   */
  readonly className?: string
  /**
   * Accessible label rendered into an SVG `<title>` element. Defaults to
   * `"ciderpress"` so the logo is always announced by screen readers.
   */
  readonly title?: string
  /**
   * Explicit `width` attribute. Omit to let CSS / containing element
   * control sizing via the SVG's `viewBox`.
   */
  readonly width?: number | string
  /**
   * Explicit `height` attribute. Omit to let CSS / containing element
   * control sizing via the SVG's `viewBox`.
   */
  readonly height?: number | string
}

/**
 * Inline `<svg>` ciderpress wordmark logo that auto-themes to the active theme.
 *
 * Renders the FIGlet "ciderpress" wordmark using `fill="currentColor"` so the
 * glyphs inherit color from the wrapping `<svg>`. The wrapper sets `color`
 * to `var(--rp-c-brand)` — the canonical brand variable maintained by
 * `ThemeProvider` — so the logo tints to whichever theme (and variant) is
 * active without any JS re-renders or theme subscriptions.
 *
 * Falls back to `#60a5fa` when `--rp-c-brand` is not defined (e.g. when
 * rendered outside the ciderpress theme context).
 *
 * @param props - Optional className, title, and explicit size overrides
 * @returns Inline SVG element
 */
export function CiderpressLogo(props: CiderpressLogoProps): React.ReactElement {
  const title = props.title ?? 'ciderpress'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={LOGO_VIEWBOX}
      className={props.className}
      width={props.width}
      height={props.height}
      style={{ color: `var(--rp-c-brand, ${LOGO_FALLBACK_COLOR})` }}
      role="img"
    >
      <title>{title}</title>
      <g
        transform={`translate(${X_OFFSET}, ${Y_OFFSET})`}
        fontFamily={FONT_STACK}
        fill="currentColor"
      >
        {CIDERPRESS_ART.map((line, i) => (
          <text key={line} fontSize={FONT_SIZE} y={i * LINE_HEIGHT} xmlSpace="preserve">
            {line}
          </text>
        ))}
      </g>
    </svg>
  )
}
