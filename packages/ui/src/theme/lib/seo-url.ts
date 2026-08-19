/**
 * Resolves the production root URL for a base-mounted documentation site.
 *
 * @param params - Production origin and resolved Rspress base path
 * @returns Absolute URL for the deployed site root
 */
export function resolveSeoSiteUrl(params: {
  readonly origin: string
  readonly base: string
}): string {
  return new URL(params.base, params.origin).href
}

/**
 * Resolves a basename-stripped router pathname against the deployed site root.
 *
 * @param params - Production origin, resolved Rspress base, and router pathname
 * @returns Absolute production URL for the page
 */
export function resolveSeoPageUrl(params: {
  readonly origin: string
  readonly base: string
  readonly pathname: string
}): string {
  const siteUrl = resolveSeoSiteUrl(params)
  const relativePathname = params.pathname.replace(/^\/+/, '')
  return new URL(relativePathname, siteUrl).href
}
