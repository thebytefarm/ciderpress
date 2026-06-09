import { match, P } from 'massaman/match'
import type React from 'react'
import { Button, OverlayArrow, Tooltip as AriaTooltip, TooltipTrigger } from 'react-aria-components'

import { RouteLink } from '../../lib/route-link.tsx'
import { safeUrl } from '../../lib/safe-url.ts'

export interface TooltipProps {
  /**
   * Main tooltip text displayed on hover.
   */
  readonly tip: string
  /**
   * Optional bold headline displayed above the tip.
   */
  readonly headline?: string
  /**
   * Optional call-to-action link label.
   */
  readonly cta?: string
  /**
   * URL for the call-to-action link. Required when `cta` is provided.
   */
  readonly href?: string
  /**
   * Inline content that triggers the tooltip on hover.
   */
  readonly children: React.ReactNode
}

/**
 * Hover-to-reveal tooltip for definitions, glossary terms,
 * and inline contextual help.
 *
 * Built on react-aria-components for full accessibility,
 * keyboard support, and automatic repositioning.
 *
 * @param props - Tooltip configuration with tip text and optional CTA
 * @returns React element with tooltip trigger and overlay
 */
export function Tooltip({ tip, headline, cta, href, children }: TooltipProps): React.ReactElement {
  const headlineEl = match(headline)
    .with(P.nonNullable, (h) => <strong className="cp-tooltip__headline">{h}</strong>)
    .otherwise(() => null)

  const ctaEl = match({ cta, href })
    .with({ cta: P.nonNullable, href: P.nonNullable }, ({ cta: label, href: url }) => {
      const safeHref = safeUrl(url)
      if (safeHref === null) {
        return null
      }
      return (
        <RouteLink className="cp-tooltip__cta" href={safeHref}>
          {label}
        </RouteLink>
      )
    })
    .otherwise(() => null)

  return (
    <TooltipTrigger delay={300}>
      <Button className="cp-tooltip__trigger">{children}</Button>
      <AriaTooltip className="cp-tooltip__overlay" offset={8}>
        <OverlayArrow className="cp-tooltip__arrow">
          <svg width="12" height="6" viewBox="0 0 12 6">
            <path d="M0 6L6 0L12 6" fill="var(--cp-c-bg-elv)" stroke="var(--cp-c-border)" />
          </svg>
        </OverlayArrow>
        <div className="cp-tooltip__body">
          {headlineEl}
          <span className="cp-tooltip__tip">{tip}</span>
          {ctaEl}
        </div>
      </AriaTooltip>
    </TooltipTrigger>
  )
}
