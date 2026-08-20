import { createNodeRule } from './create-node-rule.mjs'

/** Requires explicit dependencies and state instead of `this`. */
const noThisExpressions = createNodeRule({
  message: 'Do not use this; pass dependencies and state explicitly.',
  visitors: ['ThisExpression'],
})

export default noThisExpressions
