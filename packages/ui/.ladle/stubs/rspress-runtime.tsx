import type React from 'react'

/**
 * Ladle stub for `@rspress/core/runtime`.
 *
 * The real module is provided by Rspress at site-build time and is not
 * resolvable in a standalone Vite dev server. These shims give shared
 * components enough surface area to render in stories.
 *
 * @private
 */

export interface LinkProps {
  readonly to: string
  readonly className?: string
  readonly children: React.ReactNode
}

/**
 * Plain anchor stand-in for Rspress's `<Link>` router component.
 *
 * @param props - Link target, optional className, children
 * @returns Anchor element
 */
export function Link({ to, className, children }: LinkProps): React.ReactElement {
  return (
    <a href={to} className={className}>
      {children}
    </a>
  )
}

/**
 * Stub for Rspress's `useLocation` — returns the live `globalThis.location`
 * when available, an empty path on the server.
 *
 * @returns Minimal location object
 */
export function useLocation(): { readonly pathname: string; readonly search: string } {
  if (globalThis.window === undefined) {
    return { pathname: '/', search: '' }
  }
  return {
    pathname: globalThis.window.location.pathname,
    search: globalThis.window.location.search,
  }
}

/**
 * Stub for Rspress's `useFrontmatter` — returns an empty object so stories
 * can render layouts that read frontmatter without crashing.
 *
 * @returns Empty frontmatter record
 */
export function useFrontmatter(): Record<string, unknown> {
  return {}
}

/**
 * Stub for Rspress's `useSite` — returns minimal site config.
 *
 * @returns Empty site config
 */
export function useSite(): Record<string, unknown> {
  return {}
}

/**
 * Stub for Rspress's `useSidebar` — returns an empty sidebar tree.
 *
 * @returns Empty sidebar payload
 */
export function useSidebar(): { readonly items: readonly never[] } {
  return { items: [] }
}

/**
 * Stub for Rspress's `useActiveMatcher` — never matches in story context.
 *
 * @returns A matcher that always returns `false`
 */
export function useActiveMatcher(): (path: string) => boolean {
  return () => false
}
