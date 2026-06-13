import { expect, test } from '../../fixtures/theme.ts'
import { discoverExamples } from '../../lib/examples.ts'

/**
 * The "examples landing page actually leads somewhere real" guard, plus
 * the "internal nav stays under the mount" guard. Catches:
 *   - the orchestrator's regenerated `docs/examples/index.mdx` pointing
 *     at the wrong URLs (broken routing or missed example)
 *   - any inner-route regression where clicking a sidebar item escapes
 *     the mount (would have caught the missing `base` plumbing)
 */
const EXAMPLES = discoverExamples()

test('landing page links to every discovered example', async ({ page }) => {
  await page.goto('/examples/')
  for (const example of EXAMPLES) {
    const link = page.locator(`a[href="${example.mountBase}"]`).first()
    await expect(link, `card for ${example.slug} on /examples/`).toBeVisible()
  }
})

for (const example of EXAMPLES) {
  test(`${example.slug} sidebar nav stays under ${example.mountBase}`, async ({ page }) => {
    await page.goto(example.mountBase)

    // Pick the first in-mount link from the sidebar / page body — Rspress
    // emits `.rp-link` on its `<Link>` components and the cp-theme reuses
    // the class. Anything internal that's not external should qualify.
    const internalLink = page
      .locator(`a[href^="${example.mountBase}"]:not([href="${example.mountBase}"])`)
      .first()
    await expect(internalLink, `${example.slug} has at least one inner link`).toBeVisible()

    const href = await internalLink.getAttribute('href')
    expect(href, `${example.slug} inner link href`).not.toBeNull()
    await internalLink.click()
    await page.waitForLoadState('domcontentloaded')

    const url = new URL(page.url())
    expect(
      url.pathname.startsWith(example.mountBase),
      `${example.slug} click escaped to ${url.pathname}`
    ).toBe(true)
  })
}
