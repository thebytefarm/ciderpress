import { createNodeRule } from "./473.mjs";
const noLoopStatements = createNodeRule({
    message: 'Use immutable array operations instead of loop statements.',
    visitors: [
        'DoWhileStatement',
        'ForInStatement',
        'ForOfStatement',
        'ForStatement',
        'WhileStatement'
    ]
});
const no_loop_statements = noLoopStatements;
export default no_loop_statements;
export { no_loop_statements as noLoopStatements };
