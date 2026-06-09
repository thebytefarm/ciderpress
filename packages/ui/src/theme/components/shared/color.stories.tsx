import type { Story } from '@ladle/react'

import { Color } from './color.tsx'

const meta = {
  title: 'Data Display / Color Swatch',
}

export default meta

/**
 * Single swatch — click the button to copy the value to clipboard.
 *
 * @returns Color swatch
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Default: Story = () => <Color value="#dc2626" name="brand-1" />

/**
 * Anonymous swatch — no name, just the colour value as label.
 *
 * @returns Color swatch without a name
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Anonymous: Story = () => <Color value="hsl(0 84% 60%)" />

/**
 * Full Mulled palette laid out as a grid.
 *
 * @returns Grid of palette swatches
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Palette: Story = () => (
  <div
    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}
  >
    <Color value="#991b1b" name="brand-1" />
    <Color value="#7f1d1d" name="brand-2" />
    <Color value="#450a0a" name="brand-3" />
    <Color value="#dc2626" name="brand-light" />
    <Color value="#0a0a0a" name="bg" />
    <Color value="#0f0f0f" name="bg-alt" />
    <Color value="#161616" name="bg-elv" />
    <Color value="#f5f5f5" name="text-1" />
    <Color value="#2a2a2a" name="border" />
  </div>
)
