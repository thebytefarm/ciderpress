import { describe, it, expect } from 'vitest'

import { ciderpressPlugin } from './plugin.ts'

describe('ciderpressPlugin()', () => {
  it('should return plugin with name ciderpress', () => {
    const plugin = ciderpressPlugin()
    expect(plugin.name).toBe('ciderpress')
  })

  it('should return plugin with globalUIComponents array', () => {
    const plugin = ciderpressPlugin()
    expect(Array.isArray(plugin.globalUIComponents)).toBe(true)
  })

  it('should contain a path ending with theme-provider.tsx', () => {
    const plugin = ciderpressPlugin()
    const components = plugin.globalUIComponents as string[]
    expect(components.some((c) => c.endsWith('theme-provider.tsx'))).toBe(true)
  })
})
