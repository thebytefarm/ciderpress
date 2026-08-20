import { createNodeRule } from './create-node-rule.mjs'

/** Requires factory functions and closures instead of classes. */
const noClasses = createNodeRule({
  message: 'Use a factory function and closure instead of a class.',
  visitors: ['ClassDeclaration', 'ClassExpression'],
})

export default noClasses
