import type { HomeVisual } from '@ciderpress/config'
import { match, P } from 'massaman/match'
import type React from 'react'
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components'

import { renderRichText, toPlainText } from '../../lib/rich-text.tsx'
import { RouteLink } from '../../lib/route-link.tsx'
import { safeUrl } from '../../lib/safe-url.ts'
import { CardIcon } from '../shared/card-icon'
import type { CardIconInput } from '../shared/resolve-card-icon'
import { resolveCardIcon } from '../shared/resolve-card-icon'
import { HomeVisualView } from './home-visual'

import './tabs.css'

/**
 * CTA rendered at the bottom of a tab panel's copy. Mirrors
 * `SplitAction` — the `ButtonConfig` from config is mapped into this
 * shape by the home layout.
 */
export interface TabsAction {
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
 * One tab in the strip plus the copy and visual its panel shows while
 * selected. Frontmatter-shaped: icons arrive pre-serialized from the
 * sync engine.
 */
export interface HomeTabEntry {
  /**
   * Tab label rendered in the strip.
   */
  readonly label: string
  /**
   * Icon rendered before the label.
   */
  readonly icon?: CardIconInput
  /**
   * Panel headline. Falls back to {@link HomeTabEntry.label}.
   */
  readonly title?: string
  /**
   * Panel body copy.
   */
  readonly body?: string
  /**
   * Checkmark bullets rendered under the body.
   */
  readonly bullets?: readonly string[]
  /**
   * CTA rendered at the bottom of the panel copy.
   */
  readonly cta?: TabsAction
  /**
   * Visual rendered in the panel while the tab is selected.
   */
  readonly visual?: HomeVisual
}

/**
 * Props for {@link HomeTabs} — the section heading trio, the tab
 * entries, and how the strip is laid out against the panel.
 */
export interface HomeTabsProps {
  /**
   * Eyebrow label rendered above the section title.
   */
  readonly eyebrow?: string
  /**
   * Section title rendered above the strip.
   */
  readonly title?: string
  /**
   * Supporting sentence rendered under the section title.
   */
  readonly body?: string
  /**
   * Tabs rendered in the strip, in order.
   */
  readonly items: readonly HomeTabEntry[]
  /**
   * Strip placement. `vertical` (default) stacks the tabs beside the
   * panel; `horizontal` runs them in a row above it.
   */
  readonly orientation?: 'vertical' | 'horizontal'
  /**
   * Flip a vertical band's columns — panel left, strip right. Ignored
   * when horizontal.
   */
  readonly reverse?: boolean
}

/**
 * HomeTabs — a strip of selectable tabs driving one panel. Clicking a tab
 * swaps the panel's copy and visual; the first tab is selected on load.
 *
 * Built on react-aria-components `Tabs`, so roving focus, arrow-key
 * navigation, and the tab/tabpanel ARIA wiring come from the library
 * rather than being hand-rolled.
 *
 * @param props - Heading trio, tab entries, orientation, and column order.
 * @returns React element with the tab band, or null when there are no tabs.
 */
export function HomeTabs(props: HomeTabsProps): React.ReactElement | null {
  const { eyebrow, title, body, items, orientation, reverse } = props
  // Frontmatter is unvalidated user content on hand-authored home pages —
  // treat anything that is not a populated array as "no band".
  const list = match(items)
    .with(
      P.when((i): i is readonly HomeTabEntry[] => Array.isArray(i) && i.length > 0),
      (i) => i
    )
    .otherwise(() => null)
  if (list === null) {
    return null
  }

  const axis = match(orientation)
    .with('horizontal', () => 'horizontal' as const)
    .otherwise(() => 'vertical' as const)
  const sectionClass = match(reverse ?? false)
    .with(true, () => `cp-tabs cp-tabs--${axis} cp-tabs--reverse`)
    .otherwise(() => `cp-tabs cp-tabs--${axis}`)
  // aria-label takes a bare string — strip any markup the title carries.
  const listLabel = match(title)
    .with(P.string, (t) => toPlainText(t))
    .otherwise(() => 'Highlights')

  return (
    <section className={sectionClass}>
      {renderHead({ eyebrow, title, body })}
      <Tabs className="cp-tabs__inner" orientation={axis}>
        <TabList className="cp-tabs__list" aria-label={listLabel}>
          {list.map((item, index) => (
            <Tab key={`${item.label}-${index}`} id={String(index)} className="cp-tabs__tab">
              {renderTabIcon(item.icon)}
              <span className="cp-tabs__tab-label">{renderRichText(item.label)}</span>
            </Tab>
          ))}
        </TabList>
        {list.map((item, index) => (
          <TabPanel
            key={`${item.label}-${index}`}
            id={String(index)}
            className={panelClass(item.visual)}
          >
            {renderPanelCopy(item)}
            {renderPanelVisual(item.visual)}
          </TabPanel>
        ))}
      </Tabs>
    </section>
  )
}

/**
 * Heading trio rendered above the strip.
 *
 * @private
 */
interface TabsHead {
  readonly eyebrow?: string
  readonly title?: string
  readonly body?: string
}

/**
 * Render the section heading, or nothing when every field is absent.
 * Reuses the shared feature-section head so the typography matches the
 * other home blocks.
 *
 * @private
 * @param head - Heading trio from the block
 * @returns Heading element, or null
 */
function renderHead(head: TabsHead): React.ReactElement | null {
  const { eyebrow, title, body } = head
  const hasContent = [eyebrow, title, body].some((value) => typeof value === 'string')
  if (!hasContent) {
    return null
  }
  return (
    <div className="cp-feature-section-head">
      {match(eyebrow)
        .with(P.string, (e) => (
          <div className="cp-feature-section-head__eyebrow">{renderRichText(e)}</div>
        ))
        .otherwise(() => null)}
      {match(title)
        .with(P.string, (t) => (
          <h2 className="cp-feature-section-head__title">{renderRichText(t)}</h2>
        ))
        .otherwise(() => null)}
      {match(body)
        .with(P.string, (s) => <p className="cp-feature-section-head__sub">{renderRichText(s)}</p>)
        .otherwise(() => null)}
    </div>
  )
}

/**
 * Render a tab's leading icon. Keeps the shared `cp-card__icon` chip so
 * the colour variants come from the card stylesheet; tabs.css only
 * shrinks it to fit the strip.
 *
 * @private
 * @param icon - Serialized icon from frontmatter
 * @returns Icon element, or null when the tab has no icon
 */
function renderTabIcon(icon: CardIconInput | undefined): React.ReactElement | null {
  const resolved = resolveCardIcon(icon)
  return match(resolved)
    .with(P.nonNullable, (r) => <CardIcon resolved={r} />)
    .otherwise(() => null)
}

/**
 * Class for a panel, collapsing it to a single column when the selected
 * tab carries no visual — otherwise a horizontal band would leave half
 * the row empty.
 *
 * @private
 * @param visual - The selected tab's optional visual
 * @returns Panel class name
 */
function panelClass(visual: HomeVisual | undefined): string {
  return match(visual)
    .with(P.nullish, () => 'cp-tabs__panel cp-tabs__panel--full')
    .otherwise(() => 'cp-tabs__panel')
}

/**
 * Render a panel's copy column — headline, body, bullets, and CTA. The
 * headline falls back to the tab label so a minimal entry still reads as
 * a titled panel.
 *
 * @private
 * @param item - The selected tab entry
 * @returns Copy column element
 */
function renderPanelCopy(item: HomeTabEntry): React.ReactElement {
  const heading = match(item.title)
    .with(P.string, (t) => t)
    .otherwise(() => item.label)
  const bullets = item.bullets ?? []

  return (
    <div className="cp-tabs__copy">
      <h3 className="cp-tabs__title">{renderRichText(heading)}</h3>
      {match(item.body)
        .with(P.string, (b) => <p className="cp-tabs__body">{renderRichText(b)}</p>)
        .otherwise(() => null)}
      {match(bullets.length === 0)
        .with(true, () => null)
        .otherwise(() => (
          <ul className="cp-tabs__bullets">
            {bullets.map((bullet) => (
              <li key={bullet}>
                <span className="cp-tabs__check">✓</span>
                <span>{renderRichText(bullet)}</span>
              </li>
            ))}
          </ul>
        ))}
      {renderPanelCta(item.cta)}
    </div>
  )
}

/**
 * Render a panel CTA, dropping links that fail URL validation.
 *
 * @private
 * @param cta - Optional CTA action
 * @returns Link element, or null
 */
function renderPanelCta(cta: TabsAction | undefined): React.ReactElement | null {
  return match(cta)
    .with(P.nonNullable, (a) => {
      const href = safeUrl(a.link)
      if (href === null) {
        return null
      }
      const className = match(a.theme ?? 'brand')
        .with('brand', () => 'cp-tabs__btn cp-tabs__btn--primary')
        .otherwise(() => 'cp-tabs__btn')
      return (
        <RouteLink className={className} href={href}>
          {a.text}
        </RouteLink>
      )
    })
    .otherwise(() => null)
}

/**
 * Render a panel's visual frame. Omitted entirely when the entry carries
 * no visual, so a copy-only tab does not paint an empty frame.
 *
 * @private
 * @param visual - Optional visual for the selected tab
 * @returns Framed visual element, or null
 */
function renderPanelVisual(visual: HomeVisual | undefined): React.ReactElement | null {
  return match(visual)
    .with(P.nonNullable, (v) => (
      <div className="cp-tabs__visual">
        <HomeVisualView visual={v} context="tabs" />
      </div>
    ))
    .otherwise(() => null)
}
