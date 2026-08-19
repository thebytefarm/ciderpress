import { Head, useFrontmatter, useLocation, usePageData, useSite } from '@rspress/core/runtime'
import { match } from 'massaman/match'
import { isNil, isNotNil } from 'massaman/predicate'

import type { SeoThemeConfig } from '../../seo-theme-config'
import type { ResolvedSeoHeadData } from './seo-head-data'
import { resolveSeoHeadData } from './seo-head-data'

type SeoMetaEntry = readonly ['name' | 'property', string, string | undefined]
type ResolvedSeoMetaEntry = readonly ['name' | 'property', string, string]

/**
 * Adds canonical, robots, Open Graph, and Twitter metadata on top of Rspress defaults.
 *
 * @returns Route-aware metadata for the current page, or `null` when SEO is not configured
 */
export default function SeoHead(): React.ReactElement | null {
  const { site } = useSite()
  const { page } = usePageData()
  const { frontmatter } = useFrontmatter()
  const { pathname } = useLocation()
  const themeConfig = site.themeConfig as SeoThemeConfig
  const siteSeo = themeConfig.seo
  const seoBase = themeConfig.seoBase

  if (isNil(siteSeo) || isNil(seoBase)) {
    return null
  }

  const metadata = resolveSeoHeadData({
    siteSeo,
    base: seoBase,
    siteDescription: site.description,
    page,
    pathname,
    frontmatter,
  })
  const metaTags = resolveMetaTags(metadata)

  return (
    <Head>
      {isNotNil(metadata.title) && <title>{metadata.title}</title>}
      {isNotNil(metadata.canonical) && <link rel="canonical" href={metadata.canonical} />}
      {metaTags.map(renderMetaTag)}
    </Head>
  )
}

/**
 * Converts resolved SEO data into typed HTML meta-tag attributes.
 *
 * @private
 */
function resolveMetaTags(metadata: ResolvedSeoHeadData): readonly ResolvedSeoMetaEntry[] {
  const entries: readonly SeoMetaEntry[] = [
    ['name', 'description', metadata.description],
    ['name', 'robots', metadata.robots],
    ...match(metadata.openGraph)
      .with(false, () => [])
      .otherwise((openGraph): readonly SeoMetaEntry[] => [
        ['property', 'og:url', openGraph.url],
        ['property', 'og:title', openGraph.title],
        ['property', 'og:description', openGraph.description],
        ['property', 'og:type', openGraph.type],
        ['property', 'og:site_name', openGraph.siteName],
        ['property', 'og:locale', openGraph.locale],
        ['property', 'og:image', openGraph.image],
      ]),
    ...match(metadata.twitter)
      .with(false, () => [])
      .otherwise((twitter): readonly SeoMetaEntry[] => [
        ['name', 'twitter:card', twitter.card],
        ['name', 'twitter:title', twitter.title],
        ['name', 'twitter:description', twitter.description],
        ['name', 'twitter:site', twitter.site],
        ['name', 'twitter:creator', twitter.creator],
        ['name', 'twitter:image', twitter.image],
      ]),
  ]
  return entries.filter(isResolvedMetaEntry)
}

/**
 * Narrows a meta entry after missing content is filtered out.
 *
 * @private
 */
function isResolvedMetaEntry(entry: SeoMetaEntry): entry is ResolvedSeoMetaEntry {
  return isNotNil(entry[2])
}

/**
 * Renders one typed meta-tag descriptor.
 *
 * @private
 */
function renderMetaTag([attribute, key, content]: ResolvedSeoMetaEntry): React.ReactElement {
  return match(attribute)
    .with('name', () => <meta key={key} name={key} content={content} />)
    .with('property', () => <meta key={key} property={key} content={content} />)
    .exhaustive()
}
