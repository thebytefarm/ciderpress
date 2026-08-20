import { createNodeRule } from './create-node-rule.mjs'

const noClasses = createNodeRule({
  message: 'Use a factory function and closure instead of a class.',
  visitors: ['ClassDeclaration', 'ClassExpression'],
})

export default noClasses
