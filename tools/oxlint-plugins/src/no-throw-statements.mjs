import { createNodeRule } from './create-node-rule.mjs'

/** Requires errors to be returned as values instead of thrown. */
const noThrowStatements = createNodeRule({
  message: 'Return errors as Result values instead of throwing.',
  visitors: ['ThrowStatement'],
})

export default noThrowStatements
