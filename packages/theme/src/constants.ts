/**
 * Cross-module constants shared across `theme-registry.ts`, `schema.ts`,
 * and `definitions.ts`. Lives in a dedicated leaf file (no outgoing
 * imports back into the theme package) so any consumer can pull these
 * without risking a circular import at module-init time.
 */

/**
 * Canonical name of the framework's default theme. Single source of truth
 * for the three sites that need to agree on the default slug:
 *
 *  1. `themeConfigSchema.name.default(...)` in `schema.ts` — the schema
 *     default applied when `theme.name` is omitted from user config.
 *  2. `THEME_ALIASES.default` in `definitions.ts` — the legacy `'default'`
 *     slug aliases to this name.
 *  3. `FOUC_ROOT_THEME_NAME` in `theme-registry.ts` — decides which theme
 *     also emits the `:root { ... }` FOUC fallback.
 *
 * Re-exported via `index.ts` so external consumers can reach it through
 * `@ciderpress/theme`.
 */
export const DEFAULT_THEME_NAME = 'mulled' as const

/**
 * Frozen list of every built-in theme name. Used by `themeInputEnvelopeSchema`
 * to reject `defineTheme({ name: 'honeycrisp' | 'grannysmith' | 'mulled' |
 * 'amber' | 'midnight' | 'arcade' })` calls from user code — these slugs are
 * reserved for first-party themes.
 *
 * Declared as a static literal list rather than `Object.keys(BUILT_IN_THEMES)`
 * because `BUILT_IN_THEMES` itself is built by calling `defineTheme` at module
 * load — reading the registry inside the refine would be a circular reference
 * (temporal dead zone). Adding a new built-in theme is a two-line change here
 * plus a new entry in `BUILT_IN_THEMES`.
 */
export const RESERVED_THEME_NAMES: readonly string[] = Object.freeze([
  'honeycrisp',
  'grannysmith',
  'mulled',
  'amber',
  'midnight',
  'arcade',
])
