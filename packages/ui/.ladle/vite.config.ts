import { fileURLToPath } from 'node:url'

import type { UserConfig } from 'vite'

/**
 * Ladle merges this config into its own Vite setup.
 *
 * Aliases redirect `@rspress/core/*` imports (which only resolve when
 * Rspress's build is driving the bundle) to local stubs under
 * `.ladle/stubs/`. This keeps shared theme components renderable in
 * isolation without dragging the full docs framework into stories.
 */
const config: UserConfig = {
  resolve: {
    alias: [
      {
        find: '@rspress/core/runtime',
        replacement: fileURLToPath(new URL('./stubs/rspress-runtime.tsx', import.meta.url)),
      },
      {
        find: '@rspress/core/theme-original',
        replacement: fileURLToPath(new URL('./stubs/rspress-theme-original.tsx', import.meta.url)),
      },
      {
        find: '@rspress/core/theme',
        replacement: fileURLToPath(new URL('./stubs/rspress-theme.tsx', import.meta.url)),
      },
    ],
  },
  optimizeDeps: {
    // Rspress bundles its runtime against virtual modules (`virtual-page-data`
    // etc.) injected by its build. Vite's pre-bundler can't resolve those,
    // so we skip Rspress and let the aliases above redirect every subpath
    // to a local stub at request time.
    exclude: [
      '@rspress/core',
      '@rspress/core/runtime',
      '@rspress/core/theme',
      '@rspress/core/theme-original',
    ],
  },
}

export default config
