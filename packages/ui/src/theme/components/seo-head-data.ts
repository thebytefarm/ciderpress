import type { PageSeoConfig, RobotsConfig, SeoConfig } from '@ciderpress/config'
import { isMatching, P } from 'massaman/match'
import { isBoolean, isNil, isPlainObject, isString, isUndefined } from 'massaman/predicate'

import { resolveSeoPageUrl } from '../../seo-url'

const PAGE_SEO_KEYS = [
  'title',
  'description',
  'canonical',
  'socialImage',
  'robots',
  'openGraph',
  'twitter',
] as const
const ROBOTS_KEYS = ['index', 'follow'] as const
const OPEN_GRAPH_KEYS = ['title', 'description', 'type', 'image'] as const
const TWITTER_KEYS = ['title', 'description', 'card', 'image', 'creator'] as const

/**
 * Inputs needed to resolve route-aware SEO metadata.
 */
export interface ResolveSeoHeadDataParams {
  readonly siteSeo: SeoConfig
  readonly base: string
  readonly siteDescription: string
  readonly page: {
    readonly title: string
    readonly description?: string
  }
  readonly pathname: string
  readonly frontmatter: Readonly<Record<string, unknown>>
}

/**
 * Fully resolved Open Graph metadata, or `false` when disabled.
 */
export interface ResolvedOpenGraphMetadata {
  readonly url: string
  readonly title: string
  readonly description: string
  readonly type: 'website' | 'article'
  readonly siteName?: string
  readonly locale?: string
  readonly image?: string
}

/**
 * Fully resolved Twitter card metadata, or `false` when disabled.
 */
export interface ResolvedTwitterMetadata {
  readonly card: 'summary' | 'summary_large_image'
  readonly title: string
  readonly description: string
  readonly site?: `@${string}`
  readonly creator?: `@${string}`
  readonly image?: string
}

/**
 * Route-aware metadata consumed by the SEO head renderer.
 */
export interface ResolvedSeoHeadData {
  readonly title?: string
  readonly description?: string
  readonly canonical?: string
  readonly robots?: string
  readonly openGraph: ResolvedOpenGraphMetadata | false
  readonly twitter: ResolvedTwitterMetadata | false
}

/**
 * Resolves validated site and page SEO inputs into render-ready metadata.
 *
 * Invalid Markdown `frontmatter.seo` values are ignored so unvalidated YAML
 * cannot leak malformed values into the document head.
 *
 * @param params - Site defaults, page data, route, and raw frontmatter
 * @returns Immutable metadata for the React head renderer
 */
export function resolveSeoHeadData(params: ResolveSeoHeadDataParams): ResolvedSeoHeadData {
  const pageSeo = resolvePageSeo(params.frontmatter)
  const title = pageSeo.title ?? params.page.title
  const description = pageSeo.description ?? params.page.description ?? params.siteDescription
  const socialImage = resolveSocialImage({
    origin: params.siteSeo.origin,
    siteSeo: params.siteSeo,
    pageSeo,
  })

  return {
    title: resolveDocumentTitle({ title, template: params.siteSeo.titleTemplate, pageSeo }),
    description: resolveDescription({ description, pageSeo }),
    canonical: resolveCanonical({
      origin: params.siteSeo.origin,
      base: params.base,
      pathname: params.pathname,
      pageSeo,
    }),
    robots: resolveRobots({ defaults: params.siteSeo.robots, overrides: pageSeo.robots }),
    openGraph: resolveOpenGraph({
      origin: params.siteSeo.origin,
      base: params.base,
      pathname: params.pathname,
      siteSeo: params.siteSeo,
      pageSeo,
      title,
      description,
      socialImage,
    }),
    twitter: resolveTwitter({
      origin: params.siteSeo.origin,
      siteSeo: params.siteSeo,
      pageSeo,
      title,
      description,
      socialImage,
    }),
  }
}

/**
 * Validates the nested SEO block from raw Markdown frontmatter.
 *
 * @private
 */
function resolvePageSeo(frontmatter: Readonly<Record<string, unknown>>): PageSeoConfig {
  if (!isPageSeoConfig(frontmatter.seo)) {
    return {}
  }
  return frontmatter.seo
}

/**
 * Validates the small page SEO shape without shipping Zod to the browser.
 *
 * @private
 */
