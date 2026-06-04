import { DEFAULT_THEME_NAME, resolveBrandGradient } from '@ciderpress/theme'
import BigText from 'ink-big-text'
import Gradient from 'ink-gradient'

/**
 * Render the ciderpress logo banner with the framework's default brand
 * gradient — currently mulled (deep cider burgundy).
 *
 * @returns React element with the styled ciderpress banner
 */
export function Banner(): React.ReactElement {
  const colors = resolveBrandGradient(DEFAULT_THEME_NAME)
  return (
    <Gradient colors={[...colors]}>
      <BigText text="ciderpress" font="block" />
    </Gradient>
  )
}
