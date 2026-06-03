import type { CiderpressSocialLink } from '../components/nav/ciderpress-nav-social-links'

/**
 * Pull social-link entries (GitHub, npm, etc) from Rspress's `site`
 * shape. Lives on `site.themeConfig.socialLinks` after Rspress
 * normalisation but isn't surfaced on the public typings.
 *
 * @param site - Rspress site data (typically the result of `useSite().site`)
 * @returns Array of social-link entries (empty array when not configured)
 */
export function readSocialLinks(site: unknown): readonly CiderpressSocialLink[] {
  const themeConfig = (site as { readonly themeConfig?: unknown }).themeConfig
  const candidate = (themeConfig as { readonly socialLinks?: unknown } | undefined)?.socialLinks
  if (!Array.isArray(candidate)) {
    return []
  }
  return candidate.filter(
    (item): item is CiderpressSocialLink =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as { icon?: unknown }).icon === 'string' &&
      typeof (item as { content?: unknown }).content === 'string'
  )
}
