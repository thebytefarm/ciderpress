import type { ButtonConfig, HomeVisual, TruncateConfig } from '@ciderpress/config'
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
import { HomeVisualView } from './home-visual'
import { PageRail } from './page-rail'
import { HomeSplit } from './split'
import { HomeTabs } from './tabs'
import type { HomeTabEntry } from './tabs'
import { TrustStrip } from './trust-strip'
import { HomeWorkspaces } from './workspaces'
import type { ShowcaseCard } from './workspaces'

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

/**
 * Flat heading trio carried by every copy-bearing block.
 *
 * @private
 */
interface FrontmatterHeading {
  readonly label?: string
  readonly title?: string
  readonly body?: string
}

interface FrontmatterProofBlock {
  readonly type: 'proof'
  readonly lead?: string
  readonly names?: readonly string[]
}

interface FrontmatterFeaturesBlock extends FrontmatterHeading {
  readonly type: 'features'
  readonly items?: readonly FeatureItem[]
  readonly columns?: 1 | 2 | 3 | 4
  readonly truncate?: TruncateConfig
}

interface FrontmatterShowcaseBlock extends FrontmatterHeading {
  readonly type: 'showcase'
  readonly cards?: readonly ShowcaseCard[]
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
  readonly visual?: HomeVisual
  readonly reverse?: boolean
}

/**
 * Tab entry as it arrives from frontmatter — the CTA is still a
 * `ButtonConfig`, not the component's `link`/`theme` shape.
 *
 * @private
 */
interface FrontmatterTabItem {
  readonly label: string
  readonly icon?: HomeTabEntry['icon']
  readonly title?: string
  readonly body?: string
  readonly bullets?: readonly string[]
  readonly cta?: ButtonConfig
  readonly visual?: HomeVisual
}

interface FrontmatterTabsBlock extends FrontmatterHeading {
  readonly type: 'tabs'
  readonly items?: readonly FrontmatterTabItem[]
  readonly orientation?: 'vertical' | 'horizontal'
  readonly reverse?: boolean
}

interface FrontmatterCtaBlock extends FrontmatterHeading {
  readonly type: 'cta'
  readonly actions?: readonly ButtonConfig[]
}

type FrontmatterBlock =
  | FrontmatterProofBlock
  | FrontmatterFeaturesBlock
  | FrontmatterShowcaseBlock
  | FrontmatterSplitBlock
  | FrontmatterTabsBlock
  | FrontmatterCtaBlock

/**
 * Custom HomeLayout for ciderpress.
 *
 * Renders the hero header followed by an ordered `blocks` array (proof,
 * features, showcase, split, tabs, cta) inside a continuous PageRail. Block
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
  const heroDemoFm = fm.heroDemo as false | HomeVisual | undefined
  const blocks = (fm.blocks as readonly FrontmatterBlock[] | undefined) ?? []

  const heroDemoEl = match(heroDemoFm)
    .with(false, () => null)
    .with(undefined, () => <HeroDemo />)
    .otherwise((d) => <HomeVisualView visual={d} context="hero" />)

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
      <HomeFeature
        items={b.items}
        heading={toHeading(b)}
        columns={b.columns}
        truncate={b.truncate}
      />
    ))
    .with({ type: 'showcase' }, (b) => (
      <HomeWorkspaces
        heading={toHeading(b)}
        cards={b.cards}
        columns={b.columns}
        truncate={b.truncate}
      />
    ))
    .with({ type: 'split' }, (b) => (
      <HomeSplit
        eyebrow={b.label}
        title={b.title}
        body={b.body}
        bullets={b.bullets ?? []}
        action={mapButtonToAction(b.cta)}
        reverse={b.reverse}
        visual={match(b.visual)
          .with(undefined, () => null)
          .otherwise((v) => (
            <HomeVisualView visual={v} context="split" />
          ))}
      />
    ))
    .with({ type: 'tabs' }, (b) => (
      <HomeTabs
        eyebrow={b.label}
        title={b.title}
        body={b.body}
        items={mapTabItems(b.items)}
        orientation={b.orientation}
        reverse={b.reverse}
      />
    ))
    .with({ type: 'cta' }, (b) =>
      match(b.title === undefined)
        .with(true, () => null)
        .otherwise(() => (
          <CTA
            eyebrow={b.label}
            title={b.title ?? ''}
            subtitle={b.body}
            actions={mapButtonsToHeroActions(b.actions)}
          />
        ))
    )
    .exhaustive()
}

/**
 * Map a single `ButtonConfig` into the `link`/`theme` action shape the
 * split and tab components take, preserving the configured variant.
 *
 * @private
 * @param button - Optional button config from frontmatter
 * @returns Action object, or undefined when no button is configured
 */
function mapButtonToAction(
  button: ButtonConfig | undefined
): { readonly text: string; readonly link: string; readonly theme?: 'brand' | 'alt' } | undefined {
  return match(button)
    .with(undefined, () => undefined)
    .otherwise((b) => ({
      text: b.text,
      link: b.href,
      theme: mapButtonVariantToHeroTheme(b.variant),
    }))
}

/**
 * Convert frontmatter tab entries into the component's entry shape. Only
 * the CTA needs work — its `ButtonConfig` becomes a `link`/`theme`
 * action; every other field passes through.
 *
 * @private
 * @param items - Tab entries from frontmatter, possibly absent or malformed
 * @returns Component-ready tab entries
 */
function mapTabItems(items: readonly FrontmatterTabItem[] | undefined): readonly HomeTabEntry[] {
  if (!Array.isArray(items)) {
    return []
  }
  return items.map((item) => ({ ...item, cta: mapButtonToAction(item.cta) }))
}

/**
 * Collect a block's flat `label` / `title` / `body` keys into the heading
 * object the grid components take.
 *
 * @private
 * @param block - Any block carrying the flat heading trio
 * @returns Heading object for the grid components
 */
function toHeading(block: FrontmatterHeading): FrontmatterHeading {
  return { label: block.label, title: block.title, body: block.body }
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
