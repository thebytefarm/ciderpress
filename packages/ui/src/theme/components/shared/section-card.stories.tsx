import type { Story } from '@ladle/react'

import { SectionCard } from './section-card.tsx'

const meta = {
  title: 'Surface / Section Card',
}

export default meta

/**
 * Default — icon, title, description. Renders as a clickable `<a>`
 * routed through the stubbed Rspress `<Link>`.
 *
 * @returns Linked section card
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Default: Story = () => (
  <SectionCard
    href="/guides/getting-started"
    title="Getting started"
    description="Spin up a Ciderpress site against your existing markdown in under five minutes."
    icon="pixelarticons:flag"
  />
)

/**
 * No description — minimum content.
 *
 * @returns Section card with title only
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const TitleOnly: Story = () => (
  <SectionCard href="/concepts" title="Concepts" icon="pixelarticons:bulb" />
)

/**
 * Custom icon + colour — pass `{ id, color }` to override the auto
 * resolution from `resolveCardIcon`.
 *
 * @returns Card with explicit blue icon
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const CustomIcon: Story = () => (
  <SectionCard
    href="/references/api"
    title="API reference"
    description="Every public export with full prop tables and example snippets."
    icon={{ id: 'pixelarticons:code', color: 'blue' }}
  />
)
