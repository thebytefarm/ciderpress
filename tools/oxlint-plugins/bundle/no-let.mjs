const noLet = {
    meta: {
        messages: {
            forbidden: 'Use const instead of let; model changes as new immutable values.'
        },
        type: 'problem'
    },
    create (context) {
        return {
            VariableDeclaration (node) {
                if ('let' === node.kind) context.report({
                    messageId: 'forbidden',
                    node
                });
            }
        };
    }
};
const no_let = noLet;
export default no_let;
export { no_let as noLet };
