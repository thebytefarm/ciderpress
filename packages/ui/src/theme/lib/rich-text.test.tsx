import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect, vi } from 'vitest'

import { hasAccentMarker, renderRichText, toPlainText } from './rich-text.tsx'

// `RouteLink` pulls in Rspress's router, which resolves the
// `virtual-routes` module only inside a real build. Stand in a plain
// anchor so link output is assertable.
vi.mock('@rspress/core/runtime', async () => {
  const react = await import('react')
  return {
    Link: (props: { readonly to: string; readonly children?: React.ReactNode }) =>
      react.createElement('a', { href: props.to }, props.children),
  }
})

/**
 * Render copy to static markup for assertions.
 *
 * @private
 * @param text - Raw copy to render
 * @returns Rendered HTML string
 */
function html(text: string): string {
  return renderToStaticMarkup(<>{renderRichText(text)}</>)
}

describe('renderRichText()', () => {
  it('should render plain copy unchanged', () => {
    expect(html('Beautiful docs')).toBe('Beautiful docs')
  })

  it('should render emphasis markers as a branded strong', () => {
    expect(html('Ship **fast**')).toContain('<strong class="cp-accent">fast</strong>')
  })

  it('should render html strong as plain bold, without the accent', () => {
    const out = html('Ship <strong>fast</strong>')
    expect(out).toContain('<strong>fast</strong>')
    expect(out).not.toContain('cp-accent')
  })

  it('should render italic markers as em', () => {
    expect(html('Ship *fast*')).toContain('<em>fast</em>')
  })

  it('should accent only the marked words', () => {
    const out = html('Docs, **Zero Effort**')
    expect(out).toContain('Docs, ')
    expect(out).toContain('<strong class="cp-accent">Zero Effort</strong>')
  })

  it('should render highlight markers as a tinted mark', () => {
    expect(html('Now with ==OpenAPI==')).toContain('<mark class="cp-mark">OpenAPI</mark>')
  })

  it('should keep highlight and accent distinct', () => {
    const out = html('**accent** and ==highlight==')
    expect(out).toContain('<strong class="cp-accent">accent</strong>')
    expect(out).toContain('<mark class="cp-mark">highlight</mark>')
  })

  it('should render code spans literally', () => {
    expect(html('Run `ciderpress dev`')).toContain('<code>ciderpress dev</code>')
  })

  it('should not parse markers inside a code span', () => {
    expect(html('`**not accented**`')).toContain('<code>**not accented**</code>')
  })

  it('should render an external markdown link as an anchor', () => {
    const out = html('See [the site](https://example.com)')
    expect(out).toContain('href="https://example.com"')
    expect(out).toContain('the site')
  })

  it('should render an internal markdown link', () => {
    expect(html('See [the guide](/guides)')).toContain('href="/guides"')
  })

  it('should render a whitelisted anchor tag', () => {
    expect(html('<a href="/guides">docs</a>')).toContain('href="/guides"')
  })

  it('should drop an anchor tag with an unsafe scheme but keep its text', () => {
    const out = html('<a href="javascript:alert(1)">click</a>')
    expect(out).not.toContain('javascript')
    expect(out).toContain('click')
  })

  it('should drop a markdown link with an unsafe scheme but keep its text', () => {
    const out = html('[click](javascript:alert(1))')
    expect(out).not.toContain('javascript')
    expect(out).not.toContain('<a')
    expect(out).toContain('click')
  })

  it('should keep the class attribute on a whitelisted tag', () => {
    expect(html('<span class="x">hi</span>')).toContain('<span class="x">hi</span>')
  })

  it('should drop event handler attributes', () => {
    const out = html('<span onclick="alert(1)">hi</span>')
    expect(out).not.toContain('onclick')
    expect(out).toContain('hi')
  })

  it('should drop script tags and their contents', () => {
    const out = html('safe<script>alert(1)</script>after')
    expect(out).not.toContain('alert')
    expect(out).toContain('safe')
    expect(out).toContain('after')
  })

  it('should drop an unterminated script tag and everything after it', () => {
    const out = html('safe<script>alert(1)')
    expect(out).not.toContain('alert')
    expect(out).toContain('safe')
  })

  it('should unwrap unknown tags but keep their text', () => {
    const out = html('<div>kept</div>')
    expect(out).not.toContain('<div>')
    expect(out).toContain('kept')
  })

  it('should drop an img tag but keep surrounding copy', () => {
    const out = html('<img src="x" onerror="alert(1)">shown')
    expect(out).not.toContain('onerror')
    expect(out).not.toContain('<img')
    expect(out).toContain('shown')
  })

  it('should render br as a line break', () => {
    expect(html('a<br>b')).toContain('<br/>')
  })

  it('should render a self-closed br', () => {
    expect(html('a<br />b')).toContain('<br/>')
  })

  it('should render a self-closed whitelisted tag as empty', () => {
    expect(html('a<span class="x" />b')).toContain('<span class="x"></span>')
  })

  it('should keep attributes on a tag with extra whitespace', () => {
    expect(html('<span   class="x"   >hi</span>')).toContain('<span class="x">hi</span>')
  })

  it('should nest markup inside an accent', () => {
    expect(html('**Zero `dev` Effort**')).toContain('<code>dev</code>')
  })

  it('should leave a stray closing tag out of the output', () => {
    const out = html('text</span>')
    expect(out).not.toContain('</span>')
    expect(out).toContain('text')
  })

  it('should return null for empty copy', () => {
    expect(renderRichText('')).toBeNull()
  })
})

describe('toPlainText()', () => {
  it('should strip accent markers', () => {
    expect(toPlainText('Docs, **Zero Effort**')).toBe('Docs, Zero Effort')
  })

  it('should strip highlight markers', () => {
    expect(toPlainText('Now with ==OpenAPI== support')).toBe('Now with OpenAPI support')
  })

  it('should strip emphasis and italic markers', () => {
    expect(toPlainText('Ship **fast** and *typed*')).toBe('Ship fast and typed')
  })

  it('should keep code span contents', () => {
    expect(toPlainText('Run `ciderpress dev`')).toBe('Run ciderpress dev')
  })

  it('should reduce a link to its label', () => {
    expect(toPlainText('See [the guide](/guides)')).toBe('See the guide')
  })

  it('should strip html tags but keep their text', () => {
    expect(toPlainText('Ship <strong>fast</strong>')).toBe('Ship fast')
  })

  it('should drop script contents', () => {
    expect(toPlainText('safe<script>alert(1)</script>')).toBe('safe')
  })

  it('should return an empty string for empty copy', () => {
    expect(toPlainText('')).toBe('')
  })
})

describe('hasAccentMarker()', () => {
  it('should detect an accent marker', () => {
    expect(hasAccentMarker('Docs, **Zero Effort**')).toBe(true)
  })

  it('should return false without a marker', () => {
    expect(hasAccentMarker('Docs, Zero Effort')).toBe(false)
  })

  it('should return false for a lone marker', () => {
    expect(hasAccentMarker('a ** b')).toBe(false)
  })

  it('should not treat html strong as an explicit accent', () => {
    expect(hasAccentMarker('Docs, <strong>Zero Effort</strong>')).toBe(false)
  })

  it('should not treat a highlight marker as an accent', () => {
    expect(hasAccentMarker('Docs, ==Zero Effort==')).toBe(false)
  })
})
