import path from 'node:path'

import type { RspressPlugin } from '@rspress/core'

/**
 * Rspress plugin that registers ciderpress theme components and styles.
 *
 * Global styles are loaded via the theme entry (theme/index.tsx)
 * CSS import — not through the plugin globalStyles property.
 * Nav-level components (e.g. BranchTag) are injected via layout
 * slot props in the custom Layout component, not globalUIComponents.
 * ThemeProvider is registered as a globalUIComponent to configure
 * the active theme on every page.
 *
 * @returns Configured RspressPlugin object
 */
export function ciderpressPlugin(): RspressPlugin {
  const componentsDir = path.resolve(import.meta.dirname, 'theme', 'components')

  return {
    name: 'ciderpress',
    globalUIComponents: [
      path.resolve(componentsDir, 'theme-provider.tsx'),
      path.resolve(componentsDir, 'edit-source-button.tsx'),
      path.resolve(componentsDir, 'seo-head.tsx'),
      // `nav-logo.tsx` is intentionally NOT registered here. It used to
      // portal a function-form logo into Rspress's `.rp-nav__title__link`,
      // but `<HeaderLogo />` now renders the visible logo directly inside
      // `cp-header-logo`. Keeping NavLogo registered would invoke the
      // user's `LogoFn` twice per render and install a second
      // MutationObserver on `<html>`. The file is kept around for any
      // downstream imports — it just no longer mounts.
    ],
  }
}
