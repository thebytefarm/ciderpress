import catppuccin from '@iconify-json/catppuccin/icons.json' with { type: 'json' }
import devicon from '@iconify-json/devicon/icons.json' with { type: 'json' }
import logos from '@iconify-json/logos/icons.json' with { type: 'json' }
import materialIconTheme from '@iconify-json/material-icon-theme/icons.json' with { type: 'json' }
import mdi from '@iconify-json/mdi/icons.json' with { type: 'json' }
import pixelarticons from '@iconify-json/pixelarticons/icons.json' with { type: 'json' }
import simpleIcons from '@iconify-json/simple-icons/icons.json' with { type: 'json' }
import skillIcons from '@iconify-json/skill-icons/icons.json' with { type: 'json' }
import vscodeIcons from '@iconify-json/vscode-icons/icons.json' with { type: 'json' }
import { addCollection, Icon } from '@iconify/react'

// Register all icon collections for offline Iconify resolution.
// `addCollection` is called purely for its side effect of mutating
// Iconify's internal registry. Holding the return values in a
// throwaway `const` keeps the call list a single expression statement
// rather than nine misleading named exports.
// oxlint-disable-next-line no-unused-vars
const _iconCollectionsLoaded = [
  addCollection(cast(pixelarticons)),
  addCollection(cast(devicon)),
  addCollection(cast(mdi)),
  addCollection(cast(simpleIcons)),
  addCollection(cast(skillIcons)),
  addCollection(cast(catppuccin)),
  addCollection(cast(logos)),
  addCollection(cast(vscodeIcons)),
  addCollection(cast(materialIconTheme)),
] as const

export { Icon }

/**
 * Cast an icon JSON import to the type expected by `addCollection`.
 *
 * @private
 * @param v - Raw icon JSON import
 * @returns Value cast to the addCollection parameter type
 */
function cast(v: unknown): Parameters<typeof addCollection>[0] {
  return v as Parameters<typeof addCollection>[0]
}
