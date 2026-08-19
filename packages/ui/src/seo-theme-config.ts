import type { SeoConfig } from '@ciderpress/config'

/**
 * SEO data serialized from the Node configuration into the runtime theme.
 */
export interface SeoThemeConfig {
  readonly seo?: SeoConfig
}
