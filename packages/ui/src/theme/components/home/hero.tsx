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

/** Background image source and responsive rendering controls. */
export interface HeroBackgroundSource {
  /**
   * Image URL or path. Runs through {@link withMountBase} so paths on a
   * mounted `base` still resolve.
   */
  readonly src: string
  /**
   * Optional image overrides for the 880px tablet and 640px mobile
   * breakpoints.
   */
  readonly sources?: {
    readonly tablet?: string
    readonly mobile?: string
  }
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

/** A single hero background image with fixed foreground contrast. */
export interface HeroBackgroundImage extends HeroBackgroundSource {
  /**
   * Color mode used for the hero foreground and scrim. When omitted, the
   * active site variant is used.
   */
  readonly mode?: 'dark' | 'light'
}

/** Hero background sources selected from the active site variant. */
export interface HeroBackgroundVariants {
  /** Artwork displayed in dark mode. */
  readonly dark: HeroBackgroundSource
  /** Artwork displayed in light mode. */
  readonly light: HeroBackgroundSource
}

/** Background image painted behind the hero copy. */
export type HeroBackground = HeroBackgroundImage | HeroBackgroundVariants

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
   * Optional background image painted behind the hero copy.
   */
  readonly background?: HeroBackground
  /**
   * Optional React content painted behind the hero copy. Intended for
   * procedural canvas, WebGL, or inline SVG backgrounds.
   */
  readonly backgroundContent?: React.ReactNode
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
  const { eyebrow, title, tagline, actions, demo, background, backgroundContent } = props
  const list = actions ?? []

  return (
    <section className={heroClassName(background)} style={heroBackgroundStyle(background)}>
      {match(backgroundContent)
        .with(undefined, () => null)
        .otherwise((content) => (
          <div className="cp-hero__background" aria-hidden="true">
            {content}
          </div>
        ))}
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
          .with(null, () => null)
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
  if (background === undefined) {
    return 'cp-hero'
  }
  if (isVariantBackground(background)) {
    return 'cp-hero cp-hero--has-background cp-hero--background-variants'
  }
  if (background.src.length === 0) {
    return 'cp-hero'
  }
  if (background.mode === undefined) {
    return 'cp-hero cp-hero--has-background'
  }
  return `cp-hero cp-hero--has-background cp-hero--background-${background.mode}`
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
  if (background === undefined) {
    return undefined
  }
  if (isVariantBackground(background)) {
    const dark = heroBackgroundSourceStyle(background.dark)
    const light = heroBackgroundSourceStyle(background.light)
    return {
      '--cp-hero-background-image': dark.image,
      '--cp-hero-background-position': dark.position,
      '--cp-hero-background-size': dark.size,
      '--cp-hero-background-repeat': dark.repeat,
      '--cp-hero-background-tablet-image': dark.tabletImage,
      '--cp-hero-background-mobile-image': dark.mobileImage,
      '--cp-hero-background-light-image': light.image,
      '--cp-hero-background-light-position': light.position,
      '--cp-hero-background-light-size': light.size,
      '--cp-hero-background-light-repeat': light.repeat,
      '--cp-hero-background-light-tablet-image': light.tabletImage,
      '--cp-hero-background-light-mobile-image': light.mobileImage,
    } as React.CSSProperties
  }
  if (background.src.length === 0) {
    return undefined
  }
  const style = heroBackgroundSourceStyle(background)
  return {
    '--cp-hero-background-image': style.image,
    '--cp-hero-background-position': style.position,
    '--cp-hero-background-size': style.size,
    '--cp-hero-background-repeat': style.repeat,
    '--cp-hero-background-tablet-image': style.tabletImage,
    '--cp-hero-background-mobile-image': style.mobileImage,
  } as React.CSSProperties
}

interface HeroBackgroundStyleValues {
  readonly image: string
  readonly position: string
  readonly size: string
  readonly repeat: string
  readonly tabletImage: string | undefined
  readonly mobileImage: string | undefined
}

/**
 * Build normalized CSS values for one background source.
 *
 * @private
 * @param source - Background source and rendering controls.
 * @returns Normalized CSS values.
 */
function heroBackgroundSourceStyle(source: HeroBackgroundSource): HeroBackgroundStyleValues {
  const sources = source.sources
  return {
    image: `url("${withMountBase(source.src)}")`,
    position: source.position ?? 'center',
    size: source.size ?? 'cover',
    repeat: source.repeat ?? 'no-repeat',
    tabletImage: match(sources)
      .with(undefined, () => undefined)
      .otherwise((responsive) => heroSourceImage(responsive.tablet)),
    mobileImage: match(sources)
      .with(undefined, () => undefined)
      .otherwise((responsive) => heroSourceImage(responsive.mobile)),
  }
}

/**
 * Test whether a background provides site-variant sources.
 *
 * @private
 * @param background - Hero background configuration.
 * @returns Whether the background contains dark and light sources.
 */
function isVariantBackground(background: HeroBackground): background is HeroBackgroundVariants {
  return 'dark' in background
}

/**
 * Convert an optional responsive source into a base-aware CSS image value.
 *
 * @private
 * @param src - Optional image URL or path.
 * @returns CSS `url()` value, or `undefined` when no override is configured.
 */
function heroSourceImage(src: string | undefined): string | undefined {
  if (src === undefined) {
    return undefined
  }
  return `url("${withMountBase(src)}")`
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
