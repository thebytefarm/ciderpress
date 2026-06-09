import { test } from '../fixtures/theme.ts'
import { snapshot } from '../lib/screenshot.ts'

/**
 * Header behavior across scroll states. Catches regressions in:
 *   - Sticky-header collapse (shrink-on-scroll)
 *   - Backdrop blur / box-shadow that appears once you scroll past the hero
 *   - ToC active-section highlight
 *
 * Scoped to viewport-only (not full page) so the diff is focused on the
 * header itself and ToC margins.
 */
test.describe('sticky header', () => {
  const ROUTE = '/concepts/themes'

  test('header — at top', async ({ page }, testInfo) => {
    await page.goto(ROUTE)
    await page.waitForLoadState('networkidle')
    await snapshot(page, {
      name: `sticky-header-top-${testInfo.project.name}`,
      fullPage: false,
    })
  })

  test('header — scrolled', async ({ page }, testInfo) => {
    await page.goto(ROUTE)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => globalThis.scrollTo(0, 600))
    await page.waitForTimeout(100)
    await snapshot(page, {
      name: `sticky-header-scrolled-${testInfo.project.name}`,
      fullPage: false,
    })
  })
})
