import { argosScreenshot } from '@argos-ci/playwright'
import type { Locator, Page } from '@playwright/test'

import { DYNAMIC_MASKS, prepareForSnapshot } from './stabilize.ts'

/**
 * Where Argos writes its local screenshot copies. Argos defaults to
 * `./screenshots` (relative to CWD) which would land in `e2e/screenshots/`
 * and get picked up by Ciderpress's dev watcher. Routing through
 * `.playwright/` keeps everything under one dot-prefixed dir.
 */
const ARGOS_ROOT = './.playwright/screenshots'

interface SnapshotOptions {
  // Stable name. Argos will namespace by project (desktop/tablet/mobile) automatically.
  name: string
  // Defaults to true. Set false for above-the-fold-only screenshots (sticky header tests).
  fullPage?: boolean
  // Extra selectors to mask, on top of the global DYNAMIC_MASKS.
  mask?: string[]
}

/**
 * Standard visual-regression snapshot. Stabilizes the page, masks dynamic
 * content, then uploads to Argos. Prefer this over calling argosScreenshot
 * directly so every snapshot has the same prep applied.
 */
export async function snapshot(page: Page, options: SnapshotOptions): Promise<void> {
  await prepareForSnapshot(page)
  const maskSelectors = [...DYNAMIC_MASKS, ...(options.mask ?? [])]
  await argosScreenshot(page, options.name, {
    root: ARGOS_ROOT,
    fullPage: options.fullPage ?? true,
    mask: maskSelectors.map((selector) => page.locator(selector)),
  })
}

/**
 * Element-scoped snapshot. Use for component-state tests (hover, focus,
 * sidebar open/closed) where the rest of the page is irrelevant noise.
 */
export async function snapshotElement(page: Page, locator: Locator, name: string): Promise<void> {
  await prepareForSnapshot(page)
  await argosScreenshot(page, name, {
    root: ARGOS_ROOT,
    element: locator,
  })
}
