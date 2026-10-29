// @vitest-environment happy-dom

import { addCollection } from '@iconify/react'
import type { IconProps } from '@iconify/react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Icon } from './icon.tsx'

vi.mock('@iconify/react', () => ({
  Icon: (props: IconProps) => <span data-icon={JSON.stringify(props.icon)} />,
  addCollection: vi.fn<typeof addCollection>(),
}))
vi.mock('@iconify-json/mdi/icons.json', () => ({ default: { prefix: 'mdi', icons: {} } }))

const GLYPH = { body: '<path d="M0 0h24v24H0z"/>', width: 24, height: 24 }

describe('Icon', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    vi.stubGlobal('__CIDERPRESS_SHELL_ICONS__', { 'mdi:weather-sunny': GLYPH })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should render fixed shell glyphs without registering the full icon collection', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => root.render(<Icon icon="mdi:weather-sunny" />))

    expect(
      [...container.querySelectorAll('span')].map((node) => node.getAttribute('data-icon'))
    ).toStrictEqual([JSON.stringify(GLYPH)])
    expect(addCollection).not.toHaveBeenCalled()
    await act(async () => root.unmount())
  })

  it('should retain collection loading for custom icons outside the shell subset', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => root.render(<Icon icon="mdi:account" />))
    await act(async () => vi.dynamicImportSettled())

    expect(addCollection).toHaveBeenCalledWith({ prefix: 'mdi', icons: {} })
    expect(
      [...container.querySelectorAll('span')].map((node) => node.getAttribute('data-icon'))
    ).toStrictEqual([JSON.stringify('mdi:account')])
    await act(async () => root.unmount())
  })
})
