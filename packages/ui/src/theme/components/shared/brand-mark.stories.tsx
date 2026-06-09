import type { Story } from '@ladle/react'

import { CiderpressMark } from './ciderpress-mark.tsx'

const meta = {
  title: 'Brand / Mark',
}

export default meta

/**
 * Default brand mark — rounded-square chip with `cp` monogram in
 * the active palette's brand colour.
 *
 * @returns SVG mark at 64px
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Default: Story = () => <CiderpressMark size={64} />

/**
 * Size scale used across nav, footer, and favicon contexts.
 *
 * @returns Marks at 16/24/32/48/64/96/128 px
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Sizes: Story = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
    {[16, 24, 32, 48, 64, 96, 128].map((s) => (
      <div key={s} style={{ textAlign: 'center' }}>
        <CiderpressMark size={s} />
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: 'var(--cp-c-text-3)',
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          {s}px
        </div>
      </div>
    ))}
  </div>
)

/**
 * Decorative mark — empty title sets `aria-hidden` so screen readers
 * skip it. Use this when the surrounding text already conveys meaning.
 *
 * @returns Mark hidden from a11y tree
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Decorative: Story = () => <CiderpressMark size={64} title="" />
