import type { CopyrightConfig, FooterConfig } from '@ciderpress/config'
import { useSite } from '@rspress/core/runtime'
import { match, P } from 'massaman/match'
import type React from 'react'

import { useCiderpress } from '../../hooks/use-ciderpress'
import { readSocialLinks } from '../../lib/read-social-links'
import { RouteLink } from '../../lib/route-link.tsx'
import { safeUrl } from '../../lib/safe-url.ts'
import { withMountBase } from '../../lib/with-mount-base.ts'
import { CiderpressNavSocialLinks } from '../nav/ciderpress-nav-social-links'
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
  const { site: rspressSite } = useSite()
  const socialLinks = readSocialLinks(rspressSite)
  const { footer: siteFooter } = site ?? {}
  const { message, copyright, socials } = ciderpressFooter ?? {}
  const { columns, tagline, brandMark } = siteFooter ?? {}

  const copyrightText = resolveCopyright(copyright, rspressSite.title)
  const shouldRenderSocials = socials === true && socialLinks.length > 0

  const hasFooterContent = message !== undefined || copyrightText !== null || shouldRenderSocials
  const hasSiteContent = columns !== undefined || tagline !== undefined
  // The footer also hosts the theme switcher when it's enabled — so a
  // config with `theme.themeSwitcher: true` but no other footer content
  // still needs the footer shell rendered.
  const hasSwitcher = __CIDERPRESS_THEME_SWITCHER__

  if (!hasFooterContent && !hasSiteContent && !hasSwitcher) {
    return null
  }

  const resolvedColumns = columns ?? []

  return (
    <footer className="cp-site-footer">
      <div className="cp-site-footer__inner">
        <div className="cp-site-footer__grid">
          <div className="cp-site-footer__brand">
            <div className="cp-site-footer__brand-mark">
              {match(brandMark)
                .with(undefined, () => (
                  // Default to the project's `/icon.svg` (auto-generated
                  // from `config.title` at sync time, or overridden by
                  // shipping a `public/icon.svg`). This was previously
                  // the hardcoded `<CiderpressMark />` apple, which
                  // leaked ciderpress branding into every footer.
                  <img
                    src={withMountBase('/icon.svg')}
                    alt=""
                    className="cp-site-footer__brand-icon"
                  />
                ))
                .otherwise((mark) => mark)}
            </div>
            {match(message)
              .with(undefined, () => null)
              .otherwise((msg) => (
                <p className="cp-site-footer__message">{msg}</p>
              ))}
            {match(shouldRenderSocials)
              .with(true, () => (
                <div className="cp-site-footer__socials">
                  <CiderpressNavSocialLinks links={socialLinks} />
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
                      <RouteLink href={href}>{link.text}</RouteLink>
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
          {match(copyrightText)
            .with(null, () => null)
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

/**
 * Resolve the `footer.copyright` config union into a string for rendering.
 *
 * Accepts the new public shape: `true` for auto-generation from the site
 * title + current year, a verbatim string, or a `CopyrightConfig` object
 * with `company` / `dba` / `year`. `undefined` returns `null` so the
 * caller can skip the render.
 *
 * @private
 * @param copyright - The footer copyright config value
 * @param siteTitle - The Rspress site title to use as fallback owner name
 * @returns The formatted copyright string, or `null` when nothing should render
 */
function resolveCopyright(
  copyright: FooterConfig['copyright'],
  siteTitle: string | undefined
): string | null {
  return match(copyright)
    .with(undefined, () => null)
    .with(true, () => formatCopyright({}, siteTitle))
    .with(P.string, (s) => s)
    .otherwise((cfg) => formatCopyright(cfg, siteTitle))
}

/**
 * Build a copyright string from a partial `CopyrightConfig`. Falls back to
 * the site title for the owner name and the current year for the date.
 *
 * @private
 * @param cfg - Copyright config object (may be empty)
 * @param siteTitle - Fallback owner name
 * @returns Formatted copyright string
 */
function formatCopyright(cfg: CopyrightConfig, siteTitle: string | undefined): string {
  const currentYear = new Date().getFullYear()
  const yearPart = match(cfg.year)
    .with(undefined, () => String(currentYear))
    .with(P.number, (n) => String(n))
    .otherwise(({ from }) => `${from}–${currentYear}`)
  const owner = cfg.dba ?? cfg.company ?? siteTitle ?? ''
  const ownerPart = match(owner.length === 0)
    .with(true, () => '')
    .otherwise(() => ` ${owner}`)
  return `© ${yearPart}${ownerPart}`
}
