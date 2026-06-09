/**
 * ESM shim — inject global `require` for bundled CJS deps (e.g. webpack-chain
 * inside Rsbuild) that reference bare `require()` in an ESM context on Node 24+.
 *
 * Must be the first import in the CLI entry point so it runs before any
 * dependency that relies on `require`.
 *
 * @private
 */
import { createRequire } from 'node:module'

// oxlint-disable-next-line no-global-assign -- intentional shim for Node 24 CJS compat
globalThis.require ??= createRequire(import.meta.url)
