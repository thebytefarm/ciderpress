import { isStaticString } from "./160.mjs";
const noDynamicRegExp = {
    meta: {
        messages: {
            forbidden: 'Use a static regular expression instead of constructing one dynamically.'
        },
        type: 'problem'
    },
    create (context) {
        function inspect(node) {
            if ('Identifier' !== node.callee.type || 'RegExp' !== node.callee.name) return;
            const [pattern] = node.arguments;
            if (void 0 !== pattern && !isStaticString(pattern)) context.report({
                messageId: 'forbidden',
                node
            });
        }
        return {
            CallExpression: inspect,
            NewExpression: inspect
        };
    }
};
const no_dynamic_regexp = noDynamicRegExp;
export default no_dynamic_regexp;
export { no_dynamic_regexp as noDynamicRegExp };
