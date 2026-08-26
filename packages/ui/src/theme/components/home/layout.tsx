import type { ButtonConfig, HomeVisual, TruncateConfig } from '@ciderpress/config'
import { useFrontmatter } from '@rspress/core/runtime'
import { match, P } from 'massaman/match'
import React from 'react'

import { hasAccentMarker, isPlainText, renderRichText } from '../../lib/rich-text.tsx'
import { SiteFooter } from '../footer/site-footer'
import { CTA } from './cta'
import { HomeFeature } from './feature'
import type { FeatureItem } from './feature-card'
import { Hero } from './hero'
import type { HeroAction, HeroBackground } from './hero'
import { HeroDemo } from './hero-demo'
import { HomeVisualView } from './home-visual'
import { PageRail } from './page-rail'
import { HomeSplit } from './split'
import { HomeTabs } from './tabs'
import type { HomeTabEntry } from './tabs'
import { TrustStrip } from './trust-strip'
import type { TrustItem } from './trust-strip'
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
  /**
   * Eyebrow chip copy. The sync engine reads `hero.label` from the config
   * and emits it under this key (see `emitHero` in
   * `@ciderpress/cli/lib/sync/home.ts`), so the frontmatter name is
   * `eyebrow`, not `label`.
   */
  readonly eyebrow?: string
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
  readonly names?: readonly TrustItem[]
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
  // heroBackground frontmatter arrives as an unvalidated object (or `null`
  // when hand-authored with a blank `heroBackground:` line). Treat anything
  // without a string `src` as absent — `Hero` reads `.length` on that field.
  const heroBackground = match(fm.heroBackground)
    .with({ src: P.string }, (b) => b as HeroBackground)
    .otherwise(() => undefined)
  const blocks = (fm.blocks as readonly FrontmatterBlock[] | undefined) ?? []

  // `P.nullish`, not `undefined`: a blank `heroDemo:` in a hand-authored
  // index.md parses to null, which misses an `undefined` arm and would
  // reach HomeVisualView with nothing to render.
  const heroDemoEl = match(heroDemoFm)
    .with(false, () => null)
    .with(P.nullish, () => <HeroDemo />)
    .otherwise((d) => <HomeVisualView visual={d} context="hero" />)

  const heroSection = match(hero)
    .with(undefined, () => null)
    .otherwise((h) => (
      <Hero
        eyebrow={renderOptionalRichText(h.eyebrow)}
        title={renderTitle(h.text ?? h.name ?? '')}
        tagline={renderOptionalRichText(h.tagline)}
        actions={mapButtonsToHeroActions(h.actions)}
        demo={heroDemoEl}
        background={heroBackground}
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
 * Terminates in `.otherwise`, not `.exhaustive`: `blocks` is read from
 * frontmatter with a cast, and a hand-authored `index.md` short-circuits
 * the sync engine's block compilation entirely, so an unrecognized `type`
 * is reachable user input. `.exhaustive()` would throw `NonExhaustiveError`
 * mid-render and take down the whole page — and the SSG build with it —
 * over one typo. An unknown block renders as nothing instead.
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
        title={renderRichText(b.title)}
        body={renderOptionalRichText(b.body)}
        bullets={b.bullets ?? []}
        action={mapButtonToAction(b.cta)}
        reverse={b.reverse}
        visual={match(b.visual)
          .with(P.nullish, () => null)
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
      // Blank/absent title, not just `undefined` — a hand-authored `title:`
      // parses to null and `title: ''` is empty, and either would paint the
      // full band (eyebrow, glow, buttons) around an empty headline.
      match(renderOptionalRichText(b.title))
        .with(P.nullish, () => null)
        .otherwise((title) => (
          <CTA
            eyebrow={b.label}
            title={title}
            subtitle={renderOptionalRichText(b.body)}
            actions={mapButtonsToHeroActions(b.actions)}
          />
        ))
    )
    .otherwise(() => null)
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
  if (!isButtonConfig(button)) {
    return undefined
  }
  return {
    text: button.text,
    link: button.href,
    theme: mapButtonVariantToHeroTheme(button.variant),
  }
}

/**
 * Convert frontmatter tab entries into the component's entry shape. Only
 * the CTA needs work — its `ButtonConfig` becomes a `link`/`theme`
 * action; every other field passes through.
 *
 * Malformed entries are dropped rather than rendered: a YAML sequence
 * with a blank item yields `null`, which would throw on the first
 * property read.
 *
 * @private
 * @param items - Tab entries from frontmatter, possibly absent or malformed
 * @returns Component-ready tab entries
 */
function mapTabItems(items: readonly FrontmatterTabItem[] | undefined): readonly HomeTabEntry[] {
  if (!Array.isArray(items)) {
    return []
  }
  return items.filter(isTabItem).map(toTabEntry)
}

/**
 * Project one validated frontmatter tab entry onto the component's entry
 * shape — only the CTA changes form.
 *
 * @private
 * @param item - Validated tab entry from frontmatter
 * @returns Component-ready tab entry
 */
function toTabEntry(item: FrontmatterTabItem): HomeTabEntry {
  return {
    label: item.label,
    icon: item.icon,
    title: item.title,
    body: item.body,
    bullets: item.bullets,
    cta: mapButtonToAction(item.cta),
    visual: item.visual,
  }
}

/**
 * Whether a frontmatter value is a usable tab entry. `label` is the one
 * required field — it is the clickable text and the render key.
 *
 * @private
 * @param value - Unvalidated entry from frontmatter
 * @returns True when the entry can be rendered
 */
function isTabItem(value: unknown): value is FrontmatterTabItem {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const item = value as { label?: unknown }
  return typeof item.label === 'string'
}

/**
 * Whether a frontmatter value is a usable button config. Both `text` and
 * `href` must be strings — `safeUrl` would throw on a missing `href`.
 *
 * @private
 * @param value - Unvalidated button from frontmatter
 * @returns True when the button can be rendered
 */
function isButtonConfig(value: unknown): value is ButtonConfig {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const button = value as { text?: unknown; href?: unknown }
  return typeof button.text === 'string' && typeof button.href === 'string'
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
 * Render optional rich-text copy, collapsing absent or blank values to
 * `undefined` rather than an empty node.
 *
 * Callers treat `undefined` as "omit this element entirely". Passing
 * `renderRichText('')` instead returns an empty-but-defined node, which
 * slips past those checks and paints a styled shell with no content in
 * it: an empty eyebrow chip renders as a stray pill above the headline.
 *
 * @private
 * @param raw - Optional raw copy from frontmatter.
 * @returns Rendered fragment, or undefined when there is nothing to show.
 */
function renderOptionalRichText(raw: string | undefined): React.ReactNode {
  const value = raw ?? ''
  return match(value.trim() === '')
    .with(true, () => undefined)
    .otherwise(() => renderRichText(value))
}

/**
 * Render a hero title, accenting part of it in the brand colour.
 *
 * Two modes, so the default is good and the override is exact:
 *
 * - **explicit** — a title carrying `**emphasis**` accents precisely
 *   what the author marked, and nothing else
 * - **automatic** — a title of unmarked text accents the trailing half
 *   of its words, the long-standing behaviour
 *
 * A title carrying any other markup renders as written: the automatic
 * pass works on the raw string, so it would cut links and code spans in
 * half.
 *
 * Either way the copy runs through the inline renderer, so code and
 * links work in a title regardless of which mode applies.
 *
 * @private
 * @param raw - The raw title string from frontmatter.
 * @returns Title fragment.
 */
function renderTitle(raw: string): React.ReactNode {
  const trimmed = raw.trim()
  if (trimmed.length === 0) {
    return null
  }
  // The automatic accent slices the raw string, so it can only run on
  // copy with no markup in it — splitting `[a b](/c)` or `` `a b` ``
  // down the middle would produce two broken fragments.
  if (hasAccentMarker(trimmed) || !isPlainText(trimmed)) {
    return renderRichText(trimmed)
  }
  const words = trimmed.split(/\s+/)
  if (words.length <= 1) {
    return renderRichText(trimmed)
  }
  const tailCount = Math.max(1, Math.ceil(words.length / 2))
  const headWords = words.slice(0, words.length - tailCount).join(' ')
  const tailWords = words.slice(words.length - tailCount).join(' ')
  return (
    <>
      {renderRichText(headWords)}
      <span className="cp-hero__grad"> {renderRichText(tailWords)}</span>
    </>
  )
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
  if (!Array.isArray(actions)) {
    return undefined
  }
  return actions.filter(isButtonConfig).map((action) => ({
    text: action.text,
    link: action.href,
    theme: mapButtonVariantToHeroTheme(action.variant),
  }))
}

/**
 * Project the `'primary' | 'secondary' | 'ghost'` variant token back into
 * the legacy `'brand' | 'alt'` token that `<Hero />` accepts.
 *
 * Terminates in `.otherwise`: `isButtonConfig` only checks `text` and
 * `href`, so an unrecognized `variant` on a hand-authored button reaches
 * here. This runs for hero, split, and tab CTAs alike, and `.exhaustive()`
 * threw on all three. An unknown variant falls back to the default style.
 *
 * @private
 * @param variant - Optional variant from the unified button config
 * @returns `'brand'`, `'alt'`, or `undefined`
 */
function mapButtonVariantToHeroTheme(
  variant: ButtonConfig['variant']
): 'brand' | 'alt' | undefined {
  return match(variant)
    .with('primary', () => 'brand' as const)
    .with(P.union('secondary', 'ghost'), () => 'alt' as const)
    .otherwise(() => undefined)
}
