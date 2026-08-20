import { createNodeRule } from "./473.mjs";
const noThrowStatements = createNodeRule({
    message: 'Return errors as Result values instead of throwing.',
    visitors: [
        'ThrowStatement'
    ]
});
const no_throw_statements = noThrowStatements;
export default no_throw_statements;
export { no_throw_statements as noThrowStatements };
