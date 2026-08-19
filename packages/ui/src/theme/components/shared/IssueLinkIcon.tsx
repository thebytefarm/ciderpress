import type React from 'react'

import type { IssueLinkProvider } from '../../../plugins/issue-links/remark-issue-links.ts'
import { Icon } from './icon.tsx'

const PROVIDER_ICONS = {
  asana: 'logos:asana-icon',
  bitbucket: 'devicon:bitbucket',
  clickup: 'simple-icons:clickup',
  confluence: 'devicon:confluence',
  dash0: 'simple-icons:dash0',
  datadog: 'logos:datadog',
  figma: 'devicon:figma',
  github: 'simple-icons:github',
  gitlab: 'logos:gitlab-icon',
  'google-docs': 'mdi:file-document',
  'google-drive': 'logos:google-drive',
  'google-sheets': 'mdi:google-spreadsheet',
  jira: 'devicon:jira',
  launchdarkly: 'logos:launchdarkly-icon',
  linear: 'simple-icons:linear',
  loom: 'logos:loom-icon',
  notion: 'simple-icons:notion',
  npm: 'logos:npm-icon',
  postman: 'logos:postman-icon',
  posthog: 'logos:posthog-icon',
  pulumi: 'logos:pulumi-icon',
  pagerduty: 'logos:pagerduty',
  sentry: 'simple-icons:sentry',
  slack: 'logos:slack-icon',
  trello: 'logos:trello',
  vercel: 'simple-icons:vercel',
} as const satisfies Record<IssueLinkProvider, string>

interface IssueLinkIconProps {
  readonly provider: IssueLinkProvider
}

/** Render a URL badge's provider mark through the shared Iconify pipeline. */
export default function IssueLinkIcon({ provider }: IssueLinkIconProps): React.ReactElement {
  return <Icon aria-hidden="true" className="cp-issue-link__icon" icon={PROVIDER_ICONS[provider]} />
}
