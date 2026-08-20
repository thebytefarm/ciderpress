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
      if (pattern !== undefined && !isStaticString(pattern)) {
        context.report({ messageId: 'forbidden', node })
      }
    }
    return { CallExpression: inspect, NewExpression: inspect }
  },
}

export default noDynamicRegExp
