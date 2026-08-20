/** Requires immutable variable bindings. */
const noLet = {
  meta: {
    messages: { forbidden: 'Use const instead of let; model changes as new immutable values.' },
    type: 'problem',
  },
  create(context) {
    return {
      VariableDeclaration(node) {
        if (node.kind === 'let') {
          context.report({ messageId: 'forbidden', node })
        }
      },
    }
  },
}

export default noLet
