import { expect, test } from '../../fixtures/theme.ts'
import { discoverExamples } from '../../lib/examples.ts'

/**
 * The "no asset leaks outside the mount" guard. Catches the class of
 * regression we already hit on this branch:
 *   - `<HeaderLogo />` forgot `withBase()` → `<img src="/logo.svg">`
 *     escapes the mount and 404s on the live deploy.
 *   - Rspress's `assetPrefix` regressed because `NODE_ENV !== 'production'`
 *     at config-time → CSS/JS bundles load from `/static/...` instead of
 *     `/examples/<slug>/static/...`.
 *
 * For every example, fetch the home page HTML and assert that every
 * `href` and `src` attribute is one of:
 *   - external (`http://`, `https://`, `mailto:`, `tel:`, `data:`)
 *   - in-page anchor (`#…`)
 *   - rooted at the example's mount base
 *
 * Anything else is a regression.
 */
const EXAMPLES = discoverExamples()

const ATTR_RE = /\s(?:href|src)\s*=\s*("([^"]*)"|'([^']*)')/g

const ALLOWED_PREFIXES = ['http://', 'https://', 'mailto:', 'tel:', 'data:', '#']

for (const example of EXAMPLES) {
  test(`${example.slug} keeps all assets under ${example.mountBase}`, async ({ page }) => {
    const response = await page.goto(example.mountBase)
    const html = (await response?.text()) ?? ''

    const matches = [...html.matchAll(ATTR_RE)]
    const values = matches.map((m) => m[2] ?? m[3]).filter((v) => v.length > 0)

    // `mountBase` carries a trailing slash (`/examples/simple/`); the
    // bare form (`/examples/simple`) is the canonical link back to the
    // mount root and shows up in headers / hero CTAs. Allow both.
    const mountBare = example.mountBase.replace(/\/$/, '')

    const leaks = values.filter((value) => {
      if (ALLOWED_PREFIXES.some((prefix) => value.startsWith(prefix))) {
        return false
      }
      if (!value.startsWith('/')) {
        // Relative paths resolve against the document URL, which is
        // already under the mount — those are fine.
        return false
      }
      if (value === mountBare) {
        return false
      }
      return !value.startsWith(example.mountBase)
    })

    expect(
      leaks,
      `${example.slug}: asset URLs outside ${example.mountBase}:\n${leaks.join('\n')}`
    ).toEqual([])
  })
}
