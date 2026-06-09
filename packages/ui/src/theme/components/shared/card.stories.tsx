import type { Story } from '@ladle/react'

import { Card } from './card.tsx'

const meta = {
  title: 'Surface / Card',
}

export default meta

/**
 * Plain card without a link target — renders as `<div>`.
 *
 * @returns Static card
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
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
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
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
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const RejectedHref: Story = () => (
  // oxlint-disable-next-line no-script-url -- testing safeUrl() rejection
  <Card href={'javascript:alert(1)'}>
    <h3 style={{ marginTop: 0 }}>Rejected href</h3>
    <p>Falls back to a div — XSS sink defused.</p>
  </Card>
)
