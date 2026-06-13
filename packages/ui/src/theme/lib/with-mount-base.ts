import { withBase } from '@rspress/core/runtime'

/**
 * Prefix `value` with the configured Rspress `base` only when it's an
 * absolute path that would otherwise escape the mount. Pass-through for
 * data URIs, fully-qualified URLs, hash anchors, and relative paths —
 * applying `withBase()` to those produces broken results (the kitchen-
 * sink data-URI logo regression that the examples e2e caught).
 *
 * Use this wrapper at every render site that takes a user-supplied asset
 * URL from the ciderpress config (`logo`, `heroDemo.src`, brand chips
 * etc.), instead of calling `withBase()` directly.
 *
 * @param value - Asset URL or path from user config (may be `undefined`)
 * @returns The base-prefixed URL when applicable, otherwise `value` as-is
 */
export function withMountBase(value: string | undefined): string {
  if (value === undefined) {
    return ''
  }
  if (!value.startsWith('/')) {
    return value
  }
  // Data URIs (`data:image/svg+xml;...`) and protocol-relative or
  // explicit-protocol URLs are absolute in their own namespace — never
  // prefix.
  if (value.startsWith('//') || /^[a-z][a-z0-9+\-.]*:/i.test(value)) {
    return value
  }
  return withBase(value)
}
