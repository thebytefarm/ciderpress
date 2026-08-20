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
            if (void 0 !== pattern && !isStaticString(pattern) && !isStaticRegExp(pattern) && isGlobalRegExp({
                context,
                node
            })) context.report({
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
function isStaticRegExp(node) {
    return 'Literal' === node.type && (void 0 !== node.regex || node.value instanceof RegExp);
}
function isGlobalRegExp({ context, node }) {
    const variable = findVariable(context.sourceCode.getScope(node), 'RegExp');
    return null === variable || 0 === variable.defs.length;
}
function findVariable(scope, name) {
    const variable = scope.set.get(name);
    if (void 0 !== variable) return variable;
    if (null === scope.upper) return null;
    return findVariable(scope.upper, name);
}
export default no_dynamic_regexp;
export { no_dynamic_regexp as noDynamicRegExp };
