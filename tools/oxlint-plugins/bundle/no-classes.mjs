import { createNodeRule } from "./473.mjs";
const noClasses = createNodeRule({
    message: 'Use a factory function and closure instead of a class.',
    visitors: [
        'ClassDeclaration',
        'ClassExpression'
    ]
});
const no_classes = noClasses;
export default no_classes;
export { no_classes as noClasses };
