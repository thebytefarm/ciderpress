import type {
  PageOpenGraphConfig,
  PageSeoConfig,
  PageTwitterConfig,
  RobotsConfig,
  SeoConfig,
} from '@ciderpress/config'
import { pageSeoConfigSchema } from '@ciderpress/config'
import { Head, useFrontmatter, useLocation, usePageData, useSite } from '@rspress/core/runtime'
import { isMatching, P } from 'massaman/match'
import { isNil, isNotNil } from 'massaman/predicate'

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

  const pageSeo = resolvePageSeo(frontmatter)
  const title = pageSeo.title ?? page.title
  const description = pageSeo.description ?? page.description ?? site.description
  const canonical = resolveCanonical({ origin: siteSeo.origin, pathname, pageSeo })
  const openGraphUrl = new URL(pathname, siteSeo.origin).href
  const socialImage = resolveSocialImage({ origin: siteSeo.origin, siteSeo, pageSeo })
  const openGraph = resolveOpenGraph({ siteSeo, pageSeo })
  const twitter = resolveTwitter({ siteSeo, pageSeo })
  const openGraphImage = resolveOpenGraphImage({ origin: siteSeo.origin, openGraph, socialImage })
  const twitterImage = resolveTwitterImage({ origin: siteSeo.origin, twitter, socialImage })
  const robots = resolveRobots(siteSeo.robots, pageSeo.robots)
  const documentTitle = resolveDocumentTitle({ title, template: siteSeo.titleTemplate })

  return (
    <Head>
      {(isNotNil(siteSeo.titleTemplate) || isNotNil(pageSeo.title)) && (
        <title>{documentTitle}</title>
      )}
      {isNotNil(pageSeo.description) && <meta name="description" content={description} />}
      {isNotNil(canonical) && <link rel="canonical" href={canonical} />}
      {isNotNil(robots) && <meta name="robots" content={robots} />}
      {openGraph !== false && <meta property="og:url" content={openGraphUrl} />}
      {openGraph !== false && <meta property="og:title" content={openGraph.title ?? title} />}
      {openGraph !== false && (
        <meta property="og:description" content={openGraph.description ?? description} />
      )}
      {openGraph !== false && <meta property="og:type" content={openGraph.type ?? 'website'} />}
      {openGraph !== false && isNotNil(openGraph.siteName) && (
        <meta property="og:site_name" content={openGraph.siteName} />
      )}
      {openGraph !== false && isNotNil(openGraph.locale) && (
        <meta property="og:locale" content={openGraph.locale} />
      )}
      {openGraph !== false && isNotNil(openGraphImage) && (
        <meta property="og:image" content={openGraphImage} />
      )}
      {twitter !== false && <meta name="twitter:card" content={twitter.card} />}
      {twitter !== false && <meta name="twitter:title" content={twitter.title ?? title} />}
      {twitter !== false && (
        <meta name="twitter:description" content={twitter.description ?? description} />
      )}
      {twitter !== false && isNotNil(twitter.site) && (
        <meta name="twitter:site" content={twitter.site} />
      )}
      {twitter !== false && isNotNil(twitter.creator) && (
        <meta name="twitter:creator" content={twitter.creator} />
      )}
      {twitter !== false && isNotNil(twitterImage) && (
        <meta name="twitter:image" content={twitterImage} />
      )}
    </Head>
  )
}

/**
 * Reads the nested SEO block from unvalidated Markdown frontmatter.
 *
 * @private
 * @param frontmatter - Current Rspress frontmatter
 * @returns The page SEO block or an empty override object
 */
function resolvePageSeo(frontmatter: Readonly<Record<string, unknown>>): PageSeoConfig {
  const result = pageSeoConfigSchema.safeParse(frontmatter.seo)
  if (!result.success) {
    return {}
  }
  return result.data
}

/**
 * Resolves the canonical URL while honoring explicit page suppression and overrides.
 *
 * @private
 * @param params - Site origin, current path, and page overrides
 * @returns An absolute canonical URL or `undefined`
 */
function resolveCanonical(params: {
  readonly origin: string
  readonly pathname: string
  readonly pageSeo: PageSeoConfig
}): string | undefined {
  if (params.pageSeo.canonical === false) {
    return undefined
  }
  if (isMatching(P.string, params.pageSeo.canonical)) {
    return params.pageSeo.canonical
  }
  return new URL(params.pathname, params.origin).href
}

