import { test } from '../fixtures/theme.ts'
import { snapshotElement } from '../lib/screenshot.ts'

/**
 * Hover + focus states. Touch devices don't have hover so these are tagged
 * @desktop-only.
 *
 * Element-scoped screenshots — we don't care about the rest of the page, just
 * the component changing state.
 */
test.describe('@desktop-only interactive states', () => {
  test('nav link — hover', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const link = page.locator('header a').first()
    await link.hover()
    await snapshotElement(page, link, 'nav-link-hover')
  })

  test('nav link — focus (keyboard)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.keyboard.press('Tab')
    const focused = page.locator(':focus').first()
    await snapshotElement(page, focused, 'nav-link-focus')
  })

  test('sidebar link — hover', async ({ page }) => {
    await page.goto('/concepts/themes')
    await page.waitForLoadState('networkidle')
    const sidebarLink = page.locator('aside a, nav[aria-label*="sidebar" i] a').first()
    await sidebarLink.hover()
    await snapshotElement(page, sidebarLink, 'sidebar-link-hover')
  })

  test('sidebar link — active page', async ({ page }) => {
    await page.goto('/concepts/themes')
    await page.waitForLoadState('networkidle')
    const activeLink = page.locator('.rp-sidebar-item--active').first()
    await snapshotElement(page, activeLink, 'sidebar-link-active')
  })
})
