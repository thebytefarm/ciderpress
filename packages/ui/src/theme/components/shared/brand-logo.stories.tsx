import type { Story } from '@ladle/react'

import { CiderpressLogo } from './ciderpress-logo.tsx'

const meta = {
  title: 'Brand / Logo',
}

export default meta

/**
 * Wordmark inheriting the active palette's `--rp-c-brand`.
 *
 * @returns Inline SVG wordmark
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Default: Story = () => (
  <div style={{ width: 'min(640px, 100%)' }}>
    <CiderpressLogo />
  </div>
)

/**
 * Explicit-size variant — useful for visual diffs against the favicon
 * mark and footer mark at fixed pixel dimensions.
 *
 * @returns SVG wordmark at three explicit sizes
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Sizes: Story = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <CiderpressLogo width={480} />
    <CiderpressLogo width={320} />
    <CiderpressLogo width={200} />
  </div>
)

/**
 * Custom accessible title — replaces the default `"ciderpress"` label
 * announced to screen readers.
 *
 * @returns Wordmark with custom title
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const CustomTitle: Story = () => (
  <div style={{ width: 480 }}>
    <CiderpressLogo title="ciderpress — documentation framework" />
  </div>
)
