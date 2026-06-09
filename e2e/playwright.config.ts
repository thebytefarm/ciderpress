import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for the Ciderpress docs site.
 *
 * Goal: catch visual regressions across themes, viewports, and component
 * states. Optimized for snapshot stability — every spec uses the prep helper
 * in lib/stabilize.ts so animations / font swaps don't produce flaky diffs.
 *
 * Project tags:
 *   @desktop-only — runs on desktop project only (hover/focus, large layouts)
 *   @mobile-only  — runs on mobile project only (hamburger, drawer, ToC)
 *   (untagged)    — runs on all viewport projects
 */
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const IS_CI = Boolean(process.env.CI)

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  workers: IS_CI ? 2 : undefined,
  reporter: IS_CI
    ? [['html', { open: 'never' }], ['github']]
    : [['html', { open: 'on-failure' }], ['list']],
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      grepInvert: /@mobile-only/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'tablet',
      grepInvert: /@mobile-only|@desktop-only/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'mobile',
      grepInvert: /@desktop-only/,
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: process.env.SKIP_WEB_SERVER
    ? undefined
    : {
        command: 'pnpm --dir .. docs:serve',
        url: BASE_URL,
        reuseExistingServer: !IS_CI,
        timeout: 120_000,
      },
})
