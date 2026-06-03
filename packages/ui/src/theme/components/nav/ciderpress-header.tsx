import type React from 'react'

import { CiderpressLogo } from '../shared/ciderpress-logo'
import { SidebarToggle } from '../sidebar/sidebar-toggle'
import { CiderpressNavHamburger } from './ciderpress-nav-hamburger'
import { CiderpressNavMenu } from './ciderpress-nav-menu'
import type { CiderpressNavMenuItem } from './ciderpress-nav-menu'
import { CiderpressNavSearch } from './ciderpress-nav-search'
import { CiderpressNavSocialLinks } from './ciderpress-nav-social-links'
import type { CiderpressSocialLink } from './ciderpress-nav-social-links'
import { NavDivider } from './nav-divider'
import { ThemeSwitcher } from './theme-switcher'
import { TopbarCTA } from './topbar-cta'

import './ciderpress-header.css'

/**
 * Props for the ciderpress site header.
 */
export interface CiderpressHeaderProps {
  /**
   * Pre-rendered announcement bar, pinned above the nav row. Pass
   * `null` to omit.
   */
  readonly announcement: React.ReactNode
  /**
   * Primary nav menu items, fed straight into `<CiderpressNavMenu />`.
   */
  readonly navItems: readonly CiderpressNavMenuItem[]
  /**
   * Social-link entries (GitHub, npm, etc) read from `site.socialLinks`.
   */
  readonly socialLinks: readonly CiderpressSocialLink[]
  /**
   * Topbar CTA configuration. Pass `undefined` to omit.
   */
  readonly topbarCta: { readonly text: string; readonly href: string } | undefined
  /**
   * `true` on the home page — used to suppress the sidebar toggle.
   */
  readonly isHome: boolean
}

/**
 * Custom replacement for Rspress's built-in `.rp-nav`. Owns the entire
 * topbar chrome (logo, search trigger, primary menu with
 * measure-and-collapse overflow, theme switcher, social cluster, CTA)
 * using only `cp-*` class names and `cp-*` CSS custom properties so
 * theme authors can override every surface without reaching into
 * Rspress internals.
 *
 * Rspress's own `.rp-nav` is hidden by a rule in
 * `styles/overrides/rail.css` — the two never coexist visually.
 *
 * @param props - Header configuration
 * @returns Sticky header element
 */
export function CiderpressHeader(props: CiderpressHeaderProps): React.ReactElement {
  // Landing / home pages live inside a constrained max-width container;
  // doc pages stretch full-width (sidebar + article). The header mirrors
  // the content shell so it never floats outside the page rhythm.
  const variantClass = props.isHome ? 'cp-header--landing' : 'cp-header--docs'

  return (
    <header className={`cp-header ${variantClass}`}>
      {props.announcement}
      <div className="cp-header-inner">
        {/* Left: hamburger (mobile) + logo + sidebar toggle (docs only) */}
        <CiderpressNavHamburger
          navItems={props.navItems}
          socialLinks={props.socialLinks}
          topbarCta={props.topbarCta}
        />
        <a href="/" className="cp-header-logo" aria-label="Home">
          <CiderpressLogo />
        </a>
        {props.isHome ? null : <SidebarToggle />}

        {/* Right cluster wrapper. Grows from a zero basis so its width
            equals the actual available room (not the content), which is
            the stable measurement target the React overflow logic
            inside CiderpressNavMenu needs.

            Inside: search comes first, then the menu (which itself
            fills the leftover room and right-aligns items inside).
            That places search immediately before the menu items, both
            anchored to the right edge of the wrapper. */}
        <div className="cp-header-menu-wrap">
          <CiderpressNavSearch />
          <NavDivider />
          <CiderpressNavMenu items={props.navItems} />
        </div>

        <NavDivider />
        <ThemeSwitcher />
        <CiderpressNavSocialLinks links={props.socialLinks} />
        {props.topbarCta === undefined ? null : (
          <>
            <NavDivider />
            <TopbarCTA text={props.topbarCta.text} href={props.topbarCta.href} />
          </>
        )}
      </div>
    </header>
  )
}

export { CiderpressHeader as default }
