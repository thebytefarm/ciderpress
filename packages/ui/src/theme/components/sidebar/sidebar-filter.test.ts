import type { SidebarData } from '@rspress/core'
import { describe, expect, it } from 'vitest'

import { belongsToScope, resolveScopedSidebar } from './sidebar-filter'

const gettingStarted: SidebarData[number] = {
  text: 'Getting Started',
  link: '/getting-started',
  collapsible: true,
  collapsed: true,
  items: [
    { text: 'Introduction', link: '/getting-started/introduction' },
    { text: 'Quick Start', link: '/getting-started/quick-start' },
  ],
}

const packages: SidebarData[number] = {
  text: 'Packages',
  link: '/packages',
  collapsible: true,
  collapsed: true,
  items: [
    { text: 'CLI', link: '/packages/cli' },
    { text: 'Core', link: '/packages/core' },
  ],
}

const contributing: SidebarData[number] = {
  text: 'Contributing',
  link: '/contributing',
  collapsible: true,
  collapsed: true,
  items: [
    { text: 'Guides', link: '/contributing/guides' },
    { text: 'Standards', link: '/contributing/standards' },
  ],
}

const groupWithoutLink: SidebarData[number] = {
  text: 'Nested Group',
  collapsible: true,
  collapsed: true,
  items: [{ text: 'Deep Page', link: '/packages/deep/page' }],
}

const launchpad: SidebarData[number] = {
  text: 'Launchpad',
  link: '/launchpad',
  collapsible: true,
  collapsed: true,
  items: [
    {
      text: 'Concepts',
      collapsible: true,
      collapsed: false,
      items: [{ text: 'Architecture', link: '/launchpad/concepts/architecture' }],
    },
    { text: 'Getting Started', link: '/launchpad/getting-started' },
  ],
}

const fullSidebar: SidebarData = [gettingStarted, packages, contributing]
const scopes: readonly string[] = ['/packages', '/contributing']

describe('resolveScopedSidebar()', () => {
  it('should return all items when no scopes are defined', () => {
    const result = resolveScopedSidebar(fullSidebar, '/getting-started', [])

    expect(result).toHaveLength(3)
  })

  it('should exclude standalone sections on a main page', () => {
    const result = resolveScopedSidebar(fullSidebar, '/getting-started/introduction', scopes)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ text: 'Getting Started' })
  })

  it('should flatten the matching standalone section on an exact scope path', () => {
    const result = resolveScopedSidebar(fullSidebar, '/packages', scopes)

    expect(result).toStrictEqual([
      { text: 'Packages', link: '/packages' },
      { text: 'CLI', link: '/packages/cli' },
      { text: 'Core', link: '/packages/core' },
    ])
  })

  it('should flatten the matching standalone section on a nested scope path', () => {
    const result = resolveScopedSidebar(fullSidebar, '/packages/cli', scopes)

    expect(result).toStrictEqual([
      { text: 'Packages', link: '/packages' },
      { text: 'CLI', link: '/packages/cli' },
      { text: 'Core', link: '/packages/core' },
    ])
  })

  it('should flatten contributing items on the contributing scope', () => {
    const result = resolveScopedSidebar(fullSidebar, '/contributing/guides', scopes)

    expect(result).toStrictEqual([
      { text: 'Contributing', link: '/contributing' },
      { text: 'Guides', link: '/contributing/guides' },
      { text: 'Standards', link: '/contributing/standards' },
    ])
  })

  it('should promote an island page before its preserved nested groups', () => {
    const result = resolveScopedSidebar([launchpad], '/launchpad', ['/launchpad'])

    expect(result).toStrictEqual([
      { text: 'Launchpad', link: '/launchpad' },
      {
        text: 'Concepts',
        collapsible: true,
        collapsed: false,
        items: [{ text: 'Architecture', link: '/launchpad/concepts/architecture' }],
      },
      { text: 'Getting Started', link: '/launchpad/getting-started' },
    ])
  })

  it('should not mutate the original sidebar data', () => {
    const original = [...fullSidebar]

    resolveScopedSidebar(fullSidebar, '/packages', scopes)

    expect(fullSidebar).toStrictEqual(original)
  })

  it('should not match a scope that is only a prefix of the pathname segment', () => {
    const result = resolveScopedSidebar(fullSidebar, '/packages-extra/foo', scopes)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ text: 'Getting Started' })
  })
})

describe('belongsToScope()', () => {
  it('should match an item whose link equals the scope', () => {
    expect(belongsToScope(packages, '/packages')).toBe(true)
  })

  it('should match an item whose link starts with scope/', () => {
    const item: SidebarData[number] = { text: 'CLI', link: '/packages/cli' }

    expect(belongsToScope(item, '/packages')).toBe(true)
  })

  it('should not match an item from a different scope', () => {
    expect(belongsToScope(gettingStarted, '/packages')).toBe(false)
  })

  it('should not match a partial path segment overlap', () => {
    const item: SidebarData[number] = { text: 'Extra', link: '/packages-extra' }

    expect(belongsToScope(item, '/packages')).toBe(false)
  })

  it('should match a group without a link by checking children', () => {
    expect(belongsToScope(groupWithoutLink, '/packages')).toBe(true)
  })

  it('should not match a group without a link when children belong to a different scope', () => {
    expect(belongsToScope(groupWithoutLink, '/contributing')).toBe(false)
  })

  it('should not match a divider (no link, no items)', () => {
    const divider: SidebarData[number] = { dividerType: 'solid' }

    expect(belongsToScope(divider, '/packages')).toBe(false)
  })

  it('should not match a section header (no link, no items)', () => {
    const header: SidebarData[number] = { sectionHeaderText: 'Header' }

    expect(belongsToScope(header, '/packages')).toBe(false)
  })
})
