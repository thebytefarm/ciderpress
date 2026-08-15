import { match, P } from 'massaman/match'
import type React from 'react'

import { RouteLink } from '../../lib/route-link.tsx'
import { safeUrl } from '../../lib/safe-url.ts'

import './split.css'

export interface SplitAction {
  /**
   * Visible label.
   */
  readonly text: string
  /**
   * Destination URL.
   */
  readonly link: string
  /**
   * Visual style — `brand` is the filled primary, `alt` is the outline.
   */
  readonly theme?: 'brand' | 'alt'
}

export interface SplitProps {
  /**
   * Eyebrow label rendered above the headline.
   */
  readonly eyebrow?: string
  /**
   * Section headline.
   */
  readonly title: React.ReactNode
  /**
   * Lead paragraph below the headline.
   */
  readonly body?: React.ReactNode
  /**
   * Optional checkmark bullets rendered under the body.
   */
  readonly bullets?: readonly string[]
  /**
   * Optional CTA action.
   */
  readonly action?: SplitAction
  /**
   * Visual content — typically a code preview or screenshot. Omit (or
   * pass `null`) for a copy-only band; the visual column collapses
   * instead of painting an empty frame.
   */
  readonly visual?: React.ReactNode
  /**
   * Flip the column order — visual first, copy second. Defaults to
   * `false` (copy first, visual second).
   */
  readonly reverse?: boolean
}

/**
 * HomeSplit — two-column "show and tell" section. Copy + checkmarks on the
 * left, code/screenshot on the right. Mirrors the mockup landing.
 *
 * @param props - Split section configuration.
 * @returns React element.
 */
export function HomeSplit(props: SplitProps): React.ReactElement {
  const { eyebrow, title, body, bullets, action, visual, reverse } = props
  const list = bullets ?? []
  // Without a visual the band is a single column — the two-column grid
  // would otherwise leave half the row empty.
  const layoutClass = match(visual)
    .with(P.nullish, () => 'cp-split__inner cp-split__inner--full')
    .otherwise(() => 'cp-split__inner')
  const innerClass = match(reverse ?? false)
    .with(true, () => `${layoutClass} cp-split__inner--reverse`)
    .otherwise(() => layoutClass)

  return (
    <section className="cp-split">
      <div className={innerClass}>
        <div className="cp-split__copy">
          {match(eyebrow)
            .with(undefined, () => null)
            .otherwise((e) => (
              <div className="cp-split__eyebrow">{e}</div>
            ))}
          <h2 className="cp-split__title">{title}</h2>
          {match(body)
            .with(undefined, () => null)
            .otherwise((b) => (
              <p className="cp-split__body">{b}</p>
            ))}
          {match(list.length === 0)
            .with(true, () => null)
            .otherwise(() => (
              <ul className="cp-split__bullets">
                {list.map((bullet) => (
                  <li key={bullet}>
                    <span className="cp-split__check">✓</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ))}
          {match(action)
            .with(undefined, () => null)
            .otherwise((a) => {
              const href = safeUrl(a.link)
              if (href === null) {
                return null
              }
              return (
                <RouteLink className={btnClass(a.theme)} href={href}>
                  {a.text}
                </RouteLink>
              )
            })}
        </div>
        {match(visual)
          .with(P.nullish, () => null)
          .otherwise((v) => (
            <div className="cp-split__visual">{v}</div>
          ))}
      </div>
    </section>
  )
}

/**
 * Build the CSS class for a split action button.
 *
 * @private
 * @param theme - Action theme.
 * @returns CSS class name string.
 */
function btnClass(theme: 'brand' | 'alt' | undefined): string {
  return match(theme ?? 'brand')
    .with('brand', () => 'cp-split__btn cp-split__btn--primary')
    .otherwise(() => 'cp-split__btn')
}
