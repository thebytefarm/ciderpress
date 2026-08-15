import { match, P } from 'massaman/match'
import type React from 'react'

import { RouteLink } from '../../lib/route-link.tsx'
import { safeUrl } from '../../lib/safe-url.ts'
import type { HeroAction } from './hero'

import './cta.css'

export interface CTAProps {
  /**
   * Small uppercase kicker rendered above the headline.
   */
  readonly eyebrow?: string
  /**
   * Headline.
   */
  readonly title: React.ReactNode
  /**
   * Optional sub-text.
   */
  readonly subtitle?: React.ReactNode
  /**
   * Up to two CTAs.
   */
  readonly actions?: readonly HeroAction[]
}

/**
 * CTA — final call-to-action band with a soft radial accent glow.
 * Designed to sit just above the footer in the page rail.
 *
 * @param props - CTA configuration.
 * @returns React element.
 */
export function CTA(props: CTAProps): React.ReactElement {
  const { eyebrow, title, subtitle, actions } = props
  const list = actions ?? []

  return (
    <section className="cp-cta">
      <div className="cp-cta__inner">
        {match(eyebrow)
          .with(P.string, (e) => <div className="cp-cta__eyebrow">{e}</div>)
          .otherwise(() => null)}
        <h2 className="cp-cta__title">{title}</h2>
        {match(subtitle)
          .with(undefined, () => null)
          .otherwise((s) => (
            <p className="cp-cta__sub">{s}</p>
          ))}
        {match(list.length === 0)
          .with(true, () => null)
          .otherwise(() => (
            <div className="cp-cta__row">{list.map(renderAction)}</div>
          ))}
      </div>
    </section>
  )
}

/**
 * Render a single CTA action.
 *
 * @private
 * @param action - CTA action.
 * @param index - Array index for key generation.
 * @returns Anchor element.
 */
function renderAction(action: HeroAction, index: number): React.ReactElement | null {
  const href = safeUrl(action.link)
  if (href === null) {
    return null
  }
  const className = match(action.theme ?? 'brand')
    .with('brand', () => 'cp-cta__btn cp-cta__btn--primary')
    .otherwise(() => 'cp-cta__btn')

  return (
    <RouteLink key={`${href}:${index}`} href={href} className={className}>
      {action.text}
    </RouteLink>
  )
}