function isPageSeoConfig(value: unknown): value is PageSeoConfig {
  if (!isPlainObject(value) || !hasOnlyKeys(value, PAGE_SEO_KEYS)) {
    return false
  }
  return (
    isOptionalString(value['title']) &&
    isOptionalString(value['description']) &&
    isCanonical(value['canonical']) &&
    isOptionalImageUrl(value['socialImage']) &&
    isRobotsConfig(value['robots']) &&
    isOpenGraphConfig(value['openGraph']) &&
    isTwitterConfig(value['twitter'])
  )
}

/**
 * Validates optional crawler directives.
 *
 * @private
 */
function isRobotsConfig(value: unknown): boolean {
  if (isUndefined(value)) {
    return true
  }
  if (!isPlainObject(value) || !hasOnlyKeys(value, ROBOTS_KEYS)) {
    return false
  }
  return isOptionalBoolean(value['index']) && isOptionalBoolean(value['follow'])
}

/**
 * Validates optional Open Graph overrides.
 *
 * @private
 */
function isOpenGraphConfig(value: unknown): boolean {
  if (isUndefined(value) || value === false) {
    return true
  }
  if (!isPlainObject(value) || !hasOnlyKeys(value, OPEN_GRAPH_KEYS)) {
    return false
  }
  return (
    isOptionalString(value['title']) &&
    isOptionalString(value['description']) &&
    (isUndefined(value['type']) || value['type'] === 'website' || value['type'] === 'article') &&
    isOptionalImageUrl(value['image'])
  )
}

/**
 * Validates optional Twitter card overrides.
 *
 * @private
 */
function isTwitterConfig(value: unknown): boolean {
  if (isUndefined(value) || value === false) {
    return true
  }
  if (!isPlainObject(value) || !hasOnlyKeys(value, TWITTER_KEYS)) {
    return false
  }
  return (
    isOptionalString(value['title']) &&
    isOptionalString(value['description']) &&
    (isUndefined(value['card']) ||
      value['card'] === 'summary' ||
      value['card'] === 'summary_large_image') &&
    isOptionalImageUrl(value['image']) &&
    (isUndefined(value['creator']) || isTwitterHandle(value['creator']))
  )
}

/**
 * Checks that a record contains no fields outside its supported schema.
 *
 * @private
 */
function hasOnlyKeys(
  value: Readonly<Record<PropertyKey, unknown>>,
  keys: readonly string[]
): boolean {
  return Object.keys(value).every((key) => keys.includes(key))
}

/**
 * Validates an optional string field.
 *
 * @private
 */
function isOptionalString(value: unknown): boolean {
  return isUndefined(value) || isString(value)
}

/**
 * Validates an optional boolean field.
 *
 * @private
 */
function isOptionalBoolean(value: unknown): boolean {
  return isUndefined(value) || isBoolean(value)
}

/**
 * Validates an optional canonical URL or explicit suppression.
 *
 * @private
 */
function isCanonical(value: unknown): boolean {
  return isUndefined(value) || value === false || (isString(value) && isHttpUrl(value))
}

/**
 * Validates an optional social image URL.
 *
 * @private
 */
function isOptionalImageUrl(value: unknown): boolean {
  return isUndefined(value) || (isString(value) && value.length > 0 && isHttpOrRelativeUrl(value))
}

/**
 * Checks that an account handle uses Twitter's supported username shape.
 *
 * @private
 */
function isTwitterHandle(value: string): boolean {
  return /^@[A-Za-z0-9_]{1,15}$/u.test(value)
}

/**
 * Checks that a URL is absolute and uses HTTP(S).
 *
 * @private
 */
function isHttpUrl(value: string): boolean {
  if (!URL.canParse(value)) {
    return false
  }
  const protocol = new URL(value).protocol
  return protocol === 'https:' || protocol === 'http:'
}

/**
 * Checks that an image is an HTTP(S) URL or relative URL path.
 *
 * @private
 */
function isHttpOrRelativeUrl(value: string): boolean {
  if (!URL.canParse(value, 'https://ciderpress.invalid')) {
    return false
  }
  return isHttpUrl(new URL(value, 'https://ciderpress.invalid').href)
}

/**
 * Applies the site title template only when Ciderpress must override the document title.
 *
 * @private
 */
