import type { Story } from '@ladle/react'

import { Frame } from './frame.tsx'

const meta = {
  title: 'Layout / Frame',
}

export default meta

const IMAGE_URL = 'https://picsum.photos/seed/ciderpress-frame/1200/600'

/**
 * Bare frame — image wrapped in a `<figure>` with the standard border
 * treatment.
 *
 * @returns Frame around an image
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Default: Story = () => (
  <Frame>
    <img src={IMAGE_URL} alt="Sample" />
  </Frame>
)

/**
 * Frame with a caption rendered below the content.
 *
 * @returns Frame with caption
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const WithCaption: Story = () => (
  <Frame caption="Figure 1. Default Ciderpress landing page.">
    <img src={IMAGE_URL} alt="Sample" />
  </Frame>
)

/**
 * Frame with a hint rendered above the content — useful for callouts
 * like "Source: …" or "Live preview".
 *
 * @returns Frame with hint and caption
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const WithHint: Story = () => (
  <Frame hint="Live preview" caption="Theme: mulled · variant: dark">
    <img src={IMAGE_URL} alt="Sample" />
  </Frame>
)
