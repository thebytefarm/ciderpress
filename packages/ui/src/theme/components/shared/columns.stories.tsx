import type { Story } from '@ladle/react'
import type React from 'react'

import { Column, Columns } from './columns.tsx'

const meta = {
  title: 'Layout / Columns',
}

export default meta

function Cell({ n }: { readonly n: number }): React.ReactElement {
  return (
    <div
      style={{
        padding: '20px 16px',
        background: 'var(--cp-c-bg-soft)',
        border: '1px solid var(--cp-c-border)',
        borderRadius: 'var(--rp-radius)',
        textAlign: 'center',
        fontFamily: 'ui-monospace, monospace',
        color: 'var(--cp-c-text-2)',
      }}
    >
      cell {n}
    </div>
  )
}

/**
 * Two-column grid — the default. Collapses to a single column below
 * 640px.
 *
 * @returns Two-column grid
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const TwoColumns: Story = () => (
  <Columns>
    <Cell n={1} />
    <Cell n={2} />
  </Columns>
)

/**
 * Three-column grid.
 *
 * @returns Three-column grid
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const ThreeColumns: Story = () => (
  <Columns cols={3}>
    <Cell n={1} />
    <Cell n={2} />
    <Cell n={3} />
  </Columns>
)

/**
 * Four-column grid — densest variant.
 *
 * @returns Four-column grid
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const FourColumns: Story = () => (
  <Columns cols={4}>
    {[1, 2, 3, 4].map((n) => (
      <Cell key={n} n={n} />
    ))}
  </Columns>
)

/**
 * Explicit `<Column>` wrappers — use these when a cell needs to group
 * multiple elements into a single grid slot.
 *
 * @returns Two-column grid with grouped content per column
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const ExplicitColumns: Story = () => (
  <Columns>
    <Column>
      <h3 style={{ marginTop: 0 }}>Left</h3>
      <p>Multiple elements in one grid slot.</p>
      <p>Second paragraph stays grouped.</p>
    </Column>
    <Column>
      <h3 style={{ marginTop: 0 }}>Right</h3>
      <p>Mirrored layout on the other side.</p>
    </Column>
  </Columns>
)
