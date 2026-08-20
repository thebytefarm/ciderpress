import { isStaticString } from "./160.mjs";
const FILESYSTEM_MODULES = new Set([
    'fs',
    'node:fs',
    'fs/promises',
    'node:fs/promises'
]);
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
    'writeFileSync'
];
const MULTI_PATH_METHODS = [
    'copyFile',
    'copyFileSync',
    'cp',
    'cpSync',
    'rename',
    'renameSync',
    'symlink',
    'symlinkSync'
];
const FILESYSTEM_PATH_ARGUMENTS = new Map([
    ...SINGLE_PATH_METHODS.map((method)=>[
            method,
            [
                0
            ]
        ]),
    ...MULTI_PATH_METHODS.map((method)=>[
            method,
            [
                0,
                1
            ]
        ])
]);
const noDynamicFilesystemPath = {
    meta: {
        messages: {
            forbidden: 'Pass a static filesystem path or document why this dynamic path is trusted.'
        },
        type: 'problem'
    },
    create (context) {
        const namespaces = new Set();
        const methods = new Map();
        return {
            ImportDeclaration (node) {
                if (!FILESYSTEM_MODULES.has(node.source.value)) return;
                return node.specifiers.map((specifier)=>{
                    if ('ImportSpecifier' === specifier.type) {
                        if (FILESYSTEM_PATH_ARGUMENTS.has(specifier.imported.name)) methods.set(specifier.local.name, specifier.imported.name);
                        return;
                    }
                    namespaces.add(specifier.local.name);
                });
            },
            CallExpression (node) {
                const method = resolveMethod({
                    callee: node.callee,
                    methods,
                    namespaces
                });
                if (null === method) return;
                const positions = FILESYSTEM_PATH_ARGUMENTS.get(method);
                if (void 0 !== positions && hasDynamicPath({
                    arguments: node.arguments,
                    positions
                })) context.report({
                    messageId: 'forbidden',
                    node
                });
            }
        };
    }
};
const no_dynamic_filesystem_path = noDynamicFilesystemPath;
function resolveMethod({ callee, methods, namespaces }) {
    if ('Identifier' === callee.type) return methods.get(callee.name) ?? null;
    if ('MemberExpression' === callee.type && !callee.computed && 'Identifier' === callee.object.type && namespaces.has(callee.object.name) && 'Identifier' === callee.property.type && FILESYSTEM_PATH_ARGUMENTS.has(callee.property.name)) return callee.property.name;
    return null;
}
function hasDynamicPath({ arguments: args, positions }) {
    return positions.some((position)=>{
        const argument = args[position];
        return void 0 !== argument && !isStaticString(argument);
    });
}
export default no_dynamic_filesystem_path;
export { no_dynamic_filesystem_path as noDynamicFilesystemPath };
