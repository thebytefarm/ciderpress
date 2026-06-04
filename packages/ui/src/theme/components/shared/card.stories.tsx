import type { Story } from '@ladle/react'
import type React from 'react'

import { Card } from './card.tsx'

export default {
  title: 'Shared / Card',
}

/**
 * Plain card without a link target — renders as `<div>`.
 *
 * @returns Static card
 */
export const Static: Story = () => (
  <Card>
    <h3 style={{ marginTop: 0 }}>Static card</h3>
    <p>No href supplied — the surface renders as a plain div.</p>
  </Card>
)

/**
 * Card with a safe URL — renders as the stubbed Rspress `<Link>`.
 *
 * @returns Clickable card
 */
export const Clickable: Story = () => (
  <Card href="/guides/getting-started">
    <h3 style={{ marginTop: 0 }}>Clickable card</h3>
    <p>href passes safeUrl validation, so the card becomes an anchor.</p>
  </Card>
)

/**
 * Card with an unsafe `javascript:` href — `safeUrl()` rejects it and the
 * card falls back to `<div>`. Visually identical to `Static`.
 *
 * @returns Card with stripped href
 */
export const RejectedHref: Story = () => (
  <Card href={'javascript:alert(1)'}>
    <h3 style={{ marginTop: 0 }}>Rejected href</h3>
    <p>Falls back to a div — XSS sink defused.</p>
  </Card>
)
