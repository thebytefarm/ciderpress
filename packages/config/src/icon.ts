import { isNil, isString } from 'massaman/predicate'

import type {
  IconConfig as ConfigIconConfig,
  IconColor as ConfigIconColor,
  IconImage,
} from './types.ts'

export type { IconConfig, IconColor, IconImage } from './types.ts'

/**
 * Normalized Iconify icon — `id` plus a colour rotation key.
 */
export interface ResolvedIconifyIcon {
  readonly kind: 'iconify'
  readonly id: string
  readonly color: ConfigIconColor
}

/**
 * Normalized image icon — `src` plus optional alt text.
 */
export interface ResolvedImageIcon {
  readonly kind: 'image'
  readonly src: string
  readonly alt: string
}

/**
 * Discriminated union of resolved icon variants. Render sites switch
 * on `kind` to decide between an Iconify `<Icon>` and an `<img>`.
 */
export type ResolvedIcon = ResolvedIconifyIcon | ResolvedImageIcon

/**
 * Serialized icon shape — what gets written to the sync engine's JSON
 * output and consumed by React components at render time. The image
 * form carries a `kind: 'image'` discriminator so the consumer doesn't
 * have to re-sniff `src`.
 */
export type SerializedIcon =
  | string
  | { readonly id: string; readonly color: string }
  | { readonly kind: 'image'; readonly src: string; readonly alt: string }

/**
 * Normalize an `IconConfig` value into a `ResolvedIcon`.
 *
 * - String → `{ kind: 'iconify', id, color: 'purple' }`
 * - Iconify object → `{ kind: 'iconify', id, color }` (color defaults to purple)
 * - Image object → `{ kind: 'image', src, alt }`
 *
 * @param icon - Icon config value
 * @returns Normalized discriminated icon
 */
export function resolveIcon(icon: ConfigIconConfig): ResolvedIcon {
  if (isString(icon)) {
    return { kind: 'iconify', id: icon, color: 'purple' }
  }
  if (isImageIcon(icon)) {
    return { kind: 'image', src: icon.src, alt: icon.alt ?? '' }
  }
  return { kind: 'iconify', id: icon.id, color: icon.color ?? 'purple' }
}

/**
 * Normalize an optional `IconConfig` value into a `ResolvedIcon | undefined`.
 *
 * Returns `undefined` when `icon` is `undefined`.
 *
 * @param icon - Optional icon config value
 * @returns Normalized icon, or `undefined`
 */
export function resolveOptionalIcon(icon: ConfigIconConfig | undefined): ResolvedIcon | undefined {
  if (isNil(icon)) {
    return undefined
  }
  return resolveIcon(icon)
}

/**
 * Serialize a `ResolvedIcon` for JSON output consumed by render-side
 * components.
 *
 * - Iconify with the default purple → just the icon id string (back-compat shape).
 * - Iconify with a non-default color → `{ id, color }`.
 * - Image → `{ kind: 'image', src, alt }`.
 * - `undefined` → `undefined`.
 *
 * @param resolved - Resolved icon, or `undefined`
 * @returns Serialized icon ready to embed in JSON, or `undefined`
 */
export function serializeIcon(resolved: ResolvedIcon | undefined): SerializedIcon | undefined {
  if (resolved === undefined) {
    return undefined
  }
  if (resolved.kind === 'image') {
    return { kind: 'image', src: resolved.src, alt: resolved.alt }
  }
  if (resolved.color === 'purple') {
    return resolved.id
  }
  return { id: resolved.id, color: resolved.color }
}

/**
 * Type guard for the image-form `IconConfig` object.
 *
 * @private
 * @param icon - Non-string icon config value
 * @returns True when the object has an `src` field (image form)
 */
function isImageIcon(icon: Exclude<ConfigIconConfig, string>): icon is IconImage {
  return 'src' in icon && typeof icon.src === 'string'
}