/**
 * Resolves a social image to an absolute URL for external crawlers.
 *
 * @private
 * @param params - Site and page SEO configuration
 * @returns An absolute image URL or `undefined`
 */
function resolveSocialImage(params: {
  readonly origin: string
  readonly siteSeo: SeoConfig
  readonly pageSeo: PageSeoConfig
}): string | undefined {
  const image = params.pageSeo.socialImage ?? params.siteSeo.socialImage
  if (image === undefined) {
    return undefined
  }
  return new URL(image, params.origin).href
}

/**
 * Applies an Open Graph-specific image override over the shared social image.
 *
 * @private
 * @param params - Site origin, resolved Open Graph metadata, and shared image
 * @returns An absolute Open Graph image URL or `undefined`
 */
function resolveOpenGraphImage(params: {
  readonly origin: string
  readonly openGraph: PageOpenGraphConfig | false
  readonly socialImage: string | undefined
}): string | undefined {
  if (params.openGraph === false || params.openGraph.image === undefined) {
    return params.socialImage
  }
  return new URL(params.openGraph.image, params.origin).href
}

/**
 * Applies a Twitter-specific image override over the shared social image.
 *
 * @private
 * @param params - Site origin, resolved Twitter metadata, and shared image
 * @returns An absolute Twitter image URL or `undefined`
 */
function resolveTwitterImage(params: {
  readonly origin: string
  readonly twitter: PageTwitterConfig | false
  readonly socialImage: string | undefined
}): string | undefined {
  if (params.twitter === false || params.twitter.image === undefined) {
    return params.socialImage
  }
  return new URL(params.twitter.image, params.origin).href
}

/**
 * Merges site Open Graph defaults with page overrides.
 *
 * @private
 * @param params - Site and page SEO configuration
 * @returns Resolved Open Graph metadata or `false`
 */
function resolveOpenGraph(params: {
  readonly siteSeo: SeoConfig
  readonly pageSeo: PageSeoConfig
}): (PageOpenGraphConfig & { readonly siteName?: string; readonly locale?: string }) | false {
  if (params.siteSeo.openGraph === false || params.pageSeo.openGraph === false) {
    return false
  }
  return { ...params.siteSeo.openGraph, ...params.pageSeo.openGraph }
}

/**
 * Merges site Twitter defaults with page overrides.
 *
 * @private
 * @param params - Site and page SEO configuration
 * @returns Resolved Twitter metadata or `false`
 */
function resolveTwitter(params: {
  readonly siteSeo: SeoConfig
  readonly pageSeo: PageSeoConfig
}): (PageTwitterConfig & { readonly site?: `@${string}`; readonly card: string }) | false {
  if (params.siteSeo.twitter === false || params.pageSeo.twitter === false) {
    return false
  }
  return {
    card: 'summary_large_image',
    ...params.siteSeo.twitter,
    ...params.pageSeo.twitter,
  }
}

/**
 * Converts crawler flags into a robots meta-tag value.
 *
 * @private
 * @param defaults - Site crawler defaults
 * @param overrides - Page crawler overrides
 * @returns A robots directive string or `undefined` when no directives were configured
 */
function resolveRobots(
  defaults: RobotsConfig | undefined,
  overrides: RobotsConfig | undefined
): string | undefined {
  if (defaults === undefined && overrides === undefined) {
    return undefined
  }
  const resolved = { index: true, follow: true, ...defaults, ...overrides }
  const index = resolveIndexDirective(resolved.index)
  const follow = resolveFollowDirective(resolved.follow)
  return `${index}, ${follow}`
}

/**
 * Maps the index flag to its robots directive.
 *
 * @private
 */
function resolveIndexDirective(index: boolean): 'index' | 'noindex' {
  if (index) {
    return 'index'
  }
  return 'noindex'
}

/**
 * Maps the follow flag to its robots directive.
 *
 * @private
 */
function resolveFollowDirective(follow: boolean): 'follow' | 'nofollow' {
  if (follow) {
    return 'follow'
  }
  return 'nofollow'
}

/**
 * Applies the configured `%s` page-title template.
 *
 * @private
 * @param params - Resolved page title and optional template
 * @returns Final browser document title
 */
function resolveDocumentTitle(params: {
  readonly title: string
  readonly template: string | false | undefined
}): string {
  if (params.template === undefined || params.template === false) {
    return params.title
  }
  return params.template.replaceAll('%s', params.title)
}
