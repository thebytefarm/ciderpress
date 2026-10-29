import mdi from '@iconify-json/mdi/icons.json' with { type: 'json' }
import type { IconProps } from '@iconify/react'

const SHELL_ICON_NAMES = [
  'weather-sunny',
  'weather-night',
  'palette-outline',
  'file-document',
  'google-spreadsheet',
  'microsoft-visual-studio-code',
] as const

/**
 * Build-time subset for fixed theme icons, avoiding a full MDI download for site chrome.
 */
export const shellIcons: Readonly<Record<string, IconProps['icon']>> = Object.fromEntries(
  SHELL_ICON_NAMES.map((name) => [
    `mdi:${name}`,
    { ...mdi.icons[name], width: mdi.width, height: mdi.height },
  ])
)
