import { expect, test } from '../fixtures/theme.ts'

/**
 * Non-visual smoke: every top-level docs route renders without console errors.
 * Not a regression suite — a tripwire for runtime breakage that would taint
 * every visual baseline below it.
 */
const ROUTES = [
  '/',
  '/getting-started/',
  '/concepts/',
  '/guides/',
  '/reference/',
  '/examples/',
  '/framework/',
] as const

for (const route of ROUTES) {
  test(`loads ${route} without console errors`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    const response = await page.goto(route)
    expect(response?.status(), `${route} should respond 2xx`).toBeLessThan(400)
    await expect(page.locator('.cp-header').first()).toBeVisible()
    expect(errors, `console errors on ${route}:\n${errors.join('\n')}`).toEqual([])
  })
}
