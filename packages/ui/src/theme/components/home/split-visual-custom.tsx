import type { HomeSplitVisual, HomeSplitVisualImage } from '@ciderpress/config'
import { CodeBlockRuntime } from '@rspress/core/theme'
import { match } from 'massaman/match'
import type React from 'react'

import { withMountBase } from '../../lib/with-mount-base.ts'

interface CustomSplitVisualProps {
  readonly visual: HomeSplitVisual
}

/**
 * Custom Split visual — renders the user-supplied {@link HomeSplitVisual}
 * in the Split section's opposite column. Two structural variants:
 *
 * - **Code** (`{ code, language? }`) — rendered through Rspress's native
 *   `CodeBlockRuntime`, the same Shiki pipeline that highlights markdown
 *   code fences, so it themes identically to the rest of the site.
 * - **Image** (`{ src, alt?, width?, height? }`) — a screenshot or graphic,
 *   base-prefixed via {@link withMountBase} to survive a mounted `base`.
 *
 * The discriminator is structural: code objects carry `code`, image
 * objects carry `src`.
 *
 * @param props - Validated split visual config
 * @returns Highlighted code block or image element
 */
export function CustomSplitVisual(props: CustomSplitVisualProps): React.ReactElement {
  return match(props.visual)
    .when(
      (v): v is HomeSplitVisualImage => 'src' in v,
      (v) => (
        <img
          src={withMountBase(v.src)}
          alt={v.alt ?? ''}
          width={v.width}
          height={v.height}
          className="cp-split__img"
        />
      )
    )
    .otherwise((v) => <CodeBlockRuntime lang={v.language ?? 'ts'} code={v.code} />)
}
