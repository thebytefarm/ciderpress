import type { BadgeRule } from '@ciderpress/config'
import { describe, it, expect } from 'vitest'

import { applyBadges } from './badges'
import type { BadgeContext } from './badges'
import type { ResolvedEntry } from './types'

const RULES: readonly BadgeRule[] = [
  { match: '/framework/templates', badge: { text: 'GRP', variant: 'warning' } },
  { match: '/framework/scaling', badge: { text: 'LEAF', variant: 'info' } },
]

function ctx(overrides: Partial<BadgeContext> = {}): BadgeContext {
  return { rules: RULES, registry: [], groupBadges: false, ...overrides }
}

function leaf(overrides: Partial<ResolvedEntry> = {}): ResolvedEntry {
  return { title: 'Scaling', link: '/framework/scaling', ...overrides }
}

function collapsibleDoc(overrides: Partial<ResolvedEntry> = {}): ResolvedEntry {
  return {
    title: 'Templates',
    link: '/framework/templates',
    items: [{ title: 'Concept', link: '/framework/templates/concept' }],
    ...overrides,
  }
}

describe('applyBadges()', () => {
  it('should stamp a leaf page badge on both the sidebar tag and the badge map', async () => {
    const result = await applyBadges([leaf()], ctx())
    expect(result.tree[0].badgeTag).toContain('LEAF')
    expect(result.badgeMap['/framework/scaling']).toEqual([{ text: 'LEAF', variant: 'info' }])
  })

  it('should suppress a collapsible-doc group badge on every surface by default', async () => {
    const result = await applyBadges([collapsibleDoc()], ctx({ groupBadges: false }))
    expect(result.tree[0].badgeTag).toBeUndefined()
    expect(result.badgeMap['/framework/templates']).toBeUndefined()
  })

  it('should surface a collapsible-doc group badge everywhere when groupBadges is enabled', async () => {
    const result = await applyBadges([collapsibleDoc()], ctx({ groupBadges: true }))
    expect(result.tree[0].badgeTag).toContain('GRP')
    expect(result.badgeMap['/framework/templates']).toEqual([{ text: 'GRP', variant: 'warning' }])
  })

  it('should keep a leaf child badge inside a suppressed group', async () => {
    const group = collapsibleDoc({
      items: [{ title: 'Scaling', link: '/framework/scaling' }],
    })
    const result = await applyBadges([group], ctx({ groupBadges: false }))
    expect(result.badgeMap['/framework/templates']).toBeUndefined()
    expect(result.badgeMap['/framework/scaling']).toEqual([{ text: 'LEAF', variant: 'info' }])
  })
})
