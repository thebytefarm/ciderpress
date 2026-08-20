import { createNodeRule } from './create-node-rule.mjs'

const noThisExpressions = createNodeRule({
  message: 'Do not use this; pass dependencies and state explicitly.',
  visitors: ['ThisExpression'],
})

export default noThisExpressions
