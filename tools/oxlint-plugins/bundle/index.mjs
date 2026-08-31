import { noClasses as no_classes } from "./no-classes.mjs";
import { noDynamicFilesystemPath as no_dynamic_filesystem_path } from "./no-dynamic-filesystem-path.mjs";
import { noLoopStatements as no_loop_statements } from "./no-loop-statements.mjs";
import { noThisExpressions as no_this_expressions } from "./no-this-expressions.mjs";
import { noThrowStatements as no_throw_statements } from "./no-throw-statements.mjs";
import { noDynamicRegExp as no_dynamic_regexp } from "./no-dynamic-regexp.mjs";
import { noLet as no_let } from "./no-let.mjs";
const src_plugin = {
    meta: {
        name: 'ciderpress'
    },
    rules: {
        'no-classes': no_classes,
        'no-dynamic-filesystem-path': no_dynamic_filesystem_path,
        'no-dynamic-regexp': no_dynamic_regexp,
        'no-let': no_let,
        'no-loop-statements': no_loop_statements,
        'no-this-expressions': no_this_expressions,
        'no-throw-statements': no_throw_statements
    }
};
const src = src_plugin;
export { noClasses } from "./no-classes.mjs";
export { noDynamicFilesystemPath } from "./no-dynamic-filesystem-path.mjs";
export { noDynamicRegExp } from "./no-dynamic-regexp.mjs";
export { noLet } from "./no-let.mjs";
export { noLoopStatements } from "./no-loop-statements.mjs";
export { noThisExpressions } from "./no-this-expressions.mjs";
export { noThrowStatements } from "./no-throw-statements.mjs";
export default src;