function resolveDocumentTitle(params: {
  readonly title: string
  readonly template: string | false | undefined
  readonly pageSeo: PageSeoConfig
}): string | undefined {
  if (isNil(params.template) && isNil(params.pageSeo.title)) {
    return undefined
  }
  if (params.template === false || isNil(params.template)) {
    return params.title
  }
  return params.template.replaceAll('%s', params.title)
}

/**
 * Emits a description only when page SEO explicitly overrides the framework default.
 *
 * @private
 */
function resolveDescription(params: {
  readonly description: string
  readonly pageSeo: PageSeoConfig
}): string | undefined {
  if (isNil(params.pageSeo.description)) {
    return undefined
  }
  return params.description
}

/**
 * Resolves canonical overrides while honoring explicit suppression.
 *
 * @private
 */
function resolveCanonical(params: {
  readonly origin: string
  readonly base: string
  readonly pathname: string
  readonly pageSeo: PageSeoConfig
}): string | undefined {
  if (params.pageSeo.canonical === false) {
    return undefined
  }
  if (isMatching(P.string, params.pageSeo.canonical)) {
    return params.pageSeo.canonical
  }
  return resolveSeoPageUrl(params)
}

/**
 * Resolves the shared social image against the production origin.
 *
 * @private
 */
function resolveSocialImage(params: {
  readonly origin: string
  readonly siteSeo: SeoConfig
  readonly pageSeo: PageSeoConfig
}): string | undefined {
  const image = params.pageSeo.socialImage ?? params.siteSeo.socialImage
  if (isNil(image)) {
    return undefined
  }
  return new URL(image, params.origin).href
}

/**
 * Merges Open Graph defaults and page overrides into render-ready metadata.
 *
 * @private
 */
function resolveOpenGraph(params: {
  readonly origin: string
  readonly base: string
  readonly pathname: string
  readonly siteSeo: SeoConfig
  readonly pageSeo: PageSeoConfig
  readonly title: string
  readonly description: string
  readonly socialImage: string | undefined
}): ResolvedOpenGraphMetadata | false {
  if (params.siteSeo.openGraph === false || params.pageSeo.openGraph === false) {
    return false
  }
  const openGraph = { ...params.siteSeo.openGraph, ...params.pageSeo.openGraph }
  return {
    url: resolveSeoPageUrl(params),
    title: openGraph.title ?? params.title,
    description: openGraph.description ?? params.description,
    type: openGraph.type ?? 'website',
    siteName: openGraph.siteName,
    locale: openGraph.locale,
    image: resolveProviderImage({
      origin: params.origin,
      override: openGraph.image,
      fallback: params.socialImage,
    }),
  }
}

/**
 * Merges Twitter defaults and page overrides into render-ready metadata.
 *
 * @private
 */
function resolveTwitter(params: {
  readonly origin: string
  readonly siteSeo: SeoConfig
  readonly pageSeo: PageSeoConfig
  readonly title: string
  readonly description: string
  readonly socialImage: string | undefined
}): ResolvedTwitterMetadata | false {
  if (params.siteSeo.twitter === false || params.pageSeo.twitter === false) {
    return false
  }
  const twitter = {
    card: 'summary_large_image' as const,
    ...params.siteSeo.twitter,
    ...params.pageSeo.twitter,
  }
  return {
    card: twitter.card,
    title: twitter.title ?? params.title,
    description: twitter.description ?? params.description,
    site: twitter.site,
    creator: twitter.creator,
    image: resolveProviderImage({
      origin: params.origin,
      override: twitter.image,
      fallback: params.socialImage,
    }),
  }
}

/**
 * Applies a provider-specific image over the shared social image.
 *
 * @private
 */
function resolveProviderImage(params: {
  readonly origin: string
  readonly override: string | undefined
  readonly fallback: string | undefined
}): string | undefined {
  if (isNil(params.override)) {
    return params.fallback
  }
  return new URL(params.override, params.origin).href
}

/**
 * Converts merged crawler flags into a robots directive.
 *
 * @private
 */
function resolveRobots(params: {
  readonly defaults: RobotsConfig | undefined
  readonly overrides: RobotsConfig | undefined
}): string | undefined {
  if (isNil(params.defaults) && isNil(params.overrides)) {
    return undefined
  }
  const resolved = { index: true, follow: true, ...params.defaults, ...params.overrides }
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
