import { addCollection, Icon as IconifyIcon } from '@iconify/react'
import type { IconProps } from '@iconify/react'
import type React from 'react'
import { useEffect, useState } from 'react'

/**
 * Per-collection lazy loaders keyed by Iconify prefix.
 *
 * Each entry is a bare dynamic `import()` so the consuming site's Rsbuild
 * build emits **one async chunk per collection** instead of folding all nine
 * `icons.json` files into a single eager ~30MB chunk pulled on every route.
 * Two consequences fall out of that:
 *
 * - **Deployability** — the largest collection (`logos`, ~8MB) stays well
 *   under per-file host caps (Cloudflare Pages rejects files >25MB), where
 *   the combined blob failed outright.
 * - **Performance** — a page only downloads the collections it actually
 *   references, not the full set on first paint.
 *
 * The specifiers are string literals (not computed) so the bundler can
 * statically resolve every chunk at build time.
 *
 * @private
 */
const COLLECTION_LOADERS: Record<string, () => Promise<{ readonly default: unknown }>> = {
  catppuccin: () => import('@iconify-json/catppuccin/icons.json'),
  devicon: () => import('@iconify-json/devicon/icons.json'),
  logos: () => import('@iconify-json/logos/icons.json'),
  'material-icon-theme': () => import('@iconify-json/material-icon-theme/icons.json'),
  mdi: () => import('@iconify-json/mdi/icons.json'),
  pixelarticons: () => import('@iconify-json/pixelarticons/icons.json'),
  'simple-icons': () => import('@iconify-json/simple-icons/icons.json'),
  'skill-icons': () => import('@iconify-json/skill-icons/icons.json'),
  'vscode-icons': () => import('@iconify-json/vscode-icons/icons.json'),
}

/**
 * Cache of in-flight / settled collection registrations keyed by prefix.
 * Guarantees each collection's chunk is fetched and merged into Iconify's
 * registry exactly once, regardless of how many `<Icon>` instances on a
 * page reference it.
 *
 * @private
 */
const collectionCache = new Map<string, Promise<void>>()

/**
 * Offline-registered Iconify icon.
 *
 * Renders `@iconify/react`'s `Icon` unchanged, but registers the icon's
 * collection on demand: the first time a prefix is seen the matching
 * `@iconify-json` chunk is dynamically imported and merged into Iconify's
 * registry, then a re-render paints the resolved SVG. Because `IconifyIcon`
 * reads the live registry on every render, an icon appears as soon as its
 * collection chunk resolves.
 *
 * @param props - Standard `@iconify/react` icon props; `icon` is the
 *   `prefix:name` identifier (e.g. `devicon:typescript`)
 * @returns The Iconify icon element
 */
export function Icon(props: IconProps): React.ReactElement {
  const prefix = resolvePrefix(props.icon)
  const [, markRegistered] = useState(false)

  useEffect(() => {
    ensureCollection(prefix).then(() => markRegistered(true))
  }, [prefix])

  return <IconifyIcon {...props} />
}

/**
 * Dynamically import and register the collection for a prefix, once.
 *
 * Returns the cached registration promise on repeat calls so the chunk is
 * fetched a single time. Unknown prefixes (no bundled collection) resolve
 * immediately — `IconifyIcon` falls back to its own resolution for those.
 *
 * @private
 * @param prefix - Iconify collection prefix (e.g. `logos`)
 * @returns Promise that settles once the collection is registered
 */
function ensureCollection(prefix: string): Promise<void> {
  const cached = collectionCache.get(prefix)
  if (cached !== undefined) {
    return cached
  }
  const loader = COLLECTION_LOADERS[prefix]
  if (loader === undefined) {
    return Promise.resolve()
  }
  const registration = loader().then(registerModule)
  collectionCache.set(prefix, registration)
  return registration
}

/**
 * Merge a dynamically imported `icons.json` module into Iconify's registry.
 *
 * @private
 * @param mod - Module namespace whose `default` export is the collection JSON
 */
function registerModule(mod: { readonly default: unknown }): void {
  addCollection(mod.default as Parameters<typeof addCollection>[0])
}

/**
 * Extract the collection prefix from an Iconify identifier. Non-string icon
 * inputs and identifiers without a `prefix:name` shape yield an empty string,
 * which `ensureCollection` treats as "nothing to load".
 *
 * @private
 * @param icon - The `icon` prop passed to `<Icon>`
 * @returns The collection prefix, or `''` when none can be determined
 */
function resolvePrefix(icon: IconProps['icon']): string {
  if (typeof icon !== 'string') {
    return ''
  }
  const parts = icon.split(':')
  if (parts.length < 2) {
    return ''
  }
  return parts[0]
}
