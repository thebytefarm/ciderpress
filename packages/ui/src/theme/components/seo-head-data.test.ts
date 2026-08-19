import { describe, expect, it } from 'vitest'

import type { ResolveSeoHeadDataParams } from './seo-head-data'
import { resolveSeoHeadData } from './seo-head-data'

const baseParams: ResolveSeoHeadDataParams = {
  siteSeo: { origin: 'https://docs.example.com' },
  siteDescription: 'Site description',
  page: { title: 'Authentication', description: 'Page description' },
  pathname: '/guides/authentication',
  frontmatter: {},
}

describe('resolveSeoHeadData()', () => {
  it('should resolve route metadata from site and page defaults', () => {
    expect(resolveSeoHeadData(baseParams)).toStrictEqual({
      title: undefined,
      description: undefined,
      canonical: 'https://docs.example.com/guides/authentication',
      robots: undefined,
      openGraph: {
        url: 'https://docs.example.com/guides/authentication',
        title: 'Authentication',
        description: 'Page description',
        type: 'website',
        siteName: undefined,
        locale: undefined,
        image: undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Authentication',
        description: 'Page description',
        site: undefined,
        creator: undefined,
        image: undefined,
      },
    })
  })

  it('should apply site defaults and nested page overrides', () => {
    const result = resolveSeoHeadData({
      ...baseParams,
      siteSeo: {
        origin: 'https://docs.example.com',
        titleTemplate: '%s | Acme',
        socialImage: '/social/default.png',
        openGraph: { siteName: 'Acme', locale: 'en_US' },
        twitter: { card: 'summary', site: '@acme' },
      },
      frontmatter: {
        seo: {
          title: 'API Authentication',
          description: 'Authenticate with Acme.',
          socialImage: '/social/auth.png',
          openGraph: { type: 'article', image: '/social/og.png' },
          twitter: { creator: '@author', image: '/social/twitter.png' },
        },
      },
    })

    expect(result.title).toBe('API Authentication | Acme')
    expect(result.description).toBe('Authenticate with Acme.')
    expect(result.openGraph).toStrictEqual({
      url: 'https://docs.example.com/guides/authentication',
      title: 'API Authentication',
      description: 'Authenticate with Acme.',
      type: 'article',
      siteName: 'Acme',
      locale: 'en_US',
      image: 'https://docs.example.com/social/og.png',
    })
    expect(result.twitter).toStrictEqual({
      card: 'summary',
      title: 'API Authentication',
      description: 'Authenticate with Acme.',
      site: '@acme',
      creator: '@author',
      image: 'https://docs.example.com/social/twitter.png',
    })
  })

  it('should suppress only the canonical link when canonical is false', () => {
    const result = resolveSeoHeadData({
      ...baseParams,
      frontmatter: { seo: { canonical: false } },
    })

    expect(result.canonical).toBeUndefined()
    expect(result.openGraph).toMatchObject({
      url: 'https://docs.example.com/guides/authentication',
    })
  })

  it('should honor an absolute canonical override', () => {
    const result = resolveSeoHeadData({
      ...baseParams,
      frontmatter: { seo: { canonical: 'https://canonical.example.com/auth' } },
    })

    expect(result.canonical).toBe('https://canonical.example.com/auth')
  })

  it('should disable provider metadata from site or page settings', () => {
    const siteDisabled = resolveSeoHeadData({
      ...baseParams,
      siteSeo: { origin: 'https://docs.example.com', openGraph: false },
    })
    const pageDisabled = resolveSeoHeadData({
      ...baseParams,
      frontmatter: { seo: { twitter: false } },
    })

    expect(siteDisabled.openGraph).toBe(false)
    expect(pageDisabled.twitter).toBe(false)
  })

  it('should merge page robots directives over site defaults', () => {
    const result = resolveSeoHeadData({
      ...baseParams,
      siteSeo: {
        origin: 'https://docs.example.com',
        robots: { index: true, follow: false },
      },
      frontmatter: { seo: { robots: { index: false } } },
    })

    expect(result.robots).toBe('noindex, nofollow')
  })

  it('should ignore the entire page SEO block when raw frontmatter is invalid', () => {
    const result = resolveSeoHeadData({
      ...baseParams,
      frontmatter: {
        seo: {
          title: 'Ignored title',
          robots: { index: 'false' },
        },
      },
    })

    expect(result.title).toBeUndefined()
    expect(result.robots).toBeUndefined()
    expect(result.openGraph).toMatchObject({ title: 'Authentication' })
  })

  it('should fall back from provider images to the shared social image', () => {
    const result = resolveSeoHeadData({
      ...baseParams,
      siteSeo: {
        origin: 'https://docs.example.com',
        socialImage: '/social/default.png',
      },
    })

    expect(result.openGraph).toMatchObject({
      image: 'https://docs.example.com/social/default.png',
    })
    expect(result.twitter).toMatchObject({
      image: 'https://docs.example.com/social/default.png',
    })
  })

  it('should emit an untemplated title when title templating is explicitly disabled', () => {
    const result = resolveSeoHeadData({
      ...baseParams,
      siteSeo: { origin: 'https://docs.example.com', titleTemplate: false },
    })

    expect(result.title).toBe('Authentication')
  })
})
