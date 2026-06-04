import { stories, withLayout } from '@kidd-cli/core/stories'
import { Box } from '@kidd-cli/core/ui'
import type React from 'react'
import { z } from 'zod'

import { Banner } from '../components/banner.tsx'

/**
 * Props for the banner story preview.
 */
type BannerPreviewProps = Record<string, unknown>

/**
 * Pure visual preview of the Banner component.
 *
 * @param _props - No configurable props
 * @returns React element rendering the banner preview
 */
function BannerPreview(_props: BannerPreviewProps): React.ReactElement {
  return (
    <Box flexDirection="column" padding={1}>
      <Banner />
    </Box>
  )
}

const schema = z.object({})

/**
 * Stories for the Banner component.
 */
export default stories<BannerPreviewProps>({
  title: 'Banner',
  component: BannerPreview,
  schema,
  defaults: {},
  decorators: [withLayout({ width: 80, padding: 0 })],
  stories: {
    Default: {
      props: {},
      description: 'ciderpress logo banner with mulled brand-burgundy gradient',
    },
  },
})
