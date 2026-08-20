import noClasses from './no-classes.mjs'
import noDynamicFilesystemPath from './no-dynamic-filesystem-path.mjs'
import noDynamicRegExp from './no-dynamic-regexp.mjs'
import noLet from './no-let.mjs'
import noLoopStatements from './no-loop-statements.mjs'
import noThisExpressions from './no-this-expressions.mjs'
import noThrowStatements from './no-throw-statements.mjs'

/** Aggregate Ciderpress OXLint plugin. */
const plugin = {
  meta: { name: 'ciderpress' },
  rules: {
    'no-classes': noClasses,
    'no-dynamic-filesystem-path': noDynamicFilesystemPath,
    'no-dynamic-regexp': noDynamicRegExp,
    'no-let': noLet,
    'no-loop-statements': noLoopStatements,
    'no-this-expressions': noThisExpressions,
    'no-throw-statements': noThrowStatements,
  },
}

export {
  noClasses,
  noDynamicFilesystemPath,
  noDynamicRegExp,
  noLet,
  noLoopStatements,
  noThisExpressions,
  noThrowStatements,
}
export default plugin
