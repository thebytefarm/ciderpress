import { test } from '../fixtures/theme.ts'
import { snapshot } from '../lib/screenshot.ts'
import { THEME_MATRIX } from '../lib/themes.ts'

/**
 * A representative content-rich doc page across every theme × variant × viewport.
 *
 * /concepts/themes is chosen because it exercises:
 *   - Typography hierarchy (multiple H2/H3, paragraphs, lists)
 *   - Tables (UI/Job table)
 *   - Custom MDX components (BrowserWindow, ThemeColorPalette)
 *   - Inline + block code
 *   - Images with frames
 *
 * Catches regressions in any of those primitives across themes.
 */
const DOC_ROUTE = '/concepts/themes'

for (const { theme, variant } of THEME_MATRIX) {
  test(`doc page — ${theme} ${variant}`, async ({ page, setTheme }, testInfo) => {
    await setTheme(theme, variant)
    await page.goto(DOC_ROUTE)
    await page.waitForLoadState('networkidle')
    await snapshot(page, {
      name: `doc-page-${theme}-${variant}-${testInfo.project.name}`,
    })
  })
}
