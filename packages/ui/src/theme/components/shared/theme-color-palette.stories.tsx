import type { Story } from '@ladle/react'

import { ThemeColorPalette } from './theme-color-palette.tsx'

const meta = {
  title: 'Data Display / Theme Color Palette',
}

export default meta

/**
 * Single palette — collapsed by default.
 *
 * @returns Mulled dark palette inside the accordion
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Default: Story = () => <ThemeColorPalette theme="mulled" />

/**
 * Palette pinned open on mount.
 *
 * @returns Honeycrisp dark palette, expanded
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const InitiallyOpen: Story = () => <ThemeColorPalette theme="honeycrisp" defaultOpen />

/**
 * Explicit variant — light token tree for a multi-variant theme.
 *
 * @returns Honeycrisp light palette
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const LightVariant: Story = () => (
  <ThemeColorPalette theme="honeycrisp" variant="light" defaultOpen />
)

/**
 * All six built-in themes stacked, default variants, all expanded.
 *
 * @returns Stack of palette accordions
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const AllBuiltIns: Story = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <ThemeColorPalette theme="mulled" defaultOpen />
    <ThemeColorPalette theme="honeycrisp" />
    <ThemeColorPalette theme="grannysmith" />
    <ThemeColorPalette theme="amber" />
    <ThemeColorPalette theme="midnight" />
    <ThemeColorPalette theme="arcade" />
  </div>
)
