// @ts-check

/**
 * Ladle config for @ciderpress/ui.
 *
 * - Stories live alongside source: `src/**\/*.stories.{ts,tsx}`
 * - Default to dark variant — most ciderpress themes ship dark-first
 * - Expose all five built-in palettes (mulled, honeycrisp, grannysmith,
 *   amber, midnight, arcade) via a custom global control so reviewers
 *   can swap palettes without restarting the dev server
 *
 * @type {import('@ladle/react').UserConfig}
 */
export default {
  stories: 'src/**/*.stories.{ts,tsx}',
  defaultStory: undefined,
  viteConfig: '.ladle/vite.config.ts',
  addons: {
    theme: {
      enabled: true,
      defaultState: 'dark',
    },
    mode: {
      enabled: true,
      defaultState: 'full',
    },
  },
}
