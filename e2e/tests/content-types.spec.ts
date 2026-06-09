import { test } from '../fixtures/theme.ts'
import { snapshot } from '../lib/screenshot.ts'

/**
 * Stress tests for content primitives that commonly regress on mobile:
 *   - Code blocks (horizontal overflow, scrollbar styling)
 *   - Tables (responsive collapse vs horizontal scroll)
 *   - Frontmatter rendering on landing pages
 *
 * Run on the default (mulled / dark) theme — content-type rendering shouldn't
 * be theme-dependent. If a specific theme breaks code blocks, doc-page.spec
 * will catch it.
 */
const CONTENT_PAGES = [
  { name: 'cli-reference', route: '/references/cli', catches: 'code blocks' },
  { name: 'configuration', route: '/references/configuration', catches: 'long-form code' },
  { name: 'themes-tables', route: '/concepts/themes', catches: 'tables + components' },
] as const

for (const { name, route } of CONTENT_PAGES) {
  test(`content: ${name}`, async ({ page }, testInfo) => {
    await page.goto(route)
    await page.waitForLoadState('networkidle')
    await snapshot(page, {
      name: `content-${name}-${testInfo.project.name}`,
    })
  })
}
