import { expect, test } from '../fixtures/theme.ts'
import { snapshot } from '../lib/screenshot.ts'

/**
 * Mobile-only navigation states. Hamburger + drawer are the components most
 * likely to silently break — they only render below a viewport breakpoint and
 * desktop developers rarely see them.
 *
 * Tagged @mobile-only so desktop/tablet projects skip these specs.
 */
test.describe('@mobile-only mobile nav', () => {
  const ROUTE = '/concepts/themes'

  test('mobile nav — initial (drawer closed)', async ({ page }) => {
    await page.goto(ROUTE)
    await page.waitForLoadState('networkidle')
    await snapshot(page, {
      name: 'mobile-nav-closed',
      fullPage: false,
    })
  })

  test('mobile nav — drawer open', async ({ page }) => {
    await page.goto(ROUTE)
    await page.waitForLoadState('networkidle')

    // The hamburger button — selector is forgiving until we lock in the aria-label.
    const hamburger = page
      .getByRole('button', { name: /menu|sidebar|toggle|navigation/i })
      .first()
    await expect(hamburger).toBeVisible()
    await hamburger.click()

    // Wait for any drawer-open transition to settle. With prepareForSnapshot
    // disabling transitions this is instant, but a short tick guards against
    // any JS-driven layout.
    await page.waitForTimeout(150)

    await snapshot(page, {
      name: 'mobile-nav-drawer-open',
    })
  })

  test('mobile nav — page ToC', async ({ page }) => {
    await page.goto(ROUTE)
    await page.waitForLoadState('networkidle')

    // The "On this page" / ToC is usually collapsed on mobile behind a button.
    const tocToggle = page
      .getByRole('button', { name: /on this page|table of contents|outline/i })
      .first()
    if (await tocToggle.isVisible().catch(() => false)) {
      await tocToggle.click()
      await page.waitForTimeout(150)
    }
    await snapshot(page, {
      name: 'mobile-nav-toc',
    })
  })
})
