import { test } from '../../fixtures/theme.ts'
import { discoverExamples } from '../../lib/examples.ts'
import { snapshot } from '../../lib/screenshot.ts'

/**
 * Visual regression for each example's home page. Argos namespaces by
 * playwright project (desktop/tablet/mobile) automatically, so a single
 * `snapshot()` call produces one baseline per viewport.
 *
 * Catches theme + layout regressions across the four flavours:
 *   - simple (grannysmith), custom (midnight white-label), kitchen-sink
 *     (arcade), large (midnight).
 *
 * If a future framework change drifts only one theme, only that example
 * fails — easy to localize.
 */
const EXAMPLES = discoverExamples()

for (const example of EXAMPLES) {
  test(`${example.slug} home — visual`, async ({ page }) => {
    await page.goto(example.mountBase)
    await snapshot(page, { name: `examples/${example.slug}/home` })
  })
}
