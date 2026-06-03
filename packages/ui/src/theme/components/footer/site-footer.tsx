import { SocialLinks } from '@rspress/core/theme-original'
import { match } from 'massaman/match'
import type React from 'react'

import { useCiderpress } from '../../hooks/use-ciderpress'
import { safeUrl } from '../../lib/safe-url.ts'
import { ThemeSwitcher } from '../nav/theme-switcher'

import './site-footer.css'

declare const __CIDERPRESS_THEME_SWITCHER__: boolean

/**
 * Site-wide footer rendered at the bottom of every page.
 *
 * Brand block on the left, optional link columns on the right (from
 * `site.footer.columns`), and a full-width bottom strip with copyright +
 * tagline divided by a hairline.
 *
 * Renders `null` when neither the top-level `footer` config (Rspress-compat
 * `message` / `copyright` / `socials`) nor `site.footer` is provided, so a
 * consumer who configures neither gets no footer rather than an empty shell.
 *
 * @returns Footer element, or null when no footer config is provided.
 */
export function SiteFooter(): React.ReactElement | null {
  const { ciderpressFooter, site } = useCiderpress()
  const { footer: siteFooter } = site ?? {}
  const { message, copyright, socials } = ciderpressFooter ?? {}
  const { columns, tagline, brandMark } = siteFooter ?? {}

  const hasRspressContent = message !== undefined || copyright !== undefined || socials === true
  const hasSiteContent = columns !== undefined || tagline !== undefined
  // The footer also hosts the theme switcher when it's enabled — so a
  // config with `theme.switcher: true` but no other footer content
  // still needs the footer shell rendered.
  const hasSwitcher = __CIDERPRESS_THEME_SWITCHER__

  if (!hasRspressContent && !hasSiteContent && !hasSwitcher) {
    return null
  }

  const resolvedColumns = columns ?? []
  const resolvedBrandMark = brandMark ?? 'Z'

  return (
    <footer className="cp-site-footer">
      <div className="cp-site-footer__inner">
        <div className="cp-site-footer__grid">
          <div className="cp-site-footer__brand">
            <div className="cp-site-footer__brand-mark">{resolvedBrandMark}</div>
            {match(message)
              .with(undefined, () => null)
              .otherwise((msg) => (
                <p className="cp-site-footer__message">{msg}</p>
              ))}
            {match(socials === true)
              .with(true, () => (
                <div className="cp-site-footer__socials">
                  <SocialLinks />
                </div>
              ))
              .otherwise(() => null)}
          </div>
          {resolvedColumns.map((col) => (
            <div key={col.heading} className="cp-site-footer__col">
              <h4 className="cp-site-footer__col-title">{col.heading}</h4>
              <ul className="cp-site-footer__col-list">
                {col.links.flatMap((link) => {
                  const href = safeUrl(link.href)
                  if (href === null) {
                    return []
                  }
                  return [
                    <li key={link.text}>
                      <a href={href}>{link.text}</a>
                    </li>,
                  ]
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="cp-site-footer__bottom">
        <div className="cp-site-footer__bottom-inner">
          {match(copyright)
            .with(undefined, () => null)
            .otherwise((cr) => (
              <span className="cp-site-footer__copyright">{cr}</span>
            ))}
          <div className="cp-site-footer__bottom-end">
            {match(tagline)
              .with(undefined, () => null)
              .otherwise((tag) => (
                <span className="cp-site-footer__tagline">{tag}</span>
              ))}
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </footer>
  )
}
