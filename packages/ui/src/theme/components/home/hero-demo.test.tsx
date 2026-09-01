// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HeroDemo } from './hero-demo.tsx'

describe('hero demo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.replaceChildren()
  })

  it('should explain the repository discovery workflow', async () => {
    expect.assertions(4)
    const rendered = await renderHeroDemo()
    const output = rendered.container.textContent
    expect(output).toContain('ciderpress dev')
    expect(output).not.toContain('pnpm')
    expect(output).toContain('docs/**/*.md')
    expect(output).toContain('generated navigation from repository structure')
    await unmountHeroDemo(rendered)
  })

  it('should switch previews through keyboard-focusable tab controls', async () => {
    expect.assertions(4)
    const rendered = await renderHeroDemo()
    const cli = getButton({ container: rendered.container, label: 'CLI' })
    const docs = getButton({ container: rendered.container, label: 'View docs' })
    docs.focus()
    expect(document.activeElement).toBe(docs)
    await click(docs)
    expect(docs.getAttribute('aria-selected')).toBe('true')
    expect(cli.getAttribute('aria-selected')).toBe('false')
    expect(getButton({ container: rendered.container, label: 'rerun' }).tabIndex).toBe(0)
    await unmountHeroDemo(rendered)
  })

  it('should include the generated Acme Corp documentation preview', async () => {
    expect.assertions(4)
    const rendered = await renderHeroDemo()
    const output = rendered.container.textContent
    expect(output).toContain('http://localhost:6174')
    expect(output).toContain('Acme Docs')
    expect(output).toContain('Getting Started')
    expect(output).toContain('On this page')
    await unmountHeroDemo(rendered)
  })

  it('should advance timed stages and reset them when rerun', async () => {
    expect.assertions(6)
    const rendered = await renderHeroDemo()
    const log = getLog(rendered.container)
    const starting = getTextElement({ container: rendered.container, text: '◒ Starting' })
    const ready = getTextElement({ container: rendered.container, text: '● Ready' })
    expect(log.getAttribute('aria-busy')).toBe('true')
    expect(starting.getAttribute('aria-hidden')).toBe('false')
    expect(ready.getAttribute('aria-hidden')).toBe('true')
    await act(() => vi.advanceTimersByTime(4_100))
    expect(log.getAttribute('aria-busy')).toBe('false')
    expect(ready.getAttribute('aria-hidden')).toBe('false')
    await click(getButton({ container: rendered.container, label: 'rerun' }))
    expect(log.getAttribute('aria-busy')).toBe('true')
    await unmountHeroDemo(rendered)
  })
})

interface RenderedHeroDemo {
  readonly container: HTMLDivElement
  readonly root: Root
}

/**
 * Render the interactive hero demo into the test document.
 *
 * @private
 * @returns Mounted component controls.
 */
async function renderHeroDemo(): Promise<RenderedHeroDemo> {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  await act(async () => root.render(<HeroDemo />))
  return { container, root }
}

/**
 * Unmount a rendered hero demo and flush effect cleanup.
 *
 * @private
 * @param rendered - Mounted component controls.
 * @returns Promise resolved after cleanup.
 */
async function unmountHeroDemo(rendered: RenderedHeroDemo): Promise<void> {
  return act(async () => rendered.root.unmount())
}

/**
 * Click a native button and flush React updates.
 *
 * @private
 * @param button - Button to activate.
 * @returns Promise resolved after event handling.
 */
async function click(button: HTMLButtonElement): Promise<void> {
  return act(async () => button.click())
}

/**
 * Find a button by its accessible text.
 *
 * @private
 * @param params - Rendered component container and visible button label.
 * @returns Matching button.
 */
function getButton(params: {
  readonly container: HTMLElement
  readonly label: string
}): HTMLButtonElement {
  const button = Array.from(params.container.querySelectorAll('button')).find(
    (candidate) => candidate.textContent.trim() === params.label
  )
  return button as HTMLButtonElement
}

/**
 * Find the live terminal output region.
 *
 * @private
 * @param container - Rendered component container.
 * @returns Terminal log element.
 */
function getLog(container: HTMLElement): HTMLElement {
  const log = container.querySelector<HTMLElement>('[role="log"]')
  return log as HTMLElement
}

/**
 * Find an element by exact text content.
 *
 * @private
 * @param params - Rendered component container and exact visible text.
 * @returns Matching element.
 */
function getTextElement(params: {
  readonly container: HTMLElement
  readonly text: string
}): HTMLElement {
  const element = Array.from(params.container.querySelectorAll<HTMLElement>('*')).find(
    (candidate) => candidate.children.length === 0 && candidate.textContent.trim() === params.text
  )
  return element as HTMLElement
}
