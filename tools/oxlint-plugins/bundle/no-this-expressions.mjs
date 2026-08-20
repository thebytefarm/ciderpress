import { createNodeRule } from "./473.mjs";
const noThisExpressions = createNodeRule({
    message: 'Do not use this; pass dependencies and state explicitly.',
    visitors: [
        'ThisExpression'
    ]
});
const no_this_expressions = noThisExpressions;
export default no_this_expressions;
export { no_this_expressions as noThisExpressions };
