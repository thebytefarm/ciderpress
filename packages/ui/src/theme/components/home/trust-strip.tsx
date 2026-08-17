import { match } from 'massaman/match'
import type React from 'react'

import { renderRichText } from '../../lib/rich-text.tsx'

import './trust-strip.css'

/**
 * Default rendered height, in pixels, for a proof logo.
 */
const DEFAULT_LOGO_HEIGHT = 20

/**
 * A logo entry in the trust strip. Drawn as a mask filled with the
 * current text color, so one asset covers every theme and both variants.
 */
export interface TrustLogo {
  /**
   * Public URL of the logo asset.
   */
  readonly src: string
  /**
   * Accessible name for the logo.
   */
  readonly alt: string
  /**
   * Optional link target. When set, the logo becomes a link.
   */
  readonly href?: string
  /**
   * Rendered height in pixels. Defaults to {@link DEFAULT_LOGO_HEIGHT}.
   */
  readonly height?: number
  /**
   * Draw the logo as a silhouette in the current text color instead of
   * its own colors. Defaults to `false`.
   */
  readonly mono?: boolean
}

/**
 * One trust strip entry — a plain name or a {@link TrustLogo}.
 */
export type TrustItem = string | TrustLogo

export interface TrustStripProps {
  /**
   * Lead text shown before the names. Defaults to "used by".
   */
  readonly lead?: string
  /**
   * Entries to render, separated by mono dots.
   */
  readonly names: readonly TrustItem[]
}

/**
 * TrustStrip — a single-row "used by …" band with mono dots between
 * entries. Entries are either text or logos. Renders only when at least
 * one entry is supplied.
 *
 * @param props - Trust strip configuration.
 * @returns React element, or null when no entries are provided.
 */
export function TrustStrip(props: TrustStripProps): React.ReactElement | null {
  const { lead = 'used by', names } = props
  return match(names.length === 0)
    .with(true, () => null)
    .otherwise(() => (
      <section className="cp-trust">
        <div className="cp-trust__row">
          <span className="cp-trust__lead">{renderRichText(lead)}</span>
          {names.map((item, i) => (
            <span key={`${itemKey(item)}:${i}`} className="cp-trust__item">
              {renderItem(item)}
              {match(i < names.length - 1)
                .with(true, () => <span className="cp-trust__sep">·</span>)
                .otherwise(() => null)}
            </span>
          ))}
        </div>
      </section>
    ))
}

/**
 * Stable key fragment for an entry.
 *
 * @private
 * @param item - Entry to derive a key from
 * @returns Key fragment
 */
function itemKey(item: TrustItem): string {
  return match(typeof item === 'string')
    .with(true, () => String(item))
    .otherwise(() => (item as TrustLogo).src)
}

/**
 * Render a single entry as either text or a themed logo.
 *
 * @private
 * @param item - Entry to render
 * @returns React node for the entry
 */
function renderItem(item: TrustItem): React.ReactNode {
  return match(typeof item === 'string')
    .with(true, () => <span className="cp-trust__name">{renderRichText(String(item))}</span>)
    .otherwise(() => renderLogo(item as TrustLogo))
}

/**
 * Render a logo in its own colors, or as a silhouette when `mono` is set.
 *
 * @private
 * @param logo - Logo entry to render
 * @returns React node for the logo
 */
function renderLogo(logo: TrustLogo): React.ReactNode {
  const { href } = logo
  const mark = match(logo.mono === true)
    .with(true, () => renderMonoMark(logo))
    .otherwise(() => renderColorMark(logo))

  return match(href === undefined)
    .with(true, () => mark)
    .otherwise(() => (
      <a className="cp-trust__link" href={href} rel="noreferrer" target="_blank">
        {mark}
      </a>
    ))
}

/**
 * Render a logo as an image, preserving the asset's own colors.
 *
 * @private
 * @param logo - Logo entry to render
 * @returns React node for the logo
 */
function renderColorMark(logo: TrustLogo): React.ReactNode {
  const { src, alt, height = DEFAULT_LOGO_HEIGHT } = logo
  return <img alt={alt} className="cp-trust__logo" src={src} style={{ height: `${height}px` }} />
}

/**
 * Render a logo as a mask filled with the current text color.
 *
 * The mask reads only the asset's alpha channel, so one file works on
 * every theme and in both light and dark without a second variant.
 *
 * @private
 * @param logo - Logo entry to render
 * @returns React node for the logo
 */
function renderMonoMark(logo: TrustLogo): React.ReactNode {
  const { src, alt, height = DEFAULT_LOGO_HEIGHT } = logo
  // The inner image is hidden but still laid out, so the masked wrapper
  // inherits the asset's intrinsic aspect ratio. A mask alone has no
  // intrinsic size, so without it every logo would collapse to zero width.
  return (
    <span
      aria-label={alt}
      className="cp-trust__logo cp-trust__logo--mono"
      role="img"
      style={{
        height: `${height}px`,
        maskImage: `url("${src}")`,
        WebkitMaskImage: `url("${src}")`,
      }}
    >
      <img alt="" aria-hidden="true" src={src} />
    </span>
  )
}
