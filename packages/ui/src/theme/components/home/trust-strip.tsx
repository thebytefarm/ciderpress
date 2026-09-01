import { match, P } from 'massaman/match'
import type React from 'react'

import { renderRichText } from '../../lib/rich-text.tsx'
import { safeUrl } from '../../lib/safe-url.ts'
import { withMountBase } from '../../lib/with-mount-base.ts'

import './trust-strip.css'

/**
 * Default rendered height, in pixels, for a proof logo.
 */
const DEFAULT_LOGO_HEIGHT = 20

/**
 * A logo entry in the trust strip. Supports shared, variant-specific,
 * full-color, and monochrome artwork.
 */
export interface TrustLogo {
  /**
   * Public URL of the logo asset.
   */
  readonly src:
    | string
    | {
        readonly dark: string
        readonly light: string
      }
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
                .with(true, () => (
                  <span aria-hidden="true" className="cp-trust__sep">
                    ·
                  </span>
                ))
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
  return match(item)
    .with(P.string, (name) => name)
    .otherwise((logo) =>
      match(logo.src)
        .with(P.string, (src) => src)
        .otherwise((src) => `${src.dark}:${src.light}`)
    )
}

/**
 * Render a single entry as either text or a themed logo.
 *
 * @private
 * @param item - Entry to render
 * @returns React node for the entry
 */
function renderItem(item: TrustItem): React.ReactNode {
  return match(item)
    .with(P.string, (name) => <span className="cp-trust__name">{renderRichText(name)}</span>)
    .otherwise((logo) => renderLogo(logo))
}

/**
 * Render a logo in its own colors, or as a silhouette when `mono` is set.
 *
 * A destination that fails {@link safeUrl} degrades to the bare mark
 * rather than a dead anchor, matching how `<Card />` handles the same
 * case — the logo stays visible without becoming a script-execution sink.
 *
 * @private
 * @param logo - Logo entry to render
 * @returns React node for the logo
 */
function renderLogo(logo: TrustLogo): React.ReactNode {
  const mark = match(logo.mono === true)
    .with(true, () => renderMonoMark(logo))
    .otherwise(() => renderColorMark(logo))

  return match(logo.href)
    .with(P.string, (raw) =>
      match(safeUrl(raw))
        .with(P.string, (href) => (
          <a className="cp-trust__link" href={href} rel="noreferrer" target="_blank">
            {mark}
          </a>
        ))
        .otherwise(() => mark)
    )
    .otherwise(() => mark)
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
  return match(src)
    .with(P.string, (source) => renderColorSource({ source, alt, height }))
    .otherwise((sources) => (
      <>
        {renderColorSource({ source: sources.dark, alt, height, variant: 'dark' })}
        {renderColorSource({ source: sources.light, alt, height, variant: 'light' })}
      </>
    ))
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
  return match(src)
    .with(P.string, (source) => renderMonoSource({ source, alt, height }))
    .otherwise((sources) => (
      <>
        {renderMonoSource({ source: sources.dark, alt, height, variant: 'dark' })}
        {renderMonoSource({ source: sources.light, alt, height, variant: 'light' })}
      </>
    ))
}

interface RenderLogoSourceParams {
  readonly source: string
  readonly alt: string
  readonly height: number
  readonly variant?: 'dark' | 'light'
}

/**
 * Render one color logo source.
 *
 * @private
 * @param params - Source, accessible name, height, and optional site variant
 * @returns Image element for the source
 */
function renderColorSource(params: RenderLogoSourceParams): React.ReactNode {
  const { source, alt, height, variant } = params
  const className = match(variant)
    .with(P.string, (value) => `cp-trust__logo cp-trust__logo--${value}`)
    .otherwise(() => 'cp-trust__logo')
  return (
    <img
      alt={alt}
      className={className}
      src={withMountBase(source)}
      style={{ height: `${height}px` }}
    />
  )
}

/**
 * Render one monochrome logo source.
 *
 * @private
 * @param params - Source, accessible name, height, and optional site variant
 * @returns Masked logo element for the source
 */
function renderMonoSource(params: RenderLogoSourceParams): React.ReactNode {
  const { source, alt, height, variant } = params
  // `encodeURI` so a `"` or `)` in the filename cannot terminate the
  // `url()` token — the CSSOM would reject the whole declaration, and a
  // mask that fails to load leaves the fill unclipped, painting a solid
  // text-coloured rectangle where the logo should be.
  const resolvedSource = withMountBase(source)
  const mask = `url("${encodeURI(resolvedSource)}")`
  const className = match(variant)
    .with(P.string, (value) => `cp-trust__logo cp-trust__logo--mono cp-trust__logo--${value}`)
    .otherwise(() => 'cp-trust__logo cp-trust__logo--mono')
  // The inner image is hidden but still laid out, so the masked wrapper
  // inherits the asset's intrinsic aspect ratio. A mask alone has no
  // intrinsic size, so without it every logo would collapse to zero width.
  return (
    <span
      aria-label={alt}
      className={className}
      role="img"
      style={{
        height: `${height}px`,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    >
      <img alt="" aria-hidden="true" src={resolvedSource} />
    </span>
  )
}
