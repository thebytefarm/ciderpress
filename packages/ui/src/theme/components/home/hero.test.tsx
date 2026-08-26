import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect, vi } from 'vitest'

import { Hero } from './hero.tsx'

// `RouteLink` pulls in Rspress's router, which resolves the `virtual-routes`
// module only inside a real build. Stand in a plain anchor so link output is
// assertable.
vi.mock('@rspress/core/runtime', async () => {
  const react = await import('react')
  return {
    Link: (props: { readonly to: string; readonly children?: React.ReactNode }) =>
      react.createElement('a', { href: props.to }, props.children),
    withBase: (v: string) => v,
  }
})

describe('Hero — background', () => {
  it('should add the modifier class when a background is configured', () => {
    const out = renderToStaticMarkup(<Hero title="Docs" background={{ src: '/hero.jpg' }} />)
    expect(out).toContain('cp-hero cp-hero--has-background')
  })

  it('should paint the image src into the CSS custom property', () => {
    const out = renderToStaticMarkup(<Hero title="Docs" background={{ src: '/hero.jpg' }} />)
    expect(out).toContain('--cp-hero-background-image:url(&quot;/hero.jpg&quot;)')
  })

  it('should use CSS defaults when sizing fields are omitted', () => {
    const out = renderToStaticMarkup(<Hero title="Docs" background={{ src: '/hero.jpg' }} />)
    expect(out).toContain('--cp-hero-background-position:center')
    expect(out).toContain('--cp-hero-background-size:cover')
    expect(out).toContain('--cp-hero-background-repeat:no-repeat')
  })

  it('should respect custom sizing fields', () => {
    const out = renderToStaticMarkup(
      <Hero title="Docs" background={{ src: '/hero.jpg', position: '50% 25%', size: 'contain' }} />
    )
    expect(out).toContain('--cp-hero-background-position:50% 25%')
    expect(out).toContain('--cp-hero-background-size:contain')
  })

  it('should not add the modifier when background is absent', () => {
    const out = renderToStaticMarkup(<Hero title="Docs" />)
    expect(out).not.toContain('cp-hero--has-background')
    expect(out).not.toContain('--cp-hero-background-image')
  })

  it('should not paint a background when src is an empty string', () => {
    const out = renderToStaticMarkup(<Hero title="Docs" background={{ src: '' }} />)
    expect(out).not.toContain('cp-hero--has-background')
  })
})
