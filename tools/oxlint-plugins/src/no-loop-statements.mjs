import { createNodeRule } from './create-node-rule.mjs'

/** Requires immutable collection operations instead of loop statements. */
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
