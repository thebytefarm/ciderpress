import type React from 'react'

const MARK_FALLBACK_COLOR = '#dc2626'

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
 * Compact ciderpress brand mark — a rounded-square chip with a centred
 * `cp` monogram. Uses `fill="currentColor"` for the glyph so the mark
 * inherits the active theme's brand colour via `--rp-c-brand` on the
 * wrapping `<svg>`, exactly like {@link CiderpressLogo} (the full
 * wordmark).
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
      <text
        x="32"
        y="34"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
        fontSize="32"
        fontWeight="700"
        fill="currentColor"
        textAnchor="middle"
        dominantBaseline="central"
      >
        cp
      </text>
    </svg>
  )
}
