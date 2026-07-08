import type React from 'react'

import { safeUrl } from '../../lib/safe-url.ts'
import { Icon } from '../shared/icon.tsx'

import './ciderpress-nav-social-links.css'

/**
 * Single social-link entry — matches the serialised `socials` shape
 * written into `themeConfig.socialLinks` by `packages/ui/src/config.ts`.
 *
 * The Rspress `mode` / `content` discriminator was killed in the
 * `rc.4` API overhaul; every link is now a plain anchor.
 */
export interface CiderpressSocialLink {
  readonly icon: string
  readonly url: string
  readonly label?: string
}

export interface CiderpressNavSocialLinksProps {
  readonly links: readonly CiderpressSocialLink[]
}

/**
 * Maps Rspress's social-link `icon` slugs to `pixel` icon ids — one pixel-art
 * glyph per {@link SocialLinkIcon} the config enum accepts, in the same
 * aesthetic as the rest of the theme. Unmapped slugs fall back to the generic
 * `pixel:link` chain glyph.
 */
const ICON_MAP: Readonly<Record<string, string>> = Object.freeze({
  github: 'pixel:github',
  npm: 'pixel:npm',
  twitter: 'pixel:twitter',
  x: 'pixel:twitter',
  discord: 'pixel:discord',
  youtube: 'pixel:youtube',
  bluesky: 'pixel:bluesky',
  mastodon: 'pixel:mastodon',
  slack: 'pixel:slack',
  linkedin: 'pixel:linkedin',
  gitlab: 'pixel:gitlab',
  instagram: 'pixel:instagram',
  facebook: 'pixel:facebook-round',
})

/**
 * Renders the configured social links as a cluster of icon buttons in
 * the topbar. Returns `null` when no links are configured.
 *
 * @param props - List of social links from `site.socials`
 * @returns Cluster of icon links, or `null`
 */
export function CiderpressNavSocialLinks(
  props: CiderpressNavSocialLinksProps
): React.ReactElement | null {
  if (props.links.length === 0) {
    return null
  }

  const safeLinks = props.links
    .map((link) => ({ link, href: safeUrl(link.url) }))
    .filter((entry): entry is { readonly link: CiderpressSocialLink; readonly href: string } => {
      if (entry.href === null) {
        return false
      }
      return entry.href.length > 0
    })

  if (safeLinks.length === 0) {
    return null
  }

  return (
    <div className="cp-nav-social">
      {safeLinks.map(({ link, href }) => (
        <a
          key={link.url}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="cp-nav-social__item"
          aria-label={link.label ?? link.icon}
        >
          <Icon icon={ICON_MAP[link.icon.toLowerCase()] ?? 'pixel:link'} width={20} height={20} />
        </a>
      ))}
    </div>
  )
}

export { CiderpressNavSocialLinks as default }
