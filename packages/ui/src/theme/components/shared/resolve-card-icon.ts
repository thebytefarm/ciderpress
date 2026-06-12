import type { SerializedIcon } from '@ciderpress/config'

/**
 * Render-ready image icon — `src` plus `alt`.
 */
export interface ResolvedCardImageIcon {
  readonly kind: 'image'
  readonly src: string
  readonly alt: string
}

/**
 * Render-ready Iconify icon — `id` plus a colour-rotation key.
 */
export interface ResolvedCardIconifyIcon {
  readonly kind: 'iconify'
  readonly id: string
  readonly color: string
}

/**
 * Discriminated union of resolved card-icon variants. Render sites
 * switch on `kind` to decide between an Iconify `<Icon>` and an `<img>`.
 */
export type ResolvedCardIcon = ResolvedCardIconifyIcon | ResolvedCardImageIcon

/**
 * Card-icon input shape — the `SerializedIcon` shape emitted by the
 * sync engine (workspaces, sections, features), re-exported here under
 * a local alias to keep render-site call signatures readable. Always
 * comes from `@ciderpress/config` — there is no separate source of
 * truth.
 */
export type CardIconInput = SerializedIcon | undefined

/**
 * Resolve a serialized icon value into a discriminated icon ready for
 * render.
 *
 * - `string` → `{ kind: 'iconify', id, color: 'purple' }`
 * - `{ id, color }` → `{ kind: 'iconify', id, color }`
 * - `{ kind: 'image', src, alt }` → pass-through
 * - `undefined` → `undefined`
 *
 * @param icon - Serialized icon value or `undefined`
 * @returns Discriminated resolved icon, or `undefined`
 */
export function resolveCardIcon(icon: CardIconInput): ResolvedCardIcon | undefined {
  if (icon === undefined) {
    return undefined
  }
  if (typeof icon === 'string') {
    return { kind: 'iconify', id: icon, color: 'purple' }
  }
  if ('kind' in icon) {
    // Defence-in-depth: even if a downstream caller hand-builds the
    // object and forgets `alt`, fall back to an empty string so React
    // never sees `alt={undefined}` (which silences screen readers).
    return { kind: 'image', src: icon.src, alt: icon.alt ?? '' }
  }
  return { kind: 'iconify', id: icon.id, color: icon.color }
}
