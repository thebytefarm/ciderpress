import { match } from 'massaman/match'
import type React from 'react'

import { Icon } from './icon'
import type { ResolvedCardIcon } from './resolve-card-icon'

interface CardIconProps {
  readonly resolved: ResolvedCardIcon
  readonly className?: string
}

/**
 * Card-surface icon renderer. Branches on the discriminated
 * `ResolvedCardIcon`:
 *
 * - `kind: 'iconify'` → `<Icon icon={id} />` wrapped in a colour swatch.
 * - `kind: 'image'`   → `<img src alt>` painted at the same chip size
 *   without colour tinting (the image carries its own art direction).
 *
 * @param props - Resolved icon + optional className applied to the swatch wrapper
 * @returns Branded icon element
 */
export function CardIcon(props: CardIconProps): React.ReactElement {
  const wrapperClass = props.className ?? 'cp-card__icon'
  return match(props.resolved)
    .with({ kind: 'iconify' }, (r) => (
      <span className={`${wrapperClass} ${wrapperClass}--${r.color}`}>
        <Icon icon={r.id} />
      </span>
    ))
    .with({ kind: 'image' }, (r) => (
      <span className={`${wrapperClass} ${wrapperClass}--image`}>
        <img src={r.src} alt={r.alt} className={`${wrapperClass}-img`} />
      </span>
    ))
    .exhaustive()
}
