import type { Story } from '@ladle/react'

import { Tooltip } from './tooltip.tsx'

const meta = {
  title: 'Disclosure / Tooltip',
}

export default meta

/**
 * Bare tooltip — hover the trigger to reveal a tip with no headline
 * or call to action.
 *
 * @returns Sentence with an inline tooltip trigger
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Default: Story = () => (
  <p style={{ lineHeight: 2 }}>
    Hover{' '}
    <Tooltip tip="A small package of design tokens applied as CSS custom properties to <html>.">
      <span style={{ borderBottom: '1px dashed var(--cp-c-brand-1)', cursor: 'help' }}>
        the theme cascade
      </span>
    </Tooltip>{' '}
    to see the explanation pop in.
  </p>
)

/**
 * Tooltip with a bold headline above the tip.
 *
 * @returns Tooltip with headline + tip
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const WithHeadline: Story = () => (
  <p style={{ lineHeight: 2 }}>
    Read about the{' '}
    <Tooltip
      headline="Sync engine"
      tip="Watches your source markdown and mirrors structure into Rspress's expected layout."
    >
      <span style={{ borderBottom: '1px dashed var(--cp-c-brand-1)', cursor: 'help' }}>
        sync engine
      </span>
    </Tooltip>{' '}
    in the architecture docs.
  </p>
)

/**
 * Tooltip with a call-to-action link in the overlay — routed through
 * the stubbed Rspress `<Link>` so external/internal handling matches
 * production.
 *
 * @returns Tooltip with headline, tip, and CTA
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const WithCta: Story = () => (
  <p style={{ lineHeight: 2 }}>
    Try the{' '}
    <Tooltip
      headline="Mulled palette"
      tip="The default Ciderpress palette — deep red brand on near-black surfaces."
      cta="See the full palette →"
      href="/guides/themes/mulled"
    >
      <span style={{ borderBottom: '1px dashed var(--cp-c-brand-1)', cursor: 'help' }}>Mulled</span>
    </Tooltip>{' '}
    palette.
  </p>
)
