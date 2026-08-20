import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import noDynamicRegExp from './no-dynamic-regexp.mjs'

const DYNAMIC_PATTERN = { type: 'Identifier', name: 'pattern' }

describe('no-dynamic-regexp', () => {
  it('should report a dynamic pattern passed to the global constructor', () => {
    const reports = inspect({ pattern: DYNAMIC_PATTERN, variable: null })
    assert.equal(reports.length, 1)
  })

  it('should allow a shadowed RegExp parameter', () => {
    const reports = inspect({ pattern: DYNAMIC_PATTERN, variable: { defs: [{}] } })
    assert.equal(reports.length, 0)
  })

  it('should allow a configured global RegExp binding', () => {
    const reports = inspect({ pattern: DYNAMIC_PATTERN, variable: { defs: [] } })
    assert.equal(reports.length, 1)
  })

  it('should allow a regular-expression literal', () => {
    const reports = inspect({
      pattern: { type: 'Literal', value: /fixed/, regex: { pattern: 'fixed', flags: '' } },
      variable: null,
    })
    assert.equal(reports.length, 0)
  })
})

/**
 * Inspects a RegExp call with a controlled lexical binding.
 *
 * @param {{ pattern: object, variable: object | null }} params
 * @returns {readonly object[]} Reported violations.
 * @private
 */
function inspect({ pattern, variable }) {
  const reports = []
  const set = new Map()
  if (variable !== null) {
    set.set('RegExp', variable)
  }
  const visitors = noDynamicRegExp.create({
    report(value) {
      reports.push(value)
    },
    sourceCode: {
      getScope() {
        return { set, upper: null }
      },
    },
  })
  visitors.CallExpression({
    callee: { type: 'Identifier', name: 'RegExp' },
    arguments: [pattern],
  })
  return reports
}
