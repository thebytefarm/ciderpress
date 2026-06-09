import type React from 'react'

const MARK_FALLBACK_COLOR = '#dc2626'
const MARK_FALLBACK_SHADOW = '#7f1d1d'

/**
 * Props accepted by the ciderpress brand mark.
 */
export interface CiderpressMarkProps {
  /** Optional className applied to the root `<svg>` element. */
  readonly className?: string
  /** Explicit `width`/`height` — defaults to letting CSS size the SVG. */
  readonly size?: number | string
  /**
   * Accessible label. Defaults to `"ciderpress"`. Pass an empty string to
   * mark the SVG as decorative (`aria-hidden`).
   */
  readonly title?: string
}

/**
 * Compact ciderpress brand mark — a rounded-square chip with the
 * pixel-apple glyph centred inside. The apple body uses
 * `fill="currentColor"` so it inherits the active theme's brand colour
 * via `--rp-c-brand`; the body shadow tracks `--cp-c-brand-3` (the
 * deepest brand shade). Leaf greens and stem browns stay constant.
 *
 * Visually mirrors the favicon swapped in by `syncThemeFavicon`, so the
 * tab mark and the in-page mark stay in lockstep across every theme.
 *
 * @param props - Optional className, size, and accessible label.
 * @returns Inline SVG element.
 */
export function CiderpressMark(props: CiderpressMarkProps): React.ReactElement {
  const decorative = props.title === ''
  const label = decorative ? undefined : (props.title ?? 'ciderpress')

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      shapeRendering="crispEdges"
      className={props.className}
      width={props.size}
      height={props.size}
      style={{ color: `var(--rp-c-brand, ${MARK_FALLBACK_COLOR})` }}
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={label}
    >
      {decorative ? null : <title>{label}</title>}
      <rect width="64" height="64" rx="12" fill="var(--cp-c-bg, #0a0a0a)" />
      {/* Apple source content lives in (60..250, 40..260). scale(0.25)
          places a 47.5x55 apple centred in the 64x64 chip. */}
      <g transform="translate(8.25 4.5) scale(0.25) translate(-60 -40)">
        <path d="M80,40h10v10h-10v-10zM90,50h30v10h10v10h-30v-10h-10v-10z" fill="#99e550" />
        <path
          d="M90,40h30v10h-30v-10zM120,50h10v10h-10v-10zM130,60h10v10h-10v-10z"
          fill="#6abe30"
        />
        <path d="M120,40h20v10h10v20h-10v-10h-10v-10h-10v-10z" fill="#4b692f" />
        <path d="M160,40h20v10h-10v10h-10v10h-10v-20h10v-10z" fill="#d9a066" />
        <path d="M150,70h10v20h-10v-20z" fill="#8f563b" />
        <path
          d="M90,80h20v10h30v10h30v-10h30v-10h20v10h10v10h10v10h10v90h-10v20h-10v20h-10v10h-10v10h-30v-10h-10v-10h-10v-10h-10v10h-10v10h-10v10h-30v-10h-10v-10h-10v-20h-10v-20h-10v-90h10v-10h10v-10h10v-10zM220,200h10v-30h-10v-10h-10v40h-10v20h-10v20h10v-10h10v-10h10v-20z"
          fill="currentColor"
        />
        <path
          d="M110,80h30v10h-30v-10zM170,80h30v10h-30v-10zM140,90h30v10h-30v-10zM210,160h10v10h10v30h-10v20h-10v10h-10v10h-10v-20h10v-20h10v-40zM150,230h10v10h10v10h10v10h-50v-10h10v-10h10v-10z"
          fill={`var(--cp-c-brand-3, ${MARK_FALLBACK_SHADOW})`}
        />
      </g>
    </svg>
  )
}
