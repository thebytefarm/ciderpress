import type {
  ButtonConfig,
  HomeHeroDemoConfig,
  HomeSplitVisual,
  TruncateConfig,
} from '@ciderpress/config'
import { useFrontmatter } from '@rspress/core/runtime'
import { match } from 'massaman/match'
import React from 'react'

import { SiteFooter } from '../footer/site-footer'
import { CTA } from './cta'
import { HomeFeature } from './feature'
import type { FeatureItem } from './feature-card'
import { Hero } from './hero'
import type { HeroAction } from './hero'
import { HeroDemo } from './hero-demo'
import { CustomHeroDemo } from './hero-demo-custom'
import { PageRail } from './page-rail'
import { HomeSplit } from './split'
import { CustomSplitVisual } from './split-visual-custom'
import { TrustStrip } from './trust-strip'
import { HomeWorkspaces } from './workspaces'

interface HomeLayoutProps {
  readonly beforeHero?: React.ReactNode
  readonly afterHero?: React.ReactNode
}

interface FrontmatterHero {
  readonly name?: string
  readonly text?: string
  readonly tagline?: string
  readonly actions?: readonly ButtonConfig[]
  readonly label?: string
}

interface FrontmatterHeading {
  readonly label?: string
  readonly title?: string
  readonly subtitle?: string
}

interface FrontmatterProofBlock {
  readonly type: 'proof'
  readonly lead?: string
  readonly names?: readonly string[]
}

interface FrontmatterFeaturesBlock {
  readonly type: 'features'
  readonly items?: readonly FeatureItem[]
  readonly heading?: FrontmatterHeading
  readonly truncate?: TruncateConfig
}

interface FrontmatterShowcaseBlock {
  readonly type: 'showcase'
  readonly heading?: FrontmatterHeading
  readonly columns?: 1 | 2 | 3 | 4
  readonly truncate?: TruncateConfig
}

interface FrontmatterSplitBlock {
  readonly type: 'split'
  readonly label?: string
  readonly title: string
  readonly body?: string
  readonly bullets?: readonly string[]
  readonly cta?: ButtonConfig
  readonly visual?: HomeSplitVisual
  readonly reverse?: boolean
}

interface FrontmatterCtaBlock {
  readonly type: 'cta'
  readonly title?: string
  readonly subtitle?: string
  readonly actions?: readonly ButtonConfig[]
}

type FrontmatterBlock =
  | FrontmatterProofBlock
  | FrontmatterFeaturesBlock
  | FrontmatterShowcaseBlock
  | FrontmatterSplitBlock
  | FrontmatterCtaBlock

/**
 * Custom HomeLayout for ciderpress.
 *
 * Renders the hero header followed by an ordered `blocks` array (proof,
 * features, showcase, split, cta) inside a continuous PageRail. Block
 * order is the array order and any block type may repeat — the whole deck
 * is driven by `home.blocks`, compiled into frontmatter by the sync engine.
 *
 * @param props - Hero slot props (kept for API compatibility with Rspress's HomeLayout).
 * @returns React element with the home page.
 */
export function HomeLayout(props: HomeLayoutProps): React.ReactElement {
  const { frontmatter } = useFrontmatter()

  // SSG-MD short-circuit: the React tree is walked by
  // `react-render-to-markdown` to produce `.md` files served to
  // `<LlmsCopyButton />`. Rendering the home shell would dump hero
  // text, demo blocks, and footer columns into every copied page.
  // Return an empty fragment for SSG-MD — the home page has no
  // canonical markdown body. The `useFrontmatter` hook above runs in
  // both passes so hook order stays consistent.
  if (import.meta.env.SSG_MD) {
    return <></>
  }

  const fm = frontmatter as Record<string, unknown>

  const hero = fm.hero as FrontmatterHero | undefined
  // heroDemo frontmatter:
  //   undefined → render the framework default
  //   false     → suppress entirely
  //   object    → render the user-supplied custom variant
  const heroDemoFm = fm.heroDemo as false | HomeHeroDemoConfig | undefined
  const blocks = (fm.blocks as readonly FrontmatterBlock[] | undefined) ?? []

  const heroDemoEl = match(heroDemoFm)
    .with(false, () => null)
    .with(undefined, () => <HeroDemo />)
    .otherwise((d) => <CustomHeroDemo config={d} />)

  const heroSection = match(hero)
    .with(undefined, () => null)
    .otherwise((h) => (
      <Hero
        eyebrow={h.label}
        title={renderTitle(h.text ?? h.name ?? '')}
        tagline={h.tagline}
        actions={mapButtonsToHeroActions(h.actions)}
        demo={heroDemoEl}
      />
    ))

  return (
    <PageRail>
      {props.beforeHero}
      {heroSection}
      {props.afterHero}
      {blocks.map((block, index) => (
        <React.Fragment key={`${block.type}-${index}`}>{renderBlock(block)}</React.Fragment>
      ))}
      <SiteFooter />
    </PageRail>
  )
}

