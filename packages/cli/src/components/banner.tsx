/*
|==========================================================================
| Banner
|==========================================================================
|
| Styled ciderpress logo banner using cfonts block font with the active
| theme's brand gradient. Color stops come from `@ciderpress/theme` so the
| TUI stays in sync with the docs site and SVG assets.
|
*/

import { resolveBrandGradient } from '@ciderpress/theme'
import BigText from 'ink-big-text'
import Gradient from 'ink-gradient'

/**
 * Render the ciderpress logo banner with the canonical honeycrisp brand
 * gradient (the apple-red palette is the framework's default identity).
 *
 * @returns React element with the styled ciderpress banner
 */
export function Banner(): React.ReactElement {
  const colors = resolveBrandGradient('honeycrisp')
  return (
    <Gradient colors={[...colors]}>
      <BigText text="ciderpress" font="block" />
    </Gradient>
  )
}
