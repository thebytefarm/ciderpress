import type { Story } from '@ladle/react'

import { TechTag } from './tech-tag.tsx'

const meta = {
  title: 'Icons / Tech Tag',
}

export default meta

/**
 * Default — resolves `typescript` against the TECH_ICONS map and
 * renders the icon + label pair.
 *
 * @returns Single tech tag
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Default: Story = () => <TechTag name="typescript" />

/**
 * Several common language tags laid out inline.
 *
 * @returns Inline list of tags
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Languages: Story = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
    {['typescript', 'javascript', 'python', 'rust', 'go', 'java', 'ruby', 'php'].map((n) => (
      <TechTag key={n} name={n} />
    ))}
  </div>
)

/**
 * Unknown tag — falls back to the raw name without an icon.
 *
 * @returns Tag without an icon
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Fallback: Story = () => <TechTag name="not-a-real-tech-name" />
