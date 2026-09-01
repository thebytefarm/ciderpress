import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { HomeVisualView } from './home-visual.tsx'

vi.mock('@rspress/core/theme', () => ({ CodeBlockRuntime: (): null => null }))
vi.mock('@rspress/core/runtime', () => ({ withBase: (value: string): string => value }))

describe('home visual', () => {
  it('should render terminal visuals with dedicated compact chrome', () => {
    expect.assertions(3)
    const output = renderToStaticMarkup(
      <HomeVisualView
        context="tabs"
        visual={{
          type: 'terminal',
          windowTitle: 'ciderpress dev',
          command: 'ciderpress dev',
          lines: [{ kind: 'ok', text: 'ready' }],
        }}
      />
    )
    expect(output).toContain('role="group" aria-label="Terminal output"')
    expect(output).toContain('ciderpress dev')
    expect(output).toContain('ready')
  })
})
