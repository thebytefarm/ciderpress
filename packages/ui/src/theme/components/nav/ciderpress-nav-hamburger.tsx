import { match } from 'massaman/match'
import { useState } from 'react'
import type React from 'react'
import { Dialog, Modal, ModalOverlay } from 'react-aria-components'

import { RouteLink } from '../../lib/route-link.tsx'
import { Icon } from '../shared/icon.tsx'
import type { CiderpressNavMenuItem } from './ciderpress-nav-menu'
import { CiderpressNavSocialLinks } from './ciderpress-nav-social-links'
import type { CiderpressSocialLink } from './ciderpress-nav-social-links'
import { TopbarCTA } from './topbar-cta'
import { VariantToggle } from './variant-toggle'

import './ciderpress-nav-hamburger.css'

/**
 * Props for the mobile hamburger menu.
 */
export interface CiderpressNavHamburgerProps {
  readonly navItems: readonly CiderpressNavMenuItem[]
  readonly socialLinks: readonly CiderpressSocialLink[]
  readonly topbarCta: { readonly text: string; readonly href: string } | undefined
}

/**
 * Mobile hamburger trigger + slide-in drawer. Shown only at narrow
 * viewports (CSS-driven via `--cp-nav-hamburger-breakpoint`). Drawer
 * surfaces the full primary nav, variant toggle, social cluster, and
 * CTA on screens where the desktop chrome can't fit.
 *
 * Built on `react-aria-components` `<ModalOverlay>` + `<Dialog>`, which
 * provides a proper focus trap, focus restoration to the trigger,
 * inert/aria-hidden on the rest of the page, ESC dismissal, and
 * scroll-locking. Hand-rolling that correctly is famously hard, so we
 * delegate.
 *
 * @param props - Nav items / social / CTA configuration
 * @returns Hamburger button (mobile) + drawer (when open)
 */
export function CiderpressNavHamburger(props: CiderpressNavHamburgerProps): React.ReactElement {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="cp-nav-hamburger"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
      >
        <Icon icon="pixelarticons:menu" width={20} height={20} />
      </button>
      <ModalOverlay
        className="cp-nav-drawer-root"
        isOpen={open}
        onOpenChange={setOpen}
        isDismissable
      >
        <Modal className="cp-nav-drawer-modal">
          <Dialog className="cp-nav-drawer" aria-label="Site navigation">
            <header className="cp-nav-drawer__header">
              <span className="cp-nav-drawer__title">Menu</span>
              <button
                type="button"
                className="cp-nav-drawer__close"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
              >
                <Icon icon="pixelarticons:close" width={18} height={18} />
              </button>
            </header>

            <nav className="cp-nav-drawer__nav" aria-label="Primary">
              {props.navItems.map((item, index) => (
                <DrawerNavEntry
                  key={`${drawerItemKey(item)}::${index}`}
                  item={item}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </nav>

            <div className="cp-nav-drawer__divider" />

            <div className="cp-nav-drawer__row">
              <span className="cp-nav-drawer__row-label">Theme</span>
              <VariantToggle />
            </div>

            {props.socialLinks.length > 0 && (
              <div className="cp-nav-drawer__row">
                <span className="cp-nav-drawer__row-label">Links</span>
                <CiderpressNavSocialLinks links={props.socialLinks} />
              </div>
            )}

            {props.topbarCta !== undefined && (
              <div className="cp-nav-drawer__footer">
                <TopbarCTA text={props.topbarCta.text} href={props.topbarCta.href} />
              </div>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  )
}

export { CiderpressNavHamburger as default }

/**
 * Render one entry in the mobile drawer nav. Leaf items are a single
 * link; dropdown parents become a collapsible {@link DrawerNavGroup}.
 *
 * @private
 * @param props - The nav item and a callback to close the drawer.
 * @returns The drawer entry element.
 */
function DrawerNavEntry(props: {
  readonly item: CiderpressNavMenuItem
  readonly onNavigate: () => void
}): React.ReactElement {
  const { item, onNavigate } = props
  const children = item.items ?? []
  return match(children.length > 0)
    .with(true, () => <DrawerNavGroup item={item} onNavigate={onNavigate} />)
    .otherwise(() => (
      <RouteLink href={item.link ?? '#'} className="cp-nav-drawer__link" onClick={onNavigate}>
        {item.text}
      </RouteLink>
    ))
}

/**
 * A collapsible dropdown section in the mobile drawer: a tappable header
 * that toggles its child links open/closed. Collapsed by default so a
 * deep nav doesn't fill the drawer on open.
 *
 * @private
 * @param props - The dropdown item and a callback to close the drawer.
 * @returns The collapsible group element.
 */
function DrawerNavGroup(props: {
  readonly item: CiderpressNavMenuItem
  readonly onNavigate: () => void
}): React.ReactElement {
  const { item, onNavigate } = props
  const [expanded, setExpanded] = useState(false)
  const children = item.items ?? []
  return (
    <div className="cp-nav-drawer__group" role="group" aria-label={item.text}>
      <button
        type="button"
        className="cp-nav-drawer__group-toggle"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        <span>{item.text}</span>
        <Icon
          className="cp-nav-drawer__group-chevron"
          icon="pixelarticons:chevron-down"
          width={16}
          height={16}
        />
      </button>
      {expanded && (
        <div className="cp-nav-drawer__group-items">
          {children.map((child, index) => (
            <RouteLink
              key={`${drawerItemKey(child)}::${index}`}
              href={child.link ?? '#'}
              className="cp-nav-drawer__link cp-nav-drawer__link--nested"
              onClick={onNavigate}
            >
              {child.text}
            </RouteLink>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Stable React key for a drawer nav item — its link when present,
 * otherwise its label (dropdown parents may have no link of their own).
 *
 * @private
 * @param item - Nav item to key.
 * @returns Key string.
 */
function drawerItemKey(item: CiderpressNavMenuItem): string {
  if (item.link !== undefined && item.link !== '') {
    return item.link
  }
  return item.text
}
