import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { TrustStrip } from './trust-strip.tsx'

vi.mock('@rspress/core/runtime', () => ({ withBase: (value: string) => value }))

describe('TrustStrip', () => {
  it('should render one image for a shared logo source', () => {
    const output = renderToStaticMarkup(
      <TrustStrip names={[{ src: '/logos/acme.svg', alt: 'Acme' }]} />
    )
    expect(output).toContain('class="cp-trust__logo"')
    expect(output.match(/<img/g)).toHaveLength(1)
  })

  it('should render dark and light images for a variant logo source', () => {
    const output = renderToStaticMarkup(
      <TrustStrip
        names={[
          {
            src: { dark: '/logos/acme-dark.svg', light: '/logos/acme-light.svg' },
            alt: 'Acme',
          },
        ]}
      />
    )
    expect(output).toContain('class="cp-trust__logo cp-trust__logo--dark"')
    expect(output).toContain('src="/logos/acme-dark.svg"')
    expect(output).toContain('class="cp-trust__logo cp-trust__logo--light"')
    expect(output).toContain('src="/logos/acme-light.svg"')
  })
})
