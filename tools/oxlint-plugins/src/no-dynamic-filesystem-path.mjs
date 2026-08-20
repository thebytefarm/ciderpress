import { isStaticString } from './is-static-string.mjs'

const FILESYSTEM_MODULES = new Set(['fs', 'node:fs', 'fs/promises', 'node:fs/promises'])

const SINGLE_PATH_METHODS = [
  'access',
  'accessSync',
  'appendFile',
  'appendFileSync',
  'chmod',
  'chmodSync',
  'chown',
  'chownSync',
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
  'rm',
  'rmSync',
  'rmdir',
  'rmdirSync',
  'stat',
  'statSync',
  'statfs',
  'statfsSync',
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
]

const MULTI_PATH_METHODS = [
  'copyFile',
  'copyFileSync',
  'cp',
  'cpSync',
  'rename',
  'renameSync',
  'symlink',
  'symlinkSync',
]

const FILESYSTEM_PATH_ARGUMENTS = new Map([
  ...SINGLE_PATH_METHODS.map((method) => [method, [0]]),
  ...MULTI_PATH_METHODS.map((method) => [method, [0, 1]]),
])

/** Reports dynamic filesystem paths passed to tracked Node.js filesystem methods. */
const noDynamicFilesystemPath = {
  meta: {
    messages: {
      forbidden: 'Pass a static filesystem path or document why this dynamic path is trusted.',
    },
    type: 'problem',
  },
  create(context) {
    const namespaces = new Set()
    const methods = new Map()
    return {
      ImportDeclaration(node) {
        if (!FILESYSTEM_MODULES.has(node.source.value)) {
          return
        }
        return node.specifiers.map((specifier) => {
          if (specifier.type === 'ImportSpecifier') {
            if (FILESYSTEM_PATH_ARGUMENTS.has(specifier.imported.name)) {
              methods.set(specifier.local.name, specifier.imported.name)
            }
            return
          }
          namespaces.add(specifier.local.name)
        })
      },
      CallExpression(node) {
        const method = resolveMethod({ callee: node.callee, methods, namespaces })
        if (method === null) {
          return
        }
        const positions = FILESYSTEM_PATH_ARGUMENTS.get(method)
        if (positions !== undefined && hasDynamicPath({ arguments: node.arguments, positions })) {
          context.report({ messageId: 'forbidden', node })
        }
      },
    }
  },
}

export default noDynamicFilesystemPath

/**
 * Resolves a tracked filesystem method from a named or namespace call.
 *
 * @param {{ callee: object, methods: Map<string, string>, namespaces: Set<string> }} params
 * @returns {string | null} The canonical filesystem method name.
 * @private
 */
function resolveMethod({ callee, methods, namespaces }) {
  if (callee.type === 'Identifier') {
    return methods.get(callee.name) ?? null
  }
  if (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.object.type === 'Identifier' &&
    namespaces.has(callee.object.name) &&
    callee.property.type === 'Identifier' &&
    FILESYSTEM_PATH_ARGUMENTS.has(callee.property.name)
  ) {
    return callee.property.name
  }
  if (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.object.type === 'MemberExpression' &&
    !callee.object.computed &&
    callee.object.object.type === 'Identifier' &&
    namespaces.has(callee.object.object.name) &&
    callee.object.property.type === 'Identifier' &&
    callee.object.property.name === 'promises' &&
    callee.property.type === 'Identifier' &&
    FILESYSTEM_PATH_ARGUMENTS.has(callee.property.name)
  ) {
    return callee.property.name
  }
  return null
}

/**
 * Determines whether any filesystem-path argument is dynamic.
 *
 * @param {{ arguments: readonly object[], positions: readonly number[] }} params
 * @returns {boolean} Whether a tracked path argument is dynamic.
 * @private
 */
function hasDynamicPath({ arguments: args, positions }) {
  return positions.some((position) => {
    const argument = args[position]
    return argument !== undefined && !isStaticString(argument)
  })
}
