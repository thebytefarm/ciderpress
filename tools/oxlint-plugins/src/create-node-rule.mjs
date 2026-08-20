/**
 * Creates an OXLint rule that reports every visited syntax node.
 *
 * @param {{ message: string, visitors: readonly string[] }} params
 * @returns {object} An OXLint-compatible rule.
 */
export function createNodeRule({ message, visitors }) {
  return {
    meta: {
      messages: { forbidden: message },
      type: 'problem',
    },
    create(context) {
      return Object.fromEntries(
        visitors.map((visitor) => [
          visitor,
          (node) => context.report({ messageId: 'forbidden', node }),
        ])
      )
    },
  }
}
