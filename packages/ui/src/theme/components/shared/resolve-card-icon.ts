/**
 * Serialized image-icon shape — what the sync engine emits when a card
 * config uses the `{ src, alt }` image form. The discriminator `kind`
 * makes the type guard trivial.
 */
export interface ResolvedCardImageIcon {
  readonly kind: 'image'
  readonly src: string
  readonly alt: string
}

/**
 * Resolved Iconify card icon — `id` plus a color rotation key.
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
 * Card-icon input shape — what flows in from the sync engine's JSON
 * output (workspaces, sections, features). Matches the `SerializedIcon`
 * union in `@ciderpress/config`, copied here so this module stays
 * dependency-free.
 */
export type CardIconInput =
  | string
  | { readonly id: string; readonly color: string }
  | { readonly kind: 'image'; readonly src: string; readonly alt: string }
  | undefined

/**
 * Resolve a unified icon-config-derived value into a discriminated icon.
 *
 * - `string` → `{ kind: 'iconify', id, color: 'purple' }`
 * - `{ id, color }` → `{ kind: 'iconify', id, color }`
 * - `{ kind: 'image', src, alt }` → pass-through
 * - `undefined` → `undefined`
 *
 * @param icon - Icon config value (string, iconify object, image object, or undefined)
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
    return { kind: 'image', src: icon.src, alt: icon.alt }
  }
  return { kind: 'iconify', id: icon.id, color: icon.color }
}
