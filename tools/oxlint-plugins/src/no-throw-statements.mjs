import { createNodeRule } from './create-node-rule.mjs'

const noThrowStatements = createNodeRule({
  message: 'Return errors as Result values instead of throwing.',
  visitors: ['ThrowStatement'],
})

export default noThrowStatements
