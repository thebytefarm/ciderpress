import { isStaticString } from "./160.mjs";
const FILESYSTEM_MODULES = new Set([
    'fs',
    'node:fs',
    'fs/promises',
    'node:fs/promises'
]);
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
    'writeFileSync'
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
        const methods = new Set();
        return {
            ImportDeclaration (node) {
                if (!FILESYSTEM_MODULES.has(node.source.value)) return;
                return node.specifiers.map((specifier)=>{
                    if ('ImportSpecifier' === specifier.type) {
                        if (FILESYSTEM_METHODS.has(specifier.imported.name)) methods.add(specifier.local.name);
                        return;
                    }
                    namespaces.add(specifier.local.name);
                });
            },
            CallExpression (node) {
                const [path] = node.arguments;
                if (void 0 === path || isStaticString(path)) return;
                const isNamedMethod = 'Identifier' === node.callee.type && methods.has(node.callee.name);
                const isNamespaceMethod = 'MemberExpression' === node.callee.type && !node.callee.computed && 'Identifier' === node.callee.object.type && namespaces.has(node.callee.object.name) && 'Identifier' === node.callee.property.type && FILESYSTEM_METHODS.has(node.callee.property.name);
                if (isNamedMethod || isNamespaceMethod) context.report({
                    messageId: 'forbidden',
                    node
                });
            }
        };
    }
};
const no_dynamic_filesystem_path = noDynamicFilesystemPath;
export default no_dynamic_filesystem_path;
export { no_dynamic_filesystem_path as noDynamicFilesystemPath };
