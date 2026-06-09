import type React from 'react'

import './nav-divider.css'

/**
 * Thin vertical divider used to separate adjacent groups of nav items
 * in the topbar (logo / search / menu / icons / CTA).
 *
 * Themable via the `--cp-c-divider` CSS custom property and the
 * `.cp-nav-divider` class. The divider is `aria-hidden` so it does not
 * pollute the accessibility tree.
 *
 * @returns Inline-flex divider element
 */
export function NavDivider(): React.ReactElement {
  return <span className="cp-nav-divider" aria-hidden="true" />
}

export { NavDivider as default }
