/**
 * Determines whether an AST node contains a string with no runtime interpolation.
 *
 * @param {object} node An ESTree-compatible syntax node.
 * @returns {boolean} Whether the node is a static string.
 */
export function isStaticString(node) {
  return (
    (node.type === 'Literal' && typeof node.value === 'string') ||
    (node.type === 'TemplateLiteral' && node.expressions.length === 0)
  )
}
