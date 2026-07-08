import { createElement as h } from 'react'
import type React from 'react'
import { describe, expect, it } from 'vitest'

import type { ParsedTable } from './advanced-table.parse'
import { parseRenderedTable, reactNodeToText } from './advanced-table.parse'

const headRow = h(
  'tr',
  null,
  h('th', null, 'Name'),
  h('th', { style: { textAlign: 'right' } }, 'Size')
)

const bodyRows = [
  h('tr', null, h('td', null, 'vite'), h('td', { style: { textAlign: 'right' } }, '10.4')),
  h('tr', null, h('td', null, 'esbuild'), h('td', { style: { textAlign: 'right' } }, '0.9')),
]

const tableChildren = [h('thead', null, headRow), h('tbody', null, ...bodyRows)]

/**
 * Parse and assert a non-null result so tests can access fields without
 * optional chaining.
 */
function parse(children: React.ReactNode): ParsedTable {
  const parsed = parseRenderedTable(children)
  expect(parsed).not.toBeNull()
  return parsed as ParsedTable
}

describe('reactNodeToText()', () => {
  it('should return plain strings unchanged', () => {
    expect(reactNodeToText('hello')).toBe('hello')
  })

  it('should flatten nested elements to their text', () => {
    expect(reactNodeToText(h('code', null, 'pnpm dev'))).toBe('pnpm dev')
  })

  it('should join array children', () => {
    expect(reactNodeToText(['a', h('strong', null, 'b'), 'c'])).toBe('abc')
  })

  it('should return an empty string for non-text nodes', () => {
    expect(reactNodeToText(null)).toBe('')
  })
})

describe('parseRenderedTable()', () => {
  it('should return null when the table has no head or body', () => {
    expect(parseRenderedTable(['plain text'])).toBeNull()
  })

  it('should parse headers from the head row', () => {
    const parsed = parse(tableChildren)
    expect(parsed.columns.map((column) => column.header)).toEqual(['Name', 'Size'])
  })

  it('should read column alignment from header cell style', () => {
    const parsed = parse(tableChildren)
    expect(parsed.columns[1]).toMatchObject({ align: 'right' })
  })

  it('should auto-detect numeric columns', () => {
    const parsed = parse(tableChildren)
    expect(parsed.columns.map((column) => column.sortType)).toEqual(['text', 'number'])
  })

  it('should extract plain-text values for every cell', () => {
    const parsed = parse(tableChildren)
    expect(parsed.rows.map((row) => row.values)).toEqual([
      ['vite', '10.4'],
      ['esbuild', '0.9'],
    ])
  })

  it('should preserve rendered cell content', () => {
    const richBody = [
      h('tr', null, h('td', null, h('code', null, 'pnpm dev'))),
      h('tr', null, h('td', null, h('code', null, 'pnpm build'))),
    ]
    const head = h('thead', null, h('tr', null, h('th', null, 'Command')))
    const parsed = parse([head, h('tbody', null, ...richBody)])
    const firstRow = parsed.rows[0] as ParsedTable['rows'][number]
    expect(firstRow).toMatchObject({ values: ['pnpm dev'] })
    expect(firstRow.cells[0]).toMatchObject({ type: 'code' })
  })
})
