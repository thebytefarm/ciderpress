import { useEffect, useState } from 'react'
import type React from 'react'

import { Icon } from '../shared/icon.tsx'
import type { CiderpressNavMenuItem } from './ciderpress-nav-menu'
import { CiderpressNavSocialLinks } from './ciderpress-nav-social-links'
import type { CiderpressSocialLink } from './ciderpress-nav-social-links'
import { ThemeSwitcher } from './theme-switcher'
import { TopbarCTA } from './topbar-cta'

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
 * surfaces the full primary nav, theme switcher, social cluster, and
 * CTA on screens where the desktop chrome can't fit.
 *
 * @param props - Nav items / social / CTA configuration
 * @returns Hamburger button (mobile) + drawer (when open)
 */
export function CiderpressNavHamburger(props: CiderpressNavHamburgerProps): React.ReactElement {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = original
    }
  }, [open])

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
      {open ? (
        <CiderpressNavDrawer
          navItems={props.navItems}
          socialLinks={props.socialLinks}
          topbarCta={props.topbarCta}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  )
}

export { CiderpressNavHamburger as default }

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

interface DrawerProps {
  readonly navItems: readonly CiderpressNavMenuItem[]
  readonly socialLinks: readonly CiderpressSocialLink[]
  readonly topbarCta: { readonly text: string; readonly href: string } | undefined
  readonly onClose: () => void
}

/**
 * The actual sliding panel — separated so we can mount/unmount it
 * cleanly when the hamburger toggles. Backdrop click and ESC close;
 * any nav link click closes too (handled inline).
 *
 * @private
 */
function CiderpressNavDrawer(props: DrawerProps): React.ReactElement {
  return (
    <div
      className="cp-nav-drawer-root"
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
    >
      <div className="cp-nav-drawer-backdrop" onClick={props.onClose} />
      <aside className="cp-nav-drawer">
        <header className="cp-nav-drawer__header">
          <span className="cp-nav-drawer__title">Menu</span>
          <button
            type="button"
            className="cp-nav-drawer__close"
            onClick={props.onClose}
            aria-label="Close navigation menu"
          >
            <Icon icon="pixelarticons:close" width={18} height={18} />
          </button>
        </header>

        <nav className="cp-nav-drawer__nav" aria-label="Primary">
          {props.navItems.map((item) => (
            <a
              key={item.link}
              href={item.link}
              className="cp-nav-drawer__link"
              onClick={props.onClose}
            >
              {item.text}
            </a>
          ))}
        </nav>

        <div className="cp-nav-drawer__divider" />

        <div className="cp-nav-drawer__row">
          <span className="cp-nav-drawer__row-label">Theme</span>
          <ThemeSwitcher />
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
      </aside>
    </div>
  )
}
