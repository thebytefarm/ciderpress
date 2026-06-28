import type {
  ButtonConfig,
  HomeHeroDemoConfig,
  HomeSectionId,
  HomeSplitConfig,
} from '@ciderpress/config'
import { DEFAULT_HOME_LAYOUT } from '@ciderpress/config'
import { useFrontmatter } from '@rspress/core/runtime'
import { match, P } from 'massaman/match'
import React from 'react'

import { SiteFooter } from '../footer/site-footer'
import { CTA } from './cta'
import { HomeFeature } from './feature'
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
  readonly beforeFeatures?: React.ReactNode
  readonly afterFeatures?: React.ReactNode
}

interface FrontmatterHero {
  readonly name?: string
  readonly text?: string
  readonly tagline?: string
  readonly actions?: readonly ButtonConfig[]
  readonly label?: string
}

interface FrontmatterProof {
  readonly lead?: string
  readonly names?: readonly string[]
}

interface FrontmatterCTA {
  readonly title?: string
  readonly subtitle?: string
  readonly actions?: readonly ButtonConfig[]
}

/**
 * Custom HomeLayout for ciderpress.
 *
 * Renders the approved mockup landing surface inside a continuous PageRail:
 * Hero → TrustStrip → Features → Workspaces → CTA → SiteFooter. Sections
 * render only when their data is present in frontmatter, so consumers opt
 * in to each band individually.
 *
 * @param props - Slot props (kept for API compatibility with Rspress's HomeLayout).
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
  const proof = fm.proof as FrontmatterProof | undefined
  const cta = fm.cta as FrontmatterCTA | undefined
  // heroDemo / split frontmatter:
  //   undefined → render the framework default
  //   false     → suppress entirely
  //   object    → render the user-supplied custom variant
  const heroDemoFm = fm.heroDemo as false | HomeHeroDemoConfig | undefined
  const splitFm = fm.split as false | HomeSplitConfig | undefined

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

  const proofSection = match(proof)
    .with(undefined, () => null)
    .otherwise((t) => {
      const names = t.names ?? []
      return match(names.length === 0)
        .with(true, () => null)
        .otherwise(() => <TrustStrip lead={t.lead} names={names} />)
    })

  const ctaSection = match(cta)
    .with(undefined, () => null)
    .otherwise((c) =>
      match(c.title === undefined)
        .with(true, () => null)
        .otherwise(() => (
          <CTA
            title={c.title ?? ''}
            subtitle={c.subtitle}
            actions={mapButtonsToHeroActions(c.actions)}
          />
        ))
    )

  const splitSection = match(splitFm)
    .with(false, () => null)
    .with(undefined, () => (
      <HomeSplit
        eyebrow="Configuration"
        title="One file. Validated. Type-safe."
        body="Define your docs site in ciderpress.config.ts. Zod validates at boot — no surprises in prod."
        bullets={[
          'Type-safe config with full IntelliSense',
          'Hot-reloads on every save',
          'Composable presets for OpenAPI, blog, changelog',
          'First-class i18n out of the box',
        ]}
        action={{ theme: 'brand', text: 'Read the docs', link: '/getting-started/quick-start' }}
        visual={<ConfigPreview />}
      />
    ))
    .with(P.nonNullable, (s) => (
      <HomeSplit
        eyebrow={s.label}
        title={s.title}
        body={s.body}
        bullets={s.bullets ?? []}
        action={match(s.cta)
          .with(undefined, () => undefined)
          .otherwise((c) => ({ theme: 'brand' as const, text: c.text, link: c.href }))}
        visual={match(s.visual)
          .with(undefined, () => null)
          .otherwise((v) => (
            <CustomSplitVisual code={v.code} language={v.language} />
          ))}
      />
    ))
    .exhaustive()

  // Section render order. `home.layout` (when provided) controls both
  // order and visibility — sections omitted from the array are not
  // rendered. The framework default (`DEFAULT_HOME_LAYOUT`) preserves
  // the historical fixed order. Unknown ids are ignored at render time
  // (the schema rejects them at config-load anyway).
  const layout = (fm.layout as readonly HomeSectionId[] | undefined) ?? DEFAULT_HOME_LAYOUT
  const sectionsById: Readonly<Record<HomeSectionId, React.ReactNode>> = {
    hero: (
      <>
        {props.beforeHero}
        {heroSection}
        {props.afterHero}
      </>
    ),
    proof: proofSection,
    features: (
      <>
        {props.beforeFeatures}
        <HomeFeature />
        {props.afterFeatures}
      </>
    ),
    split: splitSection,
    showcase: <HomeWorkspaces />,
    cta: ctaSection,
  }

  return (
    <PageRail>
      {layout.map((id) => (
        <React.Fragment key={id}>{sectionsById[id]}</React.Fragment>
      ))}
      <SiteFooter />
    </PageRail>
  )
}

/**
 * ConfigPreview — minimal `defineConfig` code preview shown inside the
 * Split section. Imports come exclusively from `ciderpress` so the
 * sample resolves against the published package set.
 *
 * @returns React element.
 */
function ConfigPreview(): React.ReactElement {
  return (
    <pre>
      <span className="tok-kw">import</span> {'{ defineConfig }'}{' '}
      <span className="tok-kw">from</span> <span className="tok-str">'ciderpress'</span>
      {'\n\n'}
      <span className="tok-kw">export default</span> <span className="tok-fn">defineConfig</span>
      {'({\n'}
      {'  title: '}
      <span className="tok-str">'Acme Docs'</span>
      {',\n'}
      {'  pages: [\n'}
      {'    { title: '}
      <span className="tok-str">'Guides'</span>
      {', include: '}
      <span className="tok-str">'docs/guides/*.md'</span>
      {' },\n'}
      {'  ],\n'}
      {'  theme: { themes: ['}
      <span className="tok-str">'mulled'</span>
      {'] },\n'}
      {'})'}
    </pre>
  )
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
 * Map the unified `ButtonConfig[]` shape (used by the new `home.hero`
 * / `home.cta` configs) into the legacy `HeroAction[]` shape still
 * consumed by `<Hero />` and `<CTA />`. `'primary'` → `'brand'`,
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
 * Project the new `'primary' | 'secondary' | 'ghost'` variant token
 * back into the legacy `'brand' | 'alt'` token that `<Hero />` accepts.
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
