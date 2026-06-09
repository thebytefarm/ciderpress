/**
 * Client-safe entry for `@ciderpress/ui`.
 *
 * Only React components and pure helpers live here. Anything that touches
 * the filesystem, `node:*` modules, `ts-morph`, or any other Node-only dep
 * lives in `./node.ts` and is published under the `@ciderpress/ui/node` subpath.
 *
 * This split exists so the Rspress client bundle (which reaches into
 * `ciderpress` → `@ciderpress/ui`) cannot pull Node-only build tooling into
 * the browser graph.
 */

export { CiderpressLogo } from './theme/components/shared/ciderpress-logo.tsx'
export type { CiderpressLogoProps } from './theme/components/shared/ciderpress-logo.tsx'
