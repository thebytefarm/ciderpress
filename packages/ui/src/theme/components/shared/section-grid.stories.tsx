import type { Story } from '@ladle/react'

import { SectionCard } from './section-card.tsx'
import { SectionGrid } from './section-grid.tsx'

const meta = {
  title: 'Layout / Section Grid',
}

export default meta

/**
 * Section grid populated with the same SectionCards used on auto-
 * generated landing pages.
 *
 * @returns Grid wrapping four section cards
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Default: Story = () => (
  <SectionGrid>
    <SectionCard
      href="/guides/getting-started"
      title="Getting started"
      description="Spin up a docs site against your existing markdown."
      icon={{ id: 'pixelarticons:flag', color: 'purple' }}
    />
    <SectionCard
      href="/concepts"
      title="Concepts"
      description="How the sync engine and theme cascade fit together."
      icon={{ id: 'pixelarticons:bulb', color: 'amber' }}
    />
    <SectionCard
      href="/references/cli"
      title="CLI reference"
      description="Every command, flag, and config option."
      icon={{ id: 'pixelarticons:command', color: 'blue' }}
    />
    <SectionCard
      href="/examples"
      title="Examples"
      description="Real-world Ciderpress sites you can copy from."
      icon={{ id: 'pixelarticons:layout', color: 'green' }}
    />
  </SectionGrid>
)
