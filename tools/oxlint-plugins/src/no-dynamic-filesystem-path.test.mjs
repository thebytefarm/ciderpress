import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import noDynamicFilesystemPath from './no-dynamic-filesystem-path.mjs'

const STATIC_PATH = { type: 'Literal', value: 'static.txt' }
const DYNAMIC_PATH = { type: 'Identifier', name: 'dynamicPath' }

describe('no-dynamic-filesystem-path', () => {
  it('should report a dynamic copy destination', () => {
    const reports = inspectNamedCall({
      method: 'copyFile',
      local: 'copyFile',
      arguments: [STATIC_PATH, DYNAMIC_PATH],
    })
    assert.equal(reports.length, 1)
  })

  it('should preserve canonical argument positions for aliased imports', () => {
    const reports = inspectNamedCall({
      method: 'rename',
      local: 'move',
      arguments: [STATIC_PATH, DYNAMIC_PATH],
    })
    assert.equal(reports.length, 1)
  })

  it('should report a dynamic symlink path on namespace imports', () => {
    const reports = inspectNamespaceCall({
      method: 'symlink',
      arguments: [STATIC_PATH, DYNAMIC_PATH],
    })
    assert.equal(reports.length, 1)
  })

  it('should report a dynamic path through a namespace promises property', () => {
    const reports = inspectNamespacePromisesCall({
      method: 'readFile',
      arguments: [DYNAMIC_PATH],
    })
    assert.equal(reports.length, 1)
  })

  it('should allow calls whose filesystem paths are static', () => {
    const reports = inspectNamedCall({
      method: 'copyFile',
      local: 'copyFile',
      arguments: [STATIC_PATH, STATIC_PATH],
    })
    assert.equal(reports.length, 0)
  })

  it('should ignore dynamic non-path arguments', () => {
    const reports = inspectNamedCall({
      method: 'writeFile',
      local: 'writeFile',
      arguments: [STATIC_PATH, DYNAMIC_PATH],
    })
    assert.equal(reports.length, 0)
  })
})

/**
 * Inspects a named filesystem import and call.
 *
 * @param {{ method: string, local: string, arguments: readonly object[] }} params
 * @returns {readonly object[]} Reported violations.
 * @private
 */
function inspectNamedCall({ method, local, arguments: args }) {
  const { reports, visitors } = createHarness()
  visitors.ImportDeclaration({
    source: { value: 'node:fs/promises' },
    specifiers: [
      {
        type: 'ImportSpecifier',
        imported: { name: method },
        local: { name: local },
      },
    ],
  })
  visitors.CallExpression({
    callee: { type: 'Identifier', name: local },
    arguments: args,
  })
  return reports
}

/**
 * Inspects a namespace filesystem import and call.
 *
 * @param {{ method: string, arguments: readonly object[] }} params
 * @returns {readonly object[]} Reported violations.
 * @private
 */
function inspectNamespaceCall({ method, arguments: args }) {
  const { reports, visitors } = createHarness()
  visitors.ImportDeclaration({
    source: { value: 'node:fs' },
    specifiers: [{ type: 'ImportNamespaceSpecifier', local: { name: 'fs' } }],
  })
  visitors.CallExpression({
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'fs' },
      property: { type: 'Identifier', name: method },
    },
    arguments: args,
  })
  return reports
}

/**
 * Inspects a filesystem call through a namespace's `promises` property.
 *
 * @param {{ method: string, arguments: readonly object[] }} params
 * @returns {readonly object[]} Reported violations.
 * @private
 */
function inspectNamespacePromisesCall({ method, arguments: args }) {
  const { reports, visitors } = createHarness()
  visitors.ImportDeclaration({
    source: { value: 'node:fs' },
    specifiers: [{ type: 'ImportNamespaceSpecifier', local: { name: 'fs' } }],
  })
  visitors.CallExpression({
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: {
        type: 'MemberExpression',
        computed: false,
        object: { type: 'Identifier', name: 'fs' },
        property: { type: 'Identifier', name: 'promises' },
      },
      property: { type: 'Identifier', name: method },
    },
    arguments: args,
  })
  return reports
}

/**
 * Creates a rule visitor harness that captures reports.
 *
 * @returns {{ reports: object[], visitors: object }} The reports and rule visitors.
 * @private
 */
function createHarness() {
  const reports = []
  const visitors = noDynamicFilesystemPath.create({
    report(value) {
      reports.push(value)
    },
  })
  return { reports, visitors }
}
