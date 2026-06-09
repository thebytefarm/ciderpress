import { test } from '../fixtures/theme.ts'
import { snapshot } from '../lib/screenshot.ts'
import { THEME_MATRIX } from '../lib/themes.ts'

/**
 * Landing page across every theme × variant × viewport.
 *
 * This is the marketing surface of the docs site — the place where a colour
 * token regression is most visible. 36 baselines per project, ~108 total.
 */
for (const { theme, variant } of THEME_MATRIX) {
  test(`landing — ${theme} ${variant}`, async ({ page, setTheme }, testInfo) => {
    await setTheme(theme, variant)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await snapshot(page, {
      name: `landing-${theme}-${variant}-${testInfo.project.name}`,
    })
  })
}
