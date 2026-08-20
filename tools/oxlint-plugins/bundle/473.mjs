function createNodeRule({ message, visitors }) {
    return {
        meta: {
            messages: {
                forbidden: message
            },
            type: 'problem'
        },
        create (context) {
            return Object.fromEntries(visitors.map((visitor)=>[
                    visitor,
                    (node)=>context.report({
                            messageId: 'forbidden',
                            node
                        })
                ]));
        }
    };
}
export { createNodeRule };
