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

    // Pick the first **visible** in-mount link — Rspress emits `.rp-link`
    // on its `<Link>` components and the cp-theme reuses the class.
    // Filtering with `:visible` skips topbar nav links that collapse
    // into the mobile hamburger menu (present in the DOM but hidden by
    // CSS) so the same test passes on desktop, tablet, and mobile
    // viewports against an always-visible link in the page body.
    const internalLink = page
      .locator(`a[href^="${example.mountBase}"]:not([href="${example.mountBase}"]):visible`)
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

    // Guard against the mount prefix being applied twice
    // (`/examples/<slug>/examples/<slug>/…`). The theme scrapes Rspress's
    // already-based nav hrefs; if they aren't un-based before re-routing
    // through `<Link>`, react-router's basename doubles the prefix and the
    // page 404s. `startsWith` alone can't catch it (a doubled path still
    // starts with the mount), so assert the prefix appears exactly once.
    const doubledMount = `${example.mountBase}${example.mountBase.slice(1)}`
    expect(
      url.pathname.includes(doubledMount),
      `${example.slug} doubled mount prefix: ${url.pathname}`
    ).toBe(false)

    // And the destination must actually resolve, not land on the SPA 404.
    const heading = (await page.locator('h1').first().textContent()) ?? ''
    expect(heading.toUpperCase(), `${example.slug} nav landed on 404`).not.toContain(
      'PAGE NOT FOUND'
    )
  })
}
