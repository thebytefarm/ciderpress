import mdi from '@iconify-json/mdi/icons.json' with { type: 'json' }
import { describe, expect, it } from 'vitest'

import { shellIcons } from './shell-icons.ts'

describe('shellIcons', () => {
  it('should include only the fixed theme glyphs rather than the full collection', () => {
    expect(Object.keys(shellIcons)).toHaveLength(6)
    expect(JSON.stringify(shellIcons).length).toBeLessThan(6000)
  })

  it('should preserve upstream icon bodies and collection dimensions', () => {
    Object.entries(shellIcons).map(([id, icon]) => {
      const name = id.slice('mdi:'.length) as keyof typeof mdi.icons
      expect(icon).toStrictEqual({ ...mdi.icons[name], width: mdi.width, height: mdi.height })
    })
  })
})