/**
 * Render a single home block by its discriminated `type`.
 *
 * @private
 * @param block - Frontmatter block compiled from `home.blocks`.
 * @returns The block's React element, or null when it has no renderable data.
 */
function renderBlock(block: FrontmatterBlock): React.ReactNode {
  return match(block)
    .with({ type: 'proof' }, (b) => {
      const names = b.names ?? []
      return match(names.length === 0)
        .with(true, () => null)
        .otherwise(() => <TrustStrip lead={b.lead} names={names} />)
    })
    .with({ type: 'features' }, (b) => (
      <HomeFeature items={b.items} heading={b.heading} truncate={b.truncate} />
    ))
    .with({ type: 'showcase' }, (b) => (
      <HomeWorkspaces heading={b.heading} columns={b.columns} truncate={b.truncate} />
    ))
    .with({ type: 'split' }, (b) => (
      <HomeSplit
        eyebrow={b.label}
        title={b.title}
        body={b.body}
        bullets={b.bullets ?? []}
        action={match(b.cta)
          .with(undefined, () => undefined)
          .otherwise((c) => ({ theme: 'brand' as const, text: c.text, link: c.href }))}
        reverse={b.reverse}
        visual={match(b.visual)
          .with(undefined, () => null)
          .otherwise((v) => (
            <CustomSplitVisual visual={v} />
          ))}
      />
    ))
    .with({ type: 'cta' }, (b) =>
      match(b.title === undefined)
        .with(true, () => null)
        .otherwise(() => (
          <CTA
            title={b.title ?? ''}
            subtitle={b.subtitle}
            actions={mapButtonsToHeroActions(b.actions)}
          />
        ))
    )
    .exhaustive()
}

/**
 * Render a hero title with the trailing segment styled as a gradient.
 *
 * Splits the title on its last word break and wraps the tail in
 * `<span className="cp-hero__grad">`. When the title is a single word
 * (or empty), it renders verbatim.
 *
 * @private
 * @param raw - The raw title string from frontmatter.
 * @returns Title fragment with a gradient tail when applicable.
 */
function renderTitle(raw: string): React.ReactNode {
  const trimmed = raw.trim()
  return match(trimmed.length === 0)
    .with(true, () => null)
    .otherwise(() => {
      const words = trimmed.split(/\s+/)
      return match(words.length <= 1)
        .with(true, () => trimmed)
        .otherwise(() => {
          const tailCount = Math.max(1, Math.ceil(words.length / 2))
          const headWords = words.slice(0, words.length - tailCount).join(' ')
          const tailWords = words.slice(words.length - tailCount).join(' ')
          return (
            <>
              {headWords}
              <span className="cp-hero__grad"> {tailWords}</span>
            </>
          )
        })
    })
}

/**
 * Map the unified `ButtonConfig[]` shape (used by the `home.hero`
 * / cta configs) into the legacy `HeroAction[]` shape still consumed by
 * `<Hero />` and `<CTA />`. `'primary'` → `'brand'`,
 * `'secondary' | 'ghost'` → `'alt'`, `undefined` → `undefined`.
 *
 * @private
 * @param actions - Optional list of unified button configs from frontmatter
 * @returns Hero-action array consumed by the existing component API
 */
function mapButtonsToHeroActions(
  actions: readonly ButtonConfig[] | undefined
): readonly HeroAction[] | undefined {
  if (actions === undefined) {
    return undefined
  }
  return actions.map((action) => ({
    text: action.text,
    link: action.href,
    theme: mapButtonVariantToHeroTheme(action.variant),
  }))
}

/**
 * Project the `'primary' | 'secondary' | 'ghost'` variant token back into
 * the legacy `'brand' | 'alt'` token that `<Hero />` accepts.
 *
 * @private
 * @param variant - Optional variant from the unified button config
 * @returns `'brand'`, `'alt'`, or `undefined`
 */
function mapButtonVariantToHeroTheme(
  variant: ButtonConfig['variant']
): 'brand' | 'alt' | undefined {
  return match(variant)
    .with(undefined, () => undefined)
    .with('primary', () => 'brand' as const)
    .with('secondary', () => 'alt' as const)
    .with('ghost', () => 'alt' as const)
    .exhaustive()
}
