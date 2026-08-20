import { createNodeRule } from './create-node-rule.mjs'

const noLoopStatements = createNodeRule({
  message: 'Use immutable array operations instead of loop statements.',
  visitors: [
    'DoWhileStatement',
    'ForInStatement',
    'ForOfStatement',
    'ForStatement',
    'WhileStatement',
  ],
})

export default noLoopStatements
