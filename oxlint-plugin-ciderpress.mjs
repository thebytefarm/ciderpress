const FILESYSTEM_MODULES = new Set(['fs', 'node:fs', 'fs/promises', 'node:fs/promises'])

const FILESYSTEM_METHODS = new Set([
  'access',
  'accessSync',
  'appendFile',
  'appendFileSync',
  'chmod',
  'chmodSync',
  'chown',
  'chownSync',
  'copyFile',
  'copyFileSync',
  'cp',
  'cpSync',
  'createReadStream',
  'createWriteStream',
  'exists',
  'existsSync',
  'lstat',
  'lstatSync',
  'mkdir',
  'mkdirSync',
  'mkdtemp',
  'mkdtempSync',
  'open',
  'openSync',
  'opendir',
  'opendirSync',
  'readFile',
  'readFileSync',
  'readdir',
  'readdirSync',
  'readlink',
  'readlinkSync',
  'realpath',
  'realpathSync',
  'rename',
  'renameSync',
  'rm',
  'rmSync',
  'rmdir',
  'rmdirSync',
  'stat',
  'statSync',
  'statfs',
  'statfsSync',
  'symlink',
  'symlinkSync',
  'truncate',
  'truncateSync',
  'unlink',
  'unlinkSync',
  'utimes',
  'utimesSync',
  'watch',
  'watchFile',
  'writeFile',
  'writeFileSync',
])

function createRule({ message, visitors }) {
  return {
    meta: {
      messages: { forbidden: message },
      type: 'problem',
    },
    create(context) {
      return Object.fromEntries(
        visitors.map((visitor) => [
          visitor,
          (node) => context.report({ messageId: 'forbidden', node }),
        ])
      )
    },
  }
}

function isStaticString(node) {
  return (
    (node.type === 'Literal' && typeof node.value === 'string') ||
    (node.type === 'TemplateLiteral' && node.expressions.length === 0)
  )
}

const noLet = {
  meta: {
    messages: { forbidden: 'Use const instead of let; model changes as new immutable values.' },
    type: 'problem',
  },
  create(context) {
    return {
      VariableDeclaration(node) {
        if (node.kind === 'let') {
          context.report({ messageId: 'forbidden', node })
        }
      },
    }
  },
}

const noClasses = createRule({
  message: 'Use a factory function and closure instead of a class.',
  visitors: ['ClassDeclaration', 'ClassExpression'],
})

const noThisExpressions = createRule({
  message: 'Do not use this; pass dependencies and state explicitly.',
  visitors: ['ThisExpression'],
})

const noThrowStatements = createRule({
  message: 'Return errors as Result values instead of throwing.',
  visitors: ['ThrowStatement'],
})

const noLoopStatements = createRule({
  message: 'Use immutable array operations instead of loop statements.',
  visitors: [
    'DoWhileStatement',
    'ForInStatement',
    'ForOfStatement',
    'ForStatement',
    'WhileStatement',
  ],
})

const noDynamicRegExp = {
  meta: {
    messages: {
      forbidden: 'Use a static regular expression instead of constructing one dynamically.',
    },
    type: 'problem',
  },
  create(context) {
    function inspect(node) {
      if (node.callee.type !== 'Identifier' || node.callee.name !== 'RegExp') {
        return
      }
      const [pattern] = node.arguments
      if (pattern !== undefined && !isStaticString(pattern)) {
        context.report({ messageId: 'forbidden', node })
      }
    }
    return { CallExpression: inspect, NewExpression: inspect }
  },
}

const noDynamicFilesystemPath = {
  meta: {
    messages: {
      forbidden: 'Pass a static filesystem path or document why this dynamic path is trusted.',
    },
    type: 'problem',
  },
  create(context) {
    const namespaces = new Set()
    const methods = new Set()
    return {
      ImportDeclaration(node) {
        if (!FILESYSTEM_MODULES.has(node.source.value)) {
          return
        }
        return node.specifiers.map((specifier) => {
          if (specifier.type === 'ImportSpecifier') {
            if (FILESYSTEM_METHODS.has(specifier.imported.name)) {
              methods.add(specifier.local.name)
            }
            return
          }
          namespaces.add(specifier.local.name)
        })
      },
      CallExpression(node) {
        const [path] = node.arguments
        if (path === undefined || isStaticString(path)) {
          return
        }
        const isNamedMethod = node.callee.type === 'Identifier' && methods.has(node.callee.name)
        const isNamespaceMethod =
          node.callee.type === 'MemberExpression' &&
          !node.callee.computed &&
          node.callee.object.type === 'Identifier' &&
          namespaces.has(node.callee.object.name) &&
          node.callee.property.type === 'Identifier' &&
          FILESYSTEM_METHODS.has(node.callee.property.name)
        if (isNamedMethod || isNamespaceMethod) {
          context.report({ messageId: 'forbidden', node })
        }
      },
    }
  },
}

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

export default plugin
