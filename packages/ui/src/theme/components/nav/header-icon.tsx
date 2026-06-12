/* oxlint-disable no-ternary -- raw-copied file; relaxed rules per packages/ui/CLAUDE.md */
import type { CiderpressConfig, IconConfig, IconImage } from '@ciderpress/config'
// oxlint-disable-next-line import/no-unresolved -- alias provided by createRspressConfig's resolve.alias
import userConfigModule from '@ciderpress/internal/user-config'
import { match } from 'massaman/match'
import type React from 'react'

import { Icon } from '../shared/icon'

import './header-icon.css'

/**
 * Small brand chip rendered before `<HeaderLogo />` inside `cp-header-logo`.
 *
 * Reads `userConfig.icon` from the bundled user config and routes:
 * - Iconify id (`"devicon:react"`) → `<Icon>` component.
 * - `{ id, color }` → `<Icon>` with inline color.
 * - `{ src, alt }` → `<img>` with the user's asset.
 * - missing → null (slot collapses, `<HeaderLogo />` stretches).
 *
 * Pairs with `<HeaderLogo />` for the canonical two-slot brand identity
 * (icon chip + wordmark logo). Sites with only one of the two get the
 * lone element rendered.
 *
 * @returns Branded icon chip ready to drop inside `cp-header-logo`, or null
 */
export function HeaderIcon(): React.ReactElement | null {
  const icon = readIconConfig(userConfigModule)
  if (icon === undefined) {
    return null
  }
  return match(resolveTopbar(icon))
    .with({ kind: 'iconify' }, (r) => (
      <span className="cp-header-icon">
        <Icon icon={r.id} style={inlineColor(r.color)} />
      </span>
    ))
    .with({ kind: 'image' }, (r) => (
      <span className="cp-header-icon">
        <img src={r.src} alt={r.alt} className="cp-header-icon__img" />
      </span>
    ))
    .exhaustive()
}

export { HeaderIcon as default }

type TopbarIcon =
  | { readonly kind: 'iconify'; readonly id: string; readonly color: string | undefined }
  | { readonly kind: 'image'; readonly src: string; readonly alt: string }

/**
 * Extract the `icon` field from the bundled user config module.
 *
 * @private
 * @param mod - Module imported from `@ciderpress/internal/user-config`
 * @returns The `icon` value or `undefined` when none is configured
 */
function readIconConfig(mod: unknown): IconConfig | undefined {
  if (mod === null || mod === undefined) {
    return undefined
  }
  const asRecord = mod as Record<string, unknown>
  const candidate =
    asRecord.default !== null && asRecord.default !== undefined
      ? (asRecord.default as Partial<CiderpressConfig>)
      : (mod as Partial<CiderpressConfig>)
  return candidate.icon
}

/**
 * Discriminate `IconConfig` into a render-ready shape. Iconify strings get
 * `color: undefined` (driven by ambient CSS); image objects supply alt
 * defaulted to empty string per the underlying type.
 *
 * @private
 * @param icon - Validated `IconConfig` value
 * @returns Discriminated render shape
 */
function resolveTopbar(icon: IconConfig): TopbarIcon {
  if (typeof icon === 'string') {
    return { kind: 'iconify', id: icon, color: undefined }
  }
  if (isImageIcon(icon)) {
    return { kind: 'image', src: icon.src, alt: icon.alt ?? '' }
  }
  return { kind: 'iconify', id: icon.id, color: icon.color }
}

/**
 * Build an inline-style object that sets the chip's `color` when the user
 * supplied an explicit palette colour. Iconify renders fills via
 * `currentColor` for monochrome icons, so this is enough to retint them.
 *
 * @private
 * @param color - Optional palette colour token
 * @returns Inline style object or undefined
 */
function inlineColor(color: string | undefined): React.CSSProperties | undefined {
  if (color === undefined) {
    return undefined
  }
  return { color }
}

/**
 * Type guard for the image-form `IconConfig` object.
 *
 * @private
 * @param icon - Non-string icon config value
 * @returns True when the object carries `src` (image form)
 */
function isImageIcon(icon: Exclude<IconConfig, string>): icon is IconImage {
  return 'src' in icon && typeof icon.src === 'string'
}
