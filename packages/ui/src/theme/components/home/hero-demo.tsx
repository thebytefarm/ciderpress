import { match } from 'massaman/match'
import type React from 'react'
import { useEffect, useState } from 'react'

import './hero-demo.css'

type DemoView = 'cli' | 'docs'

const FINAL_RUN_STEP = 5
const INITIAL_RUN_DELAY = 800
const RUN_DELAYS = [1000, 1550, 2000, 2400, 3000] as const
const activity = [
  ['23:18:04', 'synced', 'docs/getting-started/introduction.md', '12ms', 3],
  ['23:18:04', 'synced', 'packages/api/docs/authentication.md', '8ms', 4],
  ['23:18:05', 'restarted', 'openapi/acme.yaml', '41ms', 4],
] as const

/**
 * Interactive hero demo showing Ciderpress turning repository Markdown into an internal docs site.
 *
 * @returns CLI and generated documentation preview
 */
export function HeroDemo(): React.ReactElement {
  const [activeView, setActiveView] = useState<DemoView>('cli')
  const [runId, setRunId] = useState(0)
  const [runStep, setRunStep] = useState(0)

  useEffect(() => {
    if (activeView === 'docs') {
      return
    }

    setRunStep(0)
    if (globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRunStep(FINAL_RUN_STEP)
      return
    }

    const runDelay = match(runId)
      .with(0, () => INITIAL_RUN_DELAY)
      .otherwise(() => 0)
    const timers = RUN_DELAYS.map((delay, index) =>
      globalThis.setTimeout(() => setRunStep(index + 1), runDelay + delay)
    )
    return function clearRunTimers(): void {
      return timers.reduce<undefined>((_, timer) => {
        globalThis.clearTimeout(timer)
        return undefined
      }, undefined)
    }
  }, [activeView, runId])

  function showCli(): void {
    setActiveView('cli')
    setRunId((current) => current + 1)
  }

  function showDocs(): void {
    setActiveView('docs')
  }

  return (
    <div className="cp-hero-demo">
      <div className="cp-window cp-window--terminal" hidden={activeView !== 'cli'}>
        <div className="cp-window__titlebar">
          <WindowDots />
          <span className="cp-window__title">ciderpress dev — ~/code/acme-platform</span>
        </div>
        <div className="cp-window__content">
          <div
            className="cp-hero-demo__terminal"
            role="log"
            aria-label="Ciderpress development server output"
            aria-live="polite"
            aria-busy={runStep < FINAL_RUN_STEP}
          >
            <span className="cp-term-line cp-term-line--command">
              <span className="cp-hero-demo__prompt" aria-hidden="true">
                $
              </span>
              <span className="cp-hero-demo__typing" data-initial-run={runId === 0} key={runId}>
                ciderpress dev
              </span>
            </span>
            <span
              className="cp-hero-demo__loading"
              data-initial-run={runId === 0}
              data-visible={runStep === 0}
              aria-hidden={runStep !== 0}
            >
              ◒ loading
            </span>
            <div
              className="cp-hero-demo__run-output"
              data-visible={runStep >= 1}
              aria-hidden={runStep < 1}
            >
              <pre className="cp-hero-demo__cli-banner" aria-label="Ciderpress">
                {'█▀▀ █ █▀▄ █▀▀ █▀█ █▀█ █▀█ █▀▀ █▀▀ █▀▀\n█▄▄ █ █▄▀ ██▄ █▀▄ █▀▀ █▀▄ ██▄ ▄▄█ ▄▄█'}
              </pre>
              <div className="cp-hero-demo__status-row">
                <span className="cp-term-text--cyan">http://localhost:6174</span>
                <span className="cp-hero-demo__status">
                  <span className="cp-term-text--yellow" data-visible={runStep < FINAL_RUN_STEP}>
                    ◒ Starting
                  </span>
                  <span className="cp-term-text--green" data-visible={runStep >= FINAL_RUN_STEP}>
                    ● Ready
                  </span>
                </span>
              </div>
            </div>
            <div
              className="cp-hero-demo__run-output"
              data-visible={runStep >= 2}
              aria-hidden={runStep < 2}
            >
              <div className="cp-hero-demo__rule" />
              <div className="cp-hero-demo__watching">
                <span className="cp-term-text--dim">watching </span>
                <span className="cp-term-text--white">docs/**/*.md</span>
                <span className="cp-term-text--dim"> across 12 workspaces</span>
              </div>
            </div>
            <div className="cp-hero-demo__activity">
              {activity.map(([time, action, file, elapsed, visibleAt], index) => (
                <div
                  className="cp-hero-demo__activity-row cp-hero-demo__run-output"
                  data-visible={runStep >= visibleAt}
                  aria-hidden={runStep < visibleAt}
                  key={file}
                >
                  <span
                    className={match(index)
                      .with(0, () => '')
                      .otherwise(() => 'cp-term-text--dim')}
                  >
                    {time}
                  </span>
                  <span
                    className={match({ action, index })
                      .with({ action: 'restarted', index: 0 }, () => 'cp-term-text--yellow')
                      .with({ action: 'restarted' }, () => 'cp-term-text--yellow cp-term-text--dim')
                      .with({ index: 0 }, () => 'cp-term-text--green')
                      .otherwise(() => 'cp-term-text--green cp-term-text--dim')}
                  >
                    {action}
                  </span>
                  <span
                    className={match(index)
                      .with(0, () => '')
                      .otherwise(() => 'cp-term-text--dim')}
                  >
                    {file}
                  </span>
                  <span className="cp-term-text--dim">{elapsed}</span>
                </div>
              ))}
            </div>
            <div
              className="cp-hero-demo__run-output"
              data-visible={runStep >= FINAL_RUN_STEP}
              aria-hidden={runStep < FINAL_RUN_STEP}
            >
              <div className="cp-hero-demo__rule" />
              <div className="cp-hero-demo__stats">
                <span>
                  <span className="cp-term-text--green">84</span>
                  <span className="cp-term-text--dim"> written · </span>
                  <span className="cp-term-text--yellow">0</span>
                  <span className="cp-term-text--dim"> skipped · </span>
                  <span className="cp-term-text--red">0</span>
                  <span className="cp-term-text--dim"> removed · 412ms</span>
                </span>
                <button className="cp-hero-demo__open" type="button" onClick={showDocs}>
                  <span className="cp-term-text--cyan">o</span>
                  <span> open docs</span>
                </button>
              </div>
            </div>
            <span className="cp-hero-demo__sr-only">
              generated navigation from repository structure
            </span>
          </div>
        </div>
      </div>

      <div className="cp-window cp-window--browser" hidden={activeView !== 'docs'}>
        <div className="cp-window__titlebar">
          <WindowDots />
          <div className="cp-browser__tab">
            <span className="cp-browser__tab-title">Acme Corp · Introduction</span>
          </div>
        </div>
        <div className="cp-browser__url-bar">
          <BrowserNav />
          <span className="cp-browser__url">docs.acme.internal/getting-started/introduction</span>
          <svg className="cp-browser__menu-icon" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.2" />
            <circle cx="8" cy="8" r="1.2" />
            <circle cx="8" cy="13" r="1.2" />
          </svg>
        </div>
        <div className="cp-window__content">
          <div className="cp-hero-demo__site">
            <header className="cp-hero-demo__site-header">
              <strong className="cp-hero-demo__site-wordmark">Acme Docs</strong>
              <div className="cp-hero-demo__search">
                Search <kbd>⌘K</kbd>
              </div>
              <nav className="cp-hero-demo__site-nav" aria-label="Generated documentation">
                <strong>Getting Started</strong>
                <span>Concepts</span>
                <span>Guides</span>
                <span>API</span>
              </nav>
            </header>
            <div className="cp-hero-demo__docs-layout">
              <aside className="cp-hero-demo__sidebar">
                <span className="cp-hero-demo__sidebar-menu">▣ Menu</span>
                <span>⌂ Home</span>
                <span>▱ Changelog</span>
                <span className="cp-hero-demo__sidebar-label">Getting started</span>
                <strong>Introduction</strong>
                <span>Quick Start</span>
                <span className="cp-hero-demo__sidebar-label">Concepts</span>
                <span>Content</span>
                <span>Navigation</span>
                <span>Publishing</span>
                <span>Themes</span>
              </aside>
              <main className="cp-hero-demo__document">
                <div className="cp-hero-demo__breadcrumb">⌂ › Getting Started › Introduction</div>
                <article>
                  <h2>Introduction</h2>
                  <div className="cp-hero-demo__document-rule" />
                  <h3>What is Acme Docs?</h3>
                  <p>
                    Acme Docs is the source of truth for building, shipping, and operating the
                    platform. Content stays beside the code that it documents.
                  </p>
                  <code>ciderpress dev</code>
                  <p>One command, working docs site.</p>
                  <h3>Why Acme Docs?</h3>
                </article>
              </main>
              <aside className="cp-hero-demo__toc">
                <strong>On this page</strong>
                <span>What is Acme Docs?</span>
                <span>Why Acme Docs?</span>
                <span>Features</span>
              </aside>
            </div>
          </div>
        </div>
      </div>

      <div className="cp-hero-demo__switcher">
        <div role="tablist" aria-label="Ciderpress preview">
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'cli'}
            className={match(activeView)
              .with('cli', () => 'is-active')
              .otherwise(() => '')}
            onClick={showCli}
          >
            CLI
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'docs'}
            className={match(activeView)
              .with('docs', () => 'is-active')
              .otherwise(() => '')}
            onClick={showDocs}
          >
            View docs
          </button>
        </div>
      </div>
      <button className="cp-hero-demo__rerun" type="button" onClick={showCli}>
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
          <path
            d="M13 8a5 5 0 1 1-1.46-3.54L13 6M13 3v3h-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        rerun
      </button>
    </div>
  )
}

/**
 * Render canonical desktop-window traffic lights.
 *
 * @private
 * @returns Decorative window controls
 */
function WindowDots(): React.ReactElement {
  return (
    <div className="cp-window__dots" aria-hidden="true">
      <span className="cp-window__dot cp-window__dot--close" />
      <span className="cp-window__dot cp-window__dot--minimize" />
      <span className="cp-window__dot cp-window__dot--maximize" />
    </div>
  )
}

/**
 * Render compact browser navigation controls.
 *
 * @private
 * @returns Decorative browser controls
 */
function BrowserNav(): React.ReactElement {
  return (
    <div className="cp-browser__nav" aria-hidden="true">
      <svg className="cp-browser__nav-icon" viewBox="0 0 16 16" fill="currentColor">
        <path d="M10.5 3 5.5 8l5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
      <svg className="cp-browser__nav-icon" viewBox="0 0 16 16" fill="currentColor">
        <path d="m5.5 3 5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
      <svg className="cp-browser__nav-icon" viewBox="0 0 16 16" fill="currentColor">
        <path
          d="M13 8A5 5 0 1 1 3 8a5 5 0 0 1 10 0Z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    </div>
  )
}
