import type { Story } from '@ladle/react'
import type React from 'react'

import { Badge, type BadgeProps } from './status-badge.tsx'

export default {
  title: 'Shared / Status Badge',
}

/**
 * Default badge — info variant.
 *
 * @param args - Badge props driven by Ladle controls
 * @returns Rendered badge
 */
export const Default: Story<BadgeProps> = (args) => <Badge {...args}>{args.children}</Badge>

Default.args = {
  children: 'Beta',
  variant: 'info',
}

Default.argTypes = {
  variant: {
    control: { type: 'radio' },
    options: ['info', 'success', 'warning', 'error'],
    defaultValue: 'info',
  },
}

/**
 * One badge per semantic variant for at-a-glance review.
 *
 * @returns Variant gallery
 */
export const Variants: Story = () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
    <Badge variant="info">Info</Badge>
    <Badge variant="success">Success</Badge>
    <Badge variant="warning">Warning</Badge>
    <Badge variant="error">Error</Badge>
  </div>
)

/**
 * Badge driven by a free-form custom color.
 *
 * @returns Custom-colored badge
 */
export const CustomColor: Story = () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
    <Badge color="#7c3aed">Violet</Badge>
    <Badge color="#0ea5e9">Sky</Badge>
    <Badge color="#f472b6">Pink</Badge>
  </div>
)
