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
              {props.navItems.map((item) => (
                <RouteLink
                  key={item.link}
                  href={item.link}
                  className="cp-nav-drawer__link"
                  onClick={() => setOpen(false)}
                >
                  {item.text}
                </RouteLink>
              ))}
            </nav>

            <div className="cp-nav-drawer__divider" />

            <div className="cp-nav-drawer__row">
              <span className="cp-nav-drawer__row-label">Theme</span>
              <VariantToggle />
            </div>

            {props.socialLinks.length > 0 ? (
              <div className="cp-nav-drawer__row">
                <span className="cp-nav-drawer__row-label">Links</span>
                <CiderpressNavSocialLinks links={props.socialLinks} />
              </div>
            ) : null}

            {props.topbarCta === undefined ? null : (
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
