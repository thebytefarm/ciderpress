import type { Page } from '@playwright/test'

/**
 * Disable all animations + transitions and wait for fonts and pending images
 * before a screenshot. Run this *after* navigation completes.
 *
 * Without this, flaky diffs come from: animation easing mid-transition, font
 * swap during web font load, lazy images settling, blinking caret.
 */
export async function prepareForSnapshot(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
      html { scroll-behavior: auto !important; }
    `,
  })

  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready
    }
    const images = Array.from(document.images)
    await Promise.all(
      images.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.addEventListener('load', resolve, { once: true })
              img.addEventListener('error', resolve, { once: true })
            })
      )
    )
  })

  await page.emulateMedia({ reducedMotion: 'reduce' })
}

/**
 * Selectors for elements that change between runs and should be masked from
 * snapshots (timestamps, build hashes, random IDs, animated FX layers).
 */
export const DYNAMIC_MASKS = [
  '[data-cp-mask]',
  '[data-cp-build-hash]',
  // Arcade theme has CRT scanlines / neon pulse that animate continuously.
  '[data-cp-theme="arcade"] .cp-card::before',
]
