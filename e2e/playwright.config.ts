import process from 'node:process'

import { defineConfig, devices } from '@playwright/test'

// Load e2e/.env (gitignored). Holds ARGOS_TOKEN and any local overrides.
// In CI, env vars come from the workflow's `env:` block instead.
try {
  process.loadEnvFile('.env')
} catch {
  // No .env file — that's fine, vars may be set elsewhere (CI, shell).
}

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
 *
 * All Playwright outputs are consolidated under `.playwright/` so the
 * dot-prefix keeps them out of Ciderpress's sync watcher (which scans the
 * tree for markdown content and would otherwise pick up `error-context.md`
 * files generated per failed test).
 */
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080'
const IS_CI = Boolean(process.env.CI)

export default defineConfig({
  testDir: './tests',
  outputDir: './.playwright/test-results',
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  workers: IS_CI ? 2 : undefined,
  reporter: IS_CI
    ? [
        ['html', { open: 'never', outputFolder: './.playwright/report' }],
        ['blob', { outputDir: './.playwright/blob-report' }],
        ['github'],
        ['@argos-ci/playwright/reporter'],
      ]
    : [['html', { open: 'on-failure', outputFolder: './.playwright/report' }], ['list']],
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
        command: 'pnpm -C .. docs:serve --no-open',
        url: BASE_URL,
        reuseExistingServer: !IS_CI,
        timeout: 120_000,
        // Stream the server's output so you see build/serve errors as they happen
        // instead of staring at silence until the 2-minute timeout fires.
        stdout: 'pipe',
        stderr: 'pipe',
      },
})
