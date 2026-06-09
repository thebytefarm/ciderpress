import type React from 'react'

import './hero-demo.css'

/**
 * HeroDemo — default terminal-style demo block used inside Hero.
 *
 * Renders a fake macOS window with `pnpm ciderpress dev` output. Self-contained
 * so consumers can render it directly in MDX or via HomeLayout.
 *
 * @returns React element.
 */
export function HeroDemo(): React.ReactElement {
  return (
    <div className="cp-hero-demo">
      <div className="cp-hero-demo__bar">
        <span className="cp-hero-demo__dot" />
        <span className="cp-hero-demo__dot" />
        <span className="cp-hero-demo__dot" />
        <span className="cp-hero-demo__title">
          <em>~/code/acme</em> — pnpm ciderpress dev
        </span>
      </div>
      <pre className="cp-hero-demo__body">
        <span className="cp-hero-demo__prompt">$ </span>pnpm ciderpress dev
        {'\n\n'}
        <span className="cp-hero-demo__ok"> ▸</span> ciderpress 0.5 — Rspress 2.0
        {'\n'}
        <span className="cp-hero-demo__ok"> ▸</span> watching{' '}
        <span className="cp-hero-demo__file">./docs</span>,{' '}
        <span className="cp-hero-demo__file">./openapi.yaml</span>
        {'\n'}
        <span className="cp-hero-demo__ok"> ▸</span> sidebar synced from 24 files
        {'\n'}
        <span className="cp-hero-demo__info"> ▸</span> openapi spec parsed — 18 endpoints
        {'\n'}
        <span className="cp-hero-demo__ok"> ✓</span> ready on{' '}
        <span className="cp-hero-demo__file">http://localhost:4321</span> in 412ms
        {'\n\n'}
        <span className="cp-hero-demo__cmt"> ↻ docs/guides/openapi.md changed</span>
        {'\n'}
        <span className="cp-hero-demo__cmt"> ↻ rebuilt sidebar in 8ms</span>
      </pre>
    </div>
  )
}
