import { match } from 'massaman/match'
import type React from 'react'

import { RouteLink } from '../../lib/route-link.tsx'
import { safeUrl } from '../../lib/safe-url.ts'
import { withMountBase } from '../../lib/with-mount-base.ts'

import './hero.css'

export interface HeroAction {
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

/**
 * Background image painted behind the hero copy, dimmed by a theme-aware
 * scrim so the headline stays readable in both variants.
 */
export interface HeroBackground {
  /**
   * Image URL or path. Runs through {@link withMountBase} so paths on a
   * mounted `base` still resolve.
   */
  readonly src: string
  /**
   * CSS `background-position` value (e.g. `'center'`). Default `'center'`.
   */
  readonly position?: string
  /**
   * CSS `background-size` value. Default `'cover'`.
   */
  readonly size?: string
  /**
   * CSS `background-repeat` value. Default `'no-repeat'`.
   */
  readonly repeat?: string
}

export interface HeroProps {
  /**
   * Optional eyebrow chip (e.g. "★ 2.1k stars · v0.4.2").
   */
  readonly eyebrow?: React.ReactNode
  /**
   * Main heading. Wrap a fragment in `<span className="cp-hero__grad">…</span>`
   * for the gradient phrase.
   */
  readonly title: React.ReactNode
  /**
   * Sub-text shown below the headline.
   */
  readonly tagline?: React.ReactNode
  /**
   * Two CTAs at most for visual balance.
   */
  readonly actions?: readonly HeroAction[]
  /**
   * Optional visual block beneath the CTAs (terminal demo, screenshot, etc).
   */
  readonly demo?: React.ReactNode
  /**
   * Optional background image painted behind the hero copy, dimmed by a
   * theme-aware scrim so the headline stays readable in both variants.
   */
  readonly background?: HeroBackground
}

/**
 * Hero — landing-page hero with eyebrow chip, gradient-friendly headline,
 * tagline, CTAs, an optional demo slot, and an optional background image.
 * The radial accent glow + dotted grid backdrop are baked in via CSS and
 * adapt to the active theme.
 *
 * @param props - Hero configuration.
 * @returns React element.
 */
export function Hero(props: HeroProps): React.ReactElement {
  const { eyebrow, title, tagline, actions, demo, background } = props
  const list = actions ?? []

  return (
    <section className={heroClassName(background)} style={heroBackgroundStyle(background)}>
      <div className="cp-hero__inner">
        {match(eyebrow)
          .with(undefined, () => null)
          .otherwise((e) => (
            <div className="cp-hero__eyebrow">{e}</div>
          ))}
        <h1 className="cp-hero__title">{title}</h1>
        {match(tagline)
          .with(undefined, () => null)
          .otherwise((t) => (
            <p className="cp-hero__tagline">{t}</p>
          ))}
        {match(list.length === 0)
          .with(true, () => null)
          .otherwise(() => (
            <div className="cp-hero__cta">{list.map(renderAction)}</div>
          ))}
        {match(demo)
          .with(undefined, () => null)
          .otherwise((d) => (
            <div className="cp-hero__demo">{d}</div>
          ))}
      </div>
    </section>
  )
}

/**
 * Compute the `<section>` className. The modifier class carries the
 * background-image CSS variables' consumers; the base class alone when no
 * background is configured.
 *
 * @private
 * @param background - Hero background config (may be `undefined`)
 * @returns ClassName string
 */
function heroClassName(background: HeroBackground | undefined): string {
  return match(background !== undefined && background.src.length > 0)
    .with(true, () => 'cp-hero cp-hero--has-background')
    .otherwise(() => 'cp-hero')
}

/**
 * Build the inline CSS custom properties for the hero background. Returns
 * `undefined` when no background is configured, so the `<section>` carries
 * no `style` attr at all in the default case.
 *
 * @private
 * @param background - Hero background config (may be `undefined`)
 * @returns CSS properties keyed as custom properties, or `undefined`
 */
function heroBackgroundStyle(
  background: HeroBackground | undefined
): React.CSSProperties | undefined {
  if (background === undefined || background.src.length === 0) {
    return undefined
  }
  return {
    '--cp-hero-background-image': `url("${withMountBase(background.src)}")`,
    '--cp-hero-background-position': background.position ?? 'center',
    '--cp-hero-background-size': background.size ?? 'cover',
    '--cp-hero-background-repeat': background.repeat ?? 'no-repeat',
  } as React.CSSProperties
}

/**
 * Render a single hero CTA action.
 *
 * @private
 * @param action - Hero action.
 * @param index - Array index for key generation.
 * @returns Anchor element.
 */
function renderAction(action: HeroAction, index: number): React.ReactElement | null {
  const href = safeUrl(action.link)
  if (href === null) {
    return null
  }
  const className = match(action.theme ?? 'brand')
    .with('brand', () => 'cp-hero__btn cp-hero__btn--primary')
    .otherwise(() => 'cp-hero__btn')

  return (
    <RouteLink key={`${href}:${index}`} href={href} className={className}>
      {action.text}
    </RouteLink>
  )
}
