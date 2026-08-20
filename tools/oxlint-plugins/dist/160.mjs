function isStaticString(node) {
    return 'Literal' === node.type && 'string' == typeof node.value || 'TemplateLiteral' === node.type && 0 === node.expressions.length;
}
export { isStaticString };
