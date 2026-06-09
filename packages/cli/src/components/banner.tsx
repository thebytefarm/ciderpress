import { DEFAULT_THEME_NAME, resolveBrandGradient } from '@ciderpress/theme'
import { Text } from '@kidd-cli/core/ui'
import BigText from 'ink-big-text'
import Gradient from 'ink-gradient'
import { match, P } from 'massaman/match'

type BannerFont = 'block' | 'tiny'

interface BannerSize {
  readonly font: BannerFont | 'text'
  readonly minWidth: number
  readonly letterSpacing: number
}

/**
 * Font tiers, sized so the "ciderpress" string fits at each breakpoint
 * with a few columns of breathing room. The block font appears twice
 * with different letter spacings — wider terminals get the spacious
 * variant (letterSpacing 2, ~100 cols) for breathing room, narrower
 * ones get the tight default (letterSpacing 1, ~90 cols). Below that
 * the banner drops straight to `tiny`; the `simple` font in between
 * looked off, so the system jumps directly from block to tiny.
 *
 *   block spacious (6 lines, letterSpacing 2) — ~100 cols
 *   block tight    (6 lines, letterSpacing 1) — ~90 cols
 *   tiny           (2 lines, letterSpacing 1) — ~40 cols
 *   text           (1 line) — fallback
 *
 * Ordered widest first so `pickSize` returns the first match by `minWidth`.
 */
const BANNER_SIZES: readonly BannerSize[] = [
  { font: 'block', minWidth: 100, letterSpacing: 2 },
  { font: 'block', minWidth: 90, letterSpacing: 1 },
  { font: 'tiny', minWidth: 40, letterSpacing: 1 },
  { font: 'text', minWidth: 0, letterSpacing: 1 },
]

/**
 * Props for the {@link Banner} component.
 */
export interface BannerProps {
  /**
   * Available width (in columns) for the banner to render into. The
   * banner picks the largest font tier that fits.
   */
  readonly width: number
}

/**
 * Render the ciderpress logo banner with the framework's default brand
 * gradient — currently mulled (deep cider burgundy). Picks a font tier
 * based on `width` so the banner shrinks gracefully as the terminal
 * narrows, instead of wrapping mid-glyph.
 *
 * @param props - Banner sizing
 * @returns React element with the styled ciderpress banner
 */
export function Banner(props: BannerProps): React.ReactElement {
  const colors = resolveBrandGradient(DEFAULT_THEME_NAME)
  const choice = pickSize(props.width)
  return (
    <Gradient colors={[...colors]}>
      {match(choice)
        .with({ font: 'text' }, () => <Text bold>{'ciderpress'}</Text>)
        .with({ font: P.union('block', 'tiny') }, (c) => (
          <BigText text="ciderpress" font={c.font} letterSpacing={c.letterSpacing} />
        ))
        .exhaustive()}
    </Gradient>
  )
}

/**
 * Pick the largest banner size that fits in `width` columns.
 *
 * @private
 * @param width - Available width in columns
 * @returns Size entry — last fallback (`text`) always matches at width 0
 */
function pickSize(width: number): BannerSize {
  const choice = BANNER_SIZES.find((size) => width >= size.minWidth)
  return match(choice)
    .with(P.nullish, () => BANNER_SIZES.at(-1) as BannerSize)
    .otherwise((c) => c)
}
