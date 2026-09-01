import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { HeroDemo } from './hero-demo.tsx'

describe('hero demo', () => {
  it('should explain the repository discovery workflow', () => {
    expect.assertions(4)
    const output = renderToStaticMarkup(<HeroDemo />)
    expect(output).toContain('ciderpress dev')
    expect(output).not.toContain('pnpm')
    expect(output).toContain('docs/**/*.md')
    expect(output).toContain('generated navigation from repository structure')
  })

  it('should expose keyboard-operable preview controls', () => {
    expect.assertions(4)
    const output = renderToStaticMarkup(<HeroDemo />)
    expect(output).toContain('role="tablist" aria-label="Ciderpress preview"')
    expect(output).toContain('role="tab" aria-selected="true"')
    expect(output).toContain('View docs')
    expect(output).toContain('rerun')
  })

  it('should include the generated Acme Corp documentation preview', () => {
    expect.assertions(4)
    const output = renderToStaticMarkup(<HeroDemo />)
    expect(output).toContain('http://localhost:6174')
    expect(output).toContain('Acme Docs')
    expect(output).toContain('Getting Started')
    expect(output).toContain('On this page')
  })

  it('should expose each stage of the animated CLI run', () => {
    expect.assertions(7)
    const output = renderToStaticMarkup(<HeroDemo />)
    expect(output).toContain('aria-live="polite"')
    expect(output).toContain('aria-busy="true"')
    expect(output).toContain('data-initial-run="true"')
    expect(output).toContain('█▀▀ █ █▀▄ █▀▀ █▀█ █▀█ █▀█ █▀▀ █▀▀ █▀▀')
    expect(output).toContain('◒ loading')
    expect(output).toContain('◒ Starting')
    expect(output).toContain('● Ready')
  })
})
