import { useFrontmatter } from '@rspress/core/runtime'
import type React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AnnouncementBar } from '../announcement/announcement-bar.tsx'
import { CiderpressHeader } from './ciderpress-header.tsx'

vi.mock('@rspress/core/runtime', async () => {
  const react = await import('react')
  return {
    Link: (props: { readonly to: string; readonly children?: React.ReactNode }) =>
      react.createElement('a', { href: props.to }, props.children),
    withBase: (value: string) => value,
    useLocation: () => ({ pathname: '/' }),
    useFrontmatter: vi.fn<() => { frontmatter: Record<string, unknown> }>(),
  }
})

// The user config alias is supplied by the site's Rspress build.
vi.mock('@ciderpress/internal/user-config', () => ({ default: {} }))

describe('CiderpressHeader — navbar width', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('__CIDERPRESS_HAS_VARIANT_TOGGLE__', false)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    { isHome: true, navbar: undefined, expected: 'landing' },
    { isHome: false, navbar: undefined, expected: 'docs' },
    { isHome: false, navbar: { width: 'container' }, expected: 'landing' },
    { isHome: true, navbar: { width: 'full' }, expected: 'docs' },
    { isHome: true, navbar: { width: 'container' }, expected: 'landing' },
    { isHome: false, navbar: { width: 'full' }, expected: 'docs' },
    { isHome: true, navbar: { width: 'invalid' }, expected: 'landing' },
    { isHome: false, navbar: { width: 'invalid' }, expected: 'docs' },
    { isHome: true, navbar: {}, expected: 'landing' },
    { isHome: false, navbar: {}, expected: 'docs' },
    { isHome: true, navbar: true, expected: 'landing' },
    { isHome: false, navbar: true, expected: 'docs' },
  ])(
    'should render $expected width for home=$isHome and navbar=$navbar',
    ({ isHome, navbar, expected }) => {
      vi.mocked(useFrontmatter).mockReturnValue({ frontmatter: { navbar } })

      const output = renderToStaticMarkup(
        <CiderpressHeader
          announcement={null}
          navItems={[]}
          socialLinks={[]}
          topbarCta={undefined}
          isHome={isHome}
        />
      )

      expect(output).toContain(`<header class="cp-header cp-header--${expected}">`)
    }
  )

  it.each([true, false])('should hide the navbar when disabled for home=%s', (isHome) => {
    vi.mocked(useFrontmatter).mockReturnValue({ frontmatter: { navbar: false } })

    const output = renderToStaticMarkup(
      <CiderpressHeader
        announcement={null}
        navItems={[]}
        socialLinks={[]}
        topbarCta={undefined}
        isHome={isHome}
      />
    )

    expect(output).toBe('<div class="cp-header cp-header--no-navbar"></div>')
  })

  it('should preserve announcements when the navbar is hidden', () => {
    vi.mocked(useFrontmatter).mockReturnValue({ frontmatter: { navbar: false } })

    const output = renderToStaticMarkup(
      <CiderpressHeader
        announcement={<AnnouncementBar persistent>New release</AnnouncementBar>}
        navItems={[]}
        socialLinks={[]}
        topbarCta={undefined}
        isHome={false}
      />
    )

    expect(output).toContain('class="cp-header cp-header--no-navbar"')
    expect(output).toContain('aria-label="Announcement"')
    expect(output).toContain('New release')
    expect(output).toContain('--cp-announcement-height: 36px')
    expect(output).not.toContain('class="cp-header-inner"')
  })
})
