import type { SeoConfig } from '@ciderpress/config'
import { Head, useFrontmatter, useLocation, usePageData, useSite } from '@rspress/core/runtime'
import { isMatching, P } from 'massaman/match'
import { isNil, isNotNil } from 'massaman/predicate'

import { resolveSeoHead } from './seo-head-resolver'

interface SeoThemeConfig {
  readonly seo?: SeoConfig
}

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

  if (isNil(siteSeo)) {
    return null
  }

  const metadata = resolveSeoHead({
    siteSeo,
    siteDescription: site.description,
    page,
    pathname,
    frontmatter,
  })

  return (
    <Head>
      {isNotNil(metadata.title) && <title>{metadata.title}</title>}
      {isNotNil(metadata.description) && <meta name="description" content={metadata.description} />}
      {isNotNil(metadata.canonical) && <link rel="canonical" href={metadata.canonical} />}
      {isNotNil(metadata.robots) && <meta name="robots" content={metadata.robots} />}
      {isMatching(P.not(false), metadata.openGraph) && (
        <meta property="og:url" content={metadata.openGraph.url} />
      )}
      {isMatching(P.not(false), metadata.openGraph) && (
        <meta property="og:title" content={metadata.openGraph.title} />
      )}
      {isMatching(P.not(false), metadata.openGraph) && (
        <meta property="og:description" content={metadata.openGraph.description} />
      )}
      {isMatching(P.not(false), metadata.openGraph) && (
        <meta property="og:type" content={metadata.openGraph.type} />
      )}
      {isMatching(P.not(false), metadata.openGraph) && isNotNil(metadata.openGraph.siteName) && (
        <meta property="og:site_name" content={metadata.openGraph.siteName} />
      )}
      {isMatching(P.not(false), metadata.openGraph) && isNotNil(metadata.openGraph.locale) && (
        <meta property="og:locale" content={metadata.openGraph.locale} />
      )}
      {isMatching(P.not(false), metadata.openGraph) && isNotNil(metadata.openGraph.image) && (
        <meta property="og:image" content={metadata.openGraph.image} />
      )}
      {isMatching(P.not(false), metadata.twitter) && (
        <meta name="twitter:card" content={metadata.twitter.card} />
      )}
      {isMatching(P.not(false), metadata.twitter) && (
        <meta name="twitter:title" content={metadata.twitter.title} />
      )}
      {isMatching(P.not(false), metadata.twitter) && (
        <meta name="twitter:description" content={metadata.twitter.description} />
      )}
      {isMatching(P.not(false), metadata.twitter) && isNotNil(metadata.twitter.site) && (
        <meta name="twitter:site" content={metadata.twitter.site} />
      )}
      {isMatching(P.not(false), metadata.twitter) && isNotNil(metadata.twitter.creator) && (
        <meta name="twitter:creator" content={metadata.twitter.creator} />
      )}
      {isMatching(P.not(false), metadata.twitter) && isNotNil(metadata.twitter.image) && (
        <meta name="twitter:image" content={metadata.twitter.image} />
      )}
    </Head>
  )
}
