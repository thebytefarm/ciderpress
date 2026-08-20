import { isStaticString } from './is-static-string.mjs'

/** Requires regular-expression patterns to be statically defined. */
const noDynamicRegExp = {
  meta: {
    messages: {
      forbidden: 'Use a static regular expression instead of constructing one dynamically.',
    },
    type: 'problem',
  },
  create(context) {
    function inspect(node) {
      if (node.callee.type !== 'Identifier' || node.callee.name !== 'RegExp') {
        return
      }
      const [pattern] = node.arguments
      if (
        pattern !== undefined &&
        !isStaticString(pattern) &&
        !isStaticRegExp(pattern) &&
        isGlobalRegExp({ context, node })
      ) {
        context.report({ messageId: 'forbidden', node })
      }
    }
    return { CallExpression: inspect, NewExpression: inspect }
  },
}

export default noDynamicRegExp

/**
 * Determines whether an AST node represents a regular-expression literal.
 *
 * @param {object} node An ESTree-compatible syntax node.
 * @returns {boolean} Whether the node is a static regular expression.
 * @private
 */
function isStaticRegExp(node) {
  return node.type === 'Literal' && (node.regex !== undefined || node.value instanceof RegExp)
}

/**
 * Determines whether a `RegExp` call resolves to the global constructor.
 *
 * @param {{ context: object, node: object }} params
 * @returns {boolean} Whether the identifier is global or an implicit built-in.
 * @private
 */
function isGlobalRegExp({ context, node }) {
  const variable = findVariable(context.sourceCode.getScope(node), 'RegExp')
  return variable === null || variable.defs.length === 0
}

/**
 * Finds a variable in the current or enclosing lexical scope.
 *
 * @param {object} scope An ESLint-compatible scope.
 * @param {string} name The identifier to resolve.
 * @returns {object | null} The resolved variable.
 * @private
 */
function findVariable(scope, name) {
  const variable = scope.set.get(name)
  if (variable !== undefined) {
    return variable
  }
  if (scope.upper === null) {
    return null
  }
  return findVariable(scope.upper, name)
}
