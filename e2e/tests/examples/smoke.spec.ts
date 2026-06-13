import { expect, test } from '../../fixtures/theme.ts'
import { discoverExamples } from '../../lib/examples.ts'

/**
 * One smoke check per example. Catches the three highest-impact build
 * regressions for the orchestrator:
 *
 *   1. example missing from `.ciderpress/dist/examples/<slug>/` (orchestrator skipped or copy failed)
 *   2. console errors during hydration (runtime regression — broken bundle, missing chunk)
 *   3. failed network requests (asset prefix wrong, file copy missed something)
 *
 * Static server enforces no SPA fallback so a 404 here means the file
 * really isn't there — not "router caught the unknown route".
 */
const EXAMPLES = discoverExamples()

for (const example of EXAMPLES) {
  test(`${example.slug} home loads cleanly`, async ({ page }) => {
    const consoleErrors: string[] = []
    const failedRequests: string[] = []

    page.on('pageerror', (err) => consoleErrors.push(err.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('requestfailed', (req) => {
      failedRequests.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText ?? '?'}`)
    })
    page.on('response', (res) => {
      if (res.status() >= 400) {
        failedRequests.push(`${res.status()} ${res.url()}`)
      }
    })

    const response = await page.goto(example.mountBase)
    expect(
      response?.status(),
      `${example.mountBase} should respond 2xx`
    ).toBeLessThan(400)

    // Header from the ciderpress theme is the simplest hydration marker —
    // proves React mounted and CSS resolved. If the bundle 404d this fails.
    await expect(page.locator('.cp-header').first()).toBeVisible()

    // Assert failed requests FIRST — they carry the URL, which makes a
    // missing-asset regression actionable. Console errors come second
    // because they're just `"Failed to load resource: 404"` strings
    // without context.
    expect(
      failedRequests,
      `${example.slug} failed requests:\n${failedRequests.join('\n')}`
    ).toEqual([])
    expect(
      consoleErrors,
      `${example.slug} console errors:\n${consoleErrors.join('\n')}`
    ).toEqual([])
  })
}
