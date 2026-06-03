/**
 * Fallback module re-exported by the `@ciderpress/internal/user-config` webpack
 * alias when no bundleable `ciderpress.config.{ts,mts,cts,js,mjs,cjs}` exists at
 * the standard location. Keeps the slot component's import resolvable so the
 * site builds with zero config and the default `<CiderpressLogo />` renders.
 *
 * The slot component handles a missing or string `logo` field gracefully —
 * this stub just provides the import target.
 */

export default {}
