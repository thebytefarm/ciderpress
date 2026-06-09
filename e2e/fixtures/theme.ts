import { test as base } from '@playwright/test'

import type { Theme, Variant } from '../lib/themes.ts'

interface ThemeFixtures {
  /**
   * Set the active theme + variant. Must be called *before* page.goto so the
   * init script runs on the first paint and we don't capture a flash.
   */
  setTheme: (theme: Theme, variant: Variant) => Promise<void>
}

export const test = base.extend<ThemeFixtures>({
  setTheme: async ({ page }, use) => {
    const setTheme = async (theme: Theme, variant: Variant): Promise<void> => {
      await page.addInitScript(
        ({ t, v }) => {
          document.documentElement.setAttribute('data-cp-theme', t)
          document.documentElement.setAttribute('data-cp-variant', v)
          // Persist so any re-hydration on the client doesn't overwrite us.
          try {
            localStorage.setItem('cp-theme', t)
            localStorage.setItem('cp-variant', v)
          } catch {
            // localStorage may be unavailable in some test contexts.
          }
        },
        { t: theme, v: variant }
      )
    }
    await use(setTheme)
  },
})

export { expect } from '@playwright/test'
