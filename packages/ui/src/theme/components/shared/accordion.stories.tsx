import type { Story } from '@ladle/react'

import { Accordion, AccordionGroup } from './accordion.tsx'

const meta = {
  title: 'Disclosure / Accordion',
}

export default meta

/**
 * Single accordion — collapsed by default.
 *
 * @returns Accordion with title and body
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Default: Story = () => (
  <Accordion title="What is Ciderpress?">
    <p>
      Ciderpress is a documentation framework for monorepos. Point it at your existing markdown and
      get a full site without forcing a layout on the repo.
    </p>
  </Accordion>
)

/**
 * Accordion with icon and description shown alongside the title.
 *
 * @returns Accordion with icon and subtitle
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const WithIconAndDescription: Story = () => (
  <Accordion
    title="Theme cascade"
    description="How --cp-* tokens win over Rspress's --rp-* defaults"
    icon="pixelarticons:layers"
  >
    <p>
      Each theme palette declares a layer (`mulled`, `honeycrisp`, …) ordered after Rspress's base
      layer, so brand vars always win.
    </p>
  </Accordion>
)

/**
 * Accordion that starts expanded.
 *
 * @returns Accordion with initial open state
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const InitiallyOpen: Story = () => (
  <Accordion title="Open by default" icon="pixelarticons:check" defaultOpen>
    <p>This panel renders expanded on first mount.</p>
  </Accordion>
)

/**
 * Multiple accordions inside a Group — each is independent (multiple
 * may be open at once).
 *
 * @returns Group of independent accordions
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Group: Story = () => (
  <AccordionGroup>
    <Accordion title="First section" icon="pixelarticons:flag">
      <p>Plain content.</p>
    </Accordion>
    <Accordion title="Second section" icon="pixelarticons:bulb">
      <p>More plain content.</p>
    </Accordion>
    <Accordion title="Third section" icon="pixelarticons:bookmark">
      <p>Yet more.</p>
    </Accordion>
  </AccordionGroup>
)

/**
 * Exclusive group — only one accordion may be open at a time.
 *
 * @returns Group with mutex behaviour
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const ExclusiveGroup: Story = () => (
  <AccordionGroup exclusive>
    <Accordion title="Step 1 — Install" icon="pixelarticons:download">
      <p>Run `pnpm add ciderpress` in your repo root.</p>
    </Accordion>
    <Accordion title="Step 2 — Configure" icon="pixelarticons:sliders">
      <p>Create `ciderpress.config.ts` and point it at your docs directory.</p>
    </Accordion>
    <Accordion title="Step 3 — Run" icon="pixelarticons:play">
      <p>Run `pnpm cider dev` and open localhost:3000.</p>
    </Accordion>
  </AccordionGroup>
)
