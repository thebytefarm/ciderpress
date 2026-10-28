import { readFile } from 'node:fs/promises'

import { expect, test } from '@playwright/test'

const THEME_ROOT = new URL('../../packages/ui/src/theme/', import.meta.url)
const CSS_FILES = [
  'styles/overrides/rail.css',
  'components/nav/ciderpress-header.css',
  'components/nav/ciderpress-docs-bar.css',
] as const

test.describe('navbar sticky offsets', () => {
  test.beforeEach(async ({ page }) => {
    const styles = await Promise.all(
      CSS_FILES.map((file) => readFile(new URL(file, THEME_ROOT), 'utf8'))
    )
    await page.setContent(`
      <div class="cp-header cp-header--no-navbar"></div>
      <div class="cp-docs-bar">Docs</div>
      <div class="sticky-probe"></div>
    `)
    await page.addStyleTag({ content: styles.join('\n') })
    await page.addStyleTag({
      content: `
        html:root { --cp-header-height: 72px; }
        .sticky-probe { position: sticky; top: var(--rp-nav-height); }
        html { scroll-padding-top: var(--rp-nav-height); }
      `,
    })
  })

  test('removes the navbar offset and restores theme height in both navigation directions', async ({
    page,
  }) => {
    await expect(page.locator('.cp-docs-bar')).toHaveCSS('top', '0px')
    await expect(page.locator('.sticky-probe')).toHaveCSS('top', '46px')
    await expect(page.locator('html')).toHaveCSS('scroll-padding-top', '46px')

    await page.locator('.cp-header').evaluate((header) => {
      header.className = 'cp-header cp-header--docs'
    })

    await expect(page.locator('.cp-docs-bar')).toHaveCSS('top', '72px')
    await expect(page.locator('.sticky-probe')).toHaveCSS('top', '118px')
    await expect(page.locator('html')).toHaveCSS('scroll-padding-top', '118px')

    await page.locator('.cp-header').evaluate((header) => {
      header.className = 'cp-header cp-header--no-navbar'
    })

    await expect(page.locator('.cp-docs-bar')).toHaveCSS('top', '0px')
    await expect(page.locator('.sticky-probe')).toHaveCSS('top', '46px')
    await expect(page.locator('html')).toHaveCSS('scroll-padding-top', '46px')
  })

  test('preserves announcement offsets while hiding the navbar', async ({ page }) => {
    await page.addStyleTag({ content: ':root { --cp-announcement-height: 36px; }' })

    await expect(page.locator('.cp-docs-bar')).toHaveCSS('top', '36px')
    await expect(page.locator('.sticky-probe')).toHaveCSS('top', '82px')
    await expect(page.locator('html')).toHaveCSS('scroll-padding-top', '82px')

    await page.addStyleTag({ content: ':root { --cp-announcement-height: 0px; }' })

    await expect(page.locator('.cp-docs-bar')).toHaveCSS('top', '0px')
    await expect(page.locator('.sticky-probe')).toHaveCSS('top', '46px')
    await expect(page.locator('html')).toHaveCSS('scroll-padding-top', '46px')
  })
})
