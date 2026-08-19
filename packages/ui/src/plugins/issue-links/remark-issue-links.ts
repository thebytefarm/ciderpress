import { match } from 'massaman/match'
import { visit } from 'unist-util-visit'

/** A recognized issue-provider URL and its normalized badge metadata. */
export type IssueLink =
  | IssueLinkBase<'asana', 'task'>
  | IssueLinkBase<'bitbucket', 'commit' | 'issue' | 'pull'>
  | IssueLinkBase<'confluence', 'page'>
  | IssueLinkBase<'clickup', 'task'>
  | IssueLinkBase<'dash0', 'dashboard' | 'logs' | 'service' | 'trace'>
  | IssueLinkBase<'datadog', 'dashboard' | 'monitor'>
  | IssueLinkBase<'figma', 'design' | 'file' | 'prototype' | 'whiteboard'>
  | IssueLinkBase<'github', 'action' | 'commit' | 'discussion' | 'issue' | 'pull' | 'release'>
  | IssueLinkBase<'gitlab', 'commit' | 'issue' | 'merge' | 'release'>
  | IssueLinkBase<'google-docs', 'document'>
  | IssueLinkBase<'google-drive', 'file'>
  | IssueLinkBase<'google-sheets', 'spreadsheet'>
  | IssueLinkBase<'jira', 'issue'>
  | IssueLinkBase<'linear', 'issue'>
  | IssueLinkBase<'launchdarkly', 'flag'>
  | IssueLinkBase<'loom', 'video'>
  | IssueLinkBase<'notion', 'page'>
  | IssueLinkBase<'npm', 'package'>
  | IssueLinkBase<'postman', 'collection' | 'workspace'>
  | IssueLinkBase<'posthog', 'feature-flag' | 'insight' | 'recording'>
  | IssueLinkBase<'pulumi', 'stack'>
  | IssueLinkBase<'pagerduty', 'incident'>
  | IssueLinkBase<'sentry', 'issue'>
  | IssueLinkBase<'slack', 'message'>
  | IssueLinkBase<'trello', 'card'>
  | IssueLinkBase<'vercel', 'project'>

/** Provider names recognized by the URL badge parser and rendered by the shared icon component. */
export type IssueLinkProvider = IssueLink['provider']

interface IssueLinkBase<Provider extends string, Kind extends string> {
  readonly provider: Provider
  readonly kind: Kind
  readonly label: string
  readonly reference: string | null
  readonly title: string
}

interface LinkNode {
  readonly type: 'link'
  readonly url: string
  children: readonly MarkdownInlineNode[]
  data?: Record<string, unknown>
}

interface MarkdownInlineNode {
  readonly type: string
  readonly value?: string
  readonly name?: string
  readonly attributes?: readonly Record<string, unknown>[]
  readonly children?: readonly MarkdownInlineNode[]
}

interface ResolveLabelParams {
  readonly issue: IssueLink
  readonly node: LinkNode
}

interface BadgeLabel {
  readonly text: string
  readonly reference: string | null
}

interface NumberedGitHubLinkParams {
  readonly owner: string
  readonly repo: string
  readonly identifier: string
  readonly kind: 'discussion' | 'issue' | 'pull'
}

interface NumberedLinkParams {
  readonly provider: 'bitbucket' | 'gitlab'
  readonly kind: 'issue' | 'merge' | 'pull'
  readonly identifier: string
}

interface CommitLinkParams {
  readonly provider: 'bitbucket' | 'github' | 'gitlab'
  readonly owner: string
  readonly repo: string
  readonly identifier: string
}

interface GitHubNestedLinkParams {
  readonly owner: string
  readonly repo: string
  readonly segments: readonly string[]
}

type OpaqueProvider =
  | 'dash0'
  | 'datadog'
  | 'confluence'
  | 'figma'
  | 'google-docs'
  | 'google-drive'
  | 'google-sheets'
  | 'loom'
  | 'notion'
  | 'postman'
  | 'posthog'
  | 'slack'
  | 'trello'
  | 'vercel'

type WithoutLinkMetadata<Link> = Link extends IssueLink ? Omit<Link, 'reference' | 'title'> : never

type OpaqueLinkParams = WithoutLinkMetadata<Extract<IssueLink, { provider: OpaqueProvider }>>

const VERCEL_RESERVED_ROUTES = new Set([
  'account',
  'ai',
  'blog',
  'changelog',
  'contact',
  'customers',
  'dashboard',
  'design',
  'docs',
  'enterprise',
  'guides',
  'integrations',
  'login',
  'marketplace',
  'new',
  'oss',
  'partners',
  'pricing',
  'resources',
  'security',
  'signup',
  'solutions',
  'templates',
])

/**
 * Recognize canonical resource URLs whose provider and identifier are encoded in the URL.
 *
 * @param value - Absolute URL from a Markdown link node
 * @returns Normalized badge metadata, or `null` when the URL is not supported
 */
export function parseIssueLink(value: string): IssueLink | null {
  if (!URL.canParse(value)) {
    return null
  }

  const url = new URL(value)
  if (url.protocol !== 'https:') {
    return null
  }

  const segments = url.pathname.split('/').filter(Boolean)
  const known = match(url.hostname)
    .with('github.com', () => parseGitHubLink(segments))
    .with('www.github.com', () => parseGitHubLink(segments))
    .with('gitlab.com', () => parseGitLabLink(segments))
    .with('www.gitlab.com', () => parseGitLabLink(segments))
    .with('bitbucket.org', () => parseBitbucketLink(segments))
    .with('www.npmjs.com', () => parseNpmLink(segments))
    .with('npmjs.com', () => parseNpmLink(segments))
    .with('linear.app', () => parseLinearLink(segments))
    .with('app.clickup.com', () => parseClickUpLink(segments))
    .with('app.dash0.com', () => parseDash0Link({ segments, url }))
    .with('app.launchdarkly.com', () => parseLaunchDarklyLink(segments))
    .with('app.posthog.com', () => parsePostHogLink(segments))
    .with('eu.posthog.com', () => parsePostHogLink(segments))
    .with('app.pulumi.com', () => parsePulumiLink(segments))
    .with('vercel.com', () => parseVercelLink(segments))
    .with('www.figma.com', () => parseFigmaLink(segments))
    .with('figma.com', () => parseFigmaLink(segments))
    .with('docs.google.com', () => parseGoogleDocsLink(segments))
    .with('drive.google.com', () => parseGoogleDriveLink(segments))
    .with('trello.com', () => parseTrelloLink(segments))
    .with('www.trello.com', () => parseTrelloLink(segments))
    .with('app.asana.com', () => parseAsanaLink(segments))
    .with('www.loom.com', () => parseLoomLink(segments))
    .with('loom.com', () => parseLoomLink(segments))
    .with('www.postman.com', () => parsePostmanLink(segments))
    .with('postman.com', () => parsePostmanLink(segments))
    .when(
      (hostname) => hostname.endsWith('.atlassian.net'),
      () => parseAtlassianLink(segments)
    )
    .when(isNotionHostname, () => parseNotionLink(segments))
    .when(isDatadogHostname, () => parseDatadogLink(segments))
    .when(isPagerDutyHostname, () => parsePagerDutyLink(segments))
    .when(isSlackHostname, () => parseSlackLink(segments))
    .when(isSentryHostname, () => parseSentryLink(segments))
    .otherwise(() => null)
  return known
}

/** Parse a ClickUp task URL. @private */
function parseClickUpLink(segments: readonly string[]): IssueLink | null {
  const [resource, identifier] = segments
  if (resource !== 't' || identifier === undefined) {
    return null
  }
  return {
    provider: 'clickup',
    kind: 'task',
    label: `Task ${identifier}`,
    reference: identifier,
    title: `Task ${identifier} on ClickUp`,
  }
}

/** Parse a Dash0 deeplink. @private */
function parseDash0Link({
  segments,
  url,
}: {
  readonly segments: readonly string[]
  readonly url: URL
}): IssueLink | null {
  const [marker, resource, view] = segments
  if (marker !== 'goto' || resource === undefined) {
    return null
  }
  return match({ resource, view })
    .with({ resource: 'dashboards' }, () =>
      opaqueLink({ provider: 'dash0', kind: 'dashboard', label: 'Dash0 dashboard' })
    )
    .with({ resource: 'logs' }, () =>
      opaqueLink({ provider: 'dash0', kind: 'logs', label: 'Dash0 logs' })
    )
    .with({ resource: 'services' }, () =>
      opaqueLink({ provider: 'dash0', kind: 'service', label: 'Dash0 service' })
    )
    .when(
      ({ resource: area }) => area === 'traces' && url.searchParams.has('traceid'),
      () => opaqueLink({ provider: 'dash0', kind: 'trace', label: 'Dash0 trace' })
    )
    .otherwise(() => null)
}

/** Parse a Datadog dashboard or monitor URL. @private */
function parseDatadogLink(segments: readonly string[]): IssueLink | null {
  const [resource, identifier] = segments
  if (identifier === undefined) {
    return null
  }
  return match(resource)
    .with('dashboard', () =>
      opaqueLink({ provider: 'datadog', kind: 'dashboard', label: 'Datadog dashboard' })
    )
    .with('monitors', () =>
      opaqueLink({ provider: 'datadog', kind: 'monitor', label: 'Datadog monitor' })
    )
    .otherwise(() => null)
}

/** Parse a LaunchDarkly feature flag URL. @private */
function parseLaunchDarklyLink(segments: readonly string[]): IssueLink | null {
  const [projects, project, flags, identifier] = segments
  if (
    projects !== 'projects' ||
    project === undefined ||
    flags !== 'flags' ||
    identifier === undefined
  ) {
    return null
  }
  return {
    provider: 'launchdarkly',
    kind: 'flag',
    label: `Flag ${identifier}`,
    reference: identifier,
    title: `Flag ${identifier} in ${project} on LaunchDarkly`,
  }
}

/** Parse a PostHog insight, recording, or feature flag URL. @private */
function parsePostHogLink(segments: readonly string[]): IssueLink | null {
  const [projectMarker, project, resource, identifier] = segments
  if (projectMarker !== 'project' || project === undefined || resource === undefined) {
    return null
  }
  return match(resource)
    .with('insights', () =>
      opaqueLink({ provider: 'posthog', kind: 'insight', label: 'PostHog insight' })
    )
    .with('replay', () =>
      opaqueLink({ provider: 'posthog', kind: 'recording', label: 'PostHog recording' })
    )
    .when(
      (value) => value === 'feature_flags' && identifier !== undefined,
      () => opaqueLink({ provider: 'posthog', kind: 'feature-flag', label: 'PostHog flag' })
    )
    .otherwise(() => null)
}

/** Parse a Pulumi Cloud stack URL. @private */
function parsePulumiLink(segments: readonly string[]): IssueLink | null {
  const [organization, project, stack] = segments
  if (organization === undefined || project === undefined || stack === undefined) {
    return null
  }
  return {
    provider: 'pulumi',
    kind: 'stack',
    label: `Stack ${stack}`,
    reference: stack,
    title: `Stack ${organization}/${project}/${stack} on Pulumi`,
  }
}

/** Parse a PagerDuty incident URL. @private */
function parsePagerDutyLink(segments: readonly string[]): IssueLink | null {
  const [resource, identifier] = segments
  if (resource !== 'incidents' || identifier === undefined) {
    return null
  }
  return {
    provider: 'pagerduty',
    kind: 'incident',
    label: `Incident ${identifier}`,
    reference: identifier,
    title: `Incident ${identifier} on PagerDuty`,
  }
}

/** Parse a Vercel project dashboard URL. @private */
function parseVercelLink(segments: readonly string[]): IssueLink | null {
  const [team, project] = segments
  if (team === undefined || project === undefined || VERCEL_RESERVED_ROUTES.has(team)) {
    return null
  }
  return opaqueLink({ provider: 'vercel', kind: 'project', label: 'Vercel project' })
}

/**
 * Turn recognized issue-provider links into icon-bearing badge anchors.
 *
 * @returns Unified transformer for the Rspress remark pipeline
 */
export function remarkIssueLinks(): (tree: unknown) => void {
  return (tree: unknown) => {
    visit(tree as Parameters<typeof visit>[0], 'link', (node: LinkNode) => {
      const issue = parseIssueLink(node.url)
      if (issue === null) {
        return
      }

      const label = resolveLabel({ issue, node })
      const data = node.data ?? {}
      const properties = readHProperties(data)
      node.children = buildBadgeChildren({ provider: issue.provider, label })
      node.data = {
        ...data,
        hProperties: {
          ...properties,
          className: [
            ...readClassNames(properties.className),
            'cp-issue-link',
            `cp-issue-link--${issue.provider}`,
          ],
          title: issue.title,
        },
      }
    })
  }
}

/** Build the MDX children for a provider badge. @private */
function buildBadgeChildren({
  provider,
  label,
}: {
  readonly provider: IssueLink['provider']
  readonly label: BadgeLabel
}): readonly MarkdownInlineNode[] {
  return [
    {
      type: 'mdxJsxTextElement',
      name: 'IssueLinkIcon',
      attributes: [{ type: 'mdxJsxAttribute', name: 'provider', value: provider }],
      children: [],
    },
    { type: 'text', value: label.text },
    ...buildReferenceChildren(label.reference),
  ]
}

/** Parse a canonical GitHub resource path. @private */
function parseGitHubLink(segments: readonly string[]): IssueLink | null {
  const [owner, repo, resource, identifier] = segments
  if (owner === undefined || repo === undefined || identifier === undefined) {
    return null
  }

  return match(resource)
    .when(
      (value) => value === 'issues' && isNumericIdentifier(identifier),
      () => numberedGitHubLink({ owner, repo, identifier, kind: 'issue' })
    )
    .when(
      (value) => value === 'pull' && isNumericIdentifier(identifier),
      () => numberedGitHubLink({ owner, repo, identifier, kind: 'pull' })
    )
    .when(
      (value) => value === 'discussions' && isNumericIdentifier(identifier),
      () => numberedGitHubLink({ owner, repo, identifier, kind: 'discussion' })
    )
    .when(
      (value) => value === 'commit' && /^[a-f\d]{7,64}$/i.test(identifier),
      () => commitLink({ provider: 'github', owner, repo, identifier })
    )
    .with('releases', () => parseGitHubRelease({ owner, repo, segments }))
    .with('actions', () => parseGitHubAction({ owner, repo, segments }))
    .otherwise(() => null)
}

/** Parse GitLab issues, merge requests, commits, and releases. @private */
function parseGitLabLink(segments: readonly string[]): IssueLink | null {
  const divider = segments.indexOf('-')
  if (divider < 1) {
    return null
  }
  const resource = segments.at(divider + 1)
  const identifier = segments.at(divider + 2)
  if (resource === undefined || identifier === undefined) {
    return null
  }
  return match(resource)
    .with('issues', () => numberedLink({ provider: 'gitlab', kind: 'issue', identifier }))
    .with('merge_requests', () => numberedLink({ provider: 'gitlab', kind: 'merge', identifier }))
    .with('commit', () => commitLink({ provider: 'gitlab', owner: '', repo: '', identifier }))
    .with('releases', () => ({
      provider: 'gitlab' as const,
      kind: 'release' as const,
      label: `Release ${identifier}`,
      reference: identifier,
      title: `Release ${identifier} on GitLab`,
    }))
    .otherwise(() => null)
}

/** Parse Bitbucket Cloud issues, pull requests, and commits. @private */
function parseBitbucketLink(segments: readonly string[]): IssueLink | null {
  const [owner, repo, resource, identifier] = segments
  if (owner === undefined || repo === undefined || identifier === undefined) {
    return null
  }
  return match(resource)
    .with('issues', () => numberedLink({ provider: 'bitbucket', kind: 'issue', identifier }))
    .with('pull-requests', () => numberedLink({ provider: 'bitbucket', kind: 'pull', identifier }))
    .with('commits', () => commitLink({ provider: 'bitbucket', owner, repo, identifier }))
    .otherwise(() => null)
}

/**
 * Prefer an authored Markdown label and fall back to URL-derived metadata for bare links.
 *
 * @private
 * @param params - Recognized issue metadata and its source Markdown link
 * @returns Plain badge label
 */
function resolveLabel({ issue, node }: ResolveLabelParams): BadgeLabel {
  const authored = node.children.map(readInlineText).join('').trim()
  if (authored.length === 0 || authored === node.url) {
    return { text: issue.label, reference: null }
  }
  return { text: authored, reference: issue.reference }
}

/** Read existing HAST properties without trusting an arbitrary data value. @private */
function readHProperties(data: Record<string, unknown>): Record<string, unknown> {
  const properties = data.hProperties
  if (typeof properties !== 'object' || properties === null || Array.isArray(properties)) {
    return {}
  }
  return properties as Record<string, unknown>
}

/** Normalize an existing HAST class value to a string list. @private */
function readClassNames(value: unknown): readonly string[] {
  if (typeof value === 'string') {
    return value.split(/\s+/).filter(Boolean)
  }
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((entry): entry is string => typeof entry === 'string')
}

/** Return whether a URL identifier is a positive integer string. @private */
function isNumericIdentifier(identifier: string): boolean {
  return /^\d+$/.test(identifier)
}

/** Build the nested reference capsule when an authored label is present. @private */
function buildReferenceChildren(reference: string | null): readonly MarkdownInlineNode[] {
  if (reference === null) {
    return []
  }
  return [
    {
      type: 'mdxJsxTextElement',
      name: 'span',
      attributes: [
        { type: 'mdxJsxAttribute', name: 'className', value: 'cp-issue-link__reference' },
      ],
      children: [{ type: 'text', value: reference }],
    },
  ]
}

/**
 * Flatten Markdown inline content into the plain text suitable for a compact badge.
 *
 * @private
 * @param node - Markdown inline node
 * @returns Visible text from the node and its descendants
 */
function readInlineText(node: MarkdownInlineNode): string {
  if (node.value !== undefined) {
    return node.value
  }
  if (node.children === undefined) {
    return ''
  }
  return node.children.map(readInlineText).join('')
}

/** Parse a canonical Linear issue path. @private */
function parseLinearLink(segments: readonly string[]): IssueLink | null {
  const [workspace, resource, identifier] = segments
  if (workspace === undefined || resource !== 'issue' || identifier === undefined) {
    return null
  }
  if (!/^[A-Z][A-Z0-9]+-\d+$/i.test(identifier)) {
    return null
  }

  const label = identifier.toUpperCase()
  return {
    provider: 'linear',
    kind: 'issue',
    label,
    reference: label,
    title: `${label} in ${workspace} on Linear`,
  }
}

/** Parse a canonical Jira Cloud issue path. @private */
function parseJiraLink(segments: readonly string[]): IssueLink | null {
  const [resource, identifier] = segments
  if (segments.length !== 2 || resource !== 'browse' || identifier === undefined) {
    return null
  }
  if (!/^[A-Z][A-Z0-9]+-\d+$/i.test(identifier)) {
    return null
  }

  const label = identifier.toUpperCase()
  return {
    provider: 'jira',
    kind: 'issue',
    label,
    reference: label,
    title: `${label} on Jira`,
  }
}

/** Parse an npm package page. @private */
function parseNpmLink(segments: readonly string[]): IssueLink | null {
  const [resource, ...nameParts] = segments
  const packageName = nameParts.join('/')
  if (resource !== 'package' || packageName.length === 0 || nameParts.length > 2) {
    return null
  }
  return {
    provider: 'npm',
    kind: 'package',
    label: packageName,
    reference: 'npm',
    title: `${packageName} on npm`,
  }
}

/** Parse a Figma design, file, prototype, or FigJam board. @private */
function parseFigmaLink(segments: readonly string[]): IssueLink | null {
  const [resource, key] = segments
  if (key === undefined) {
    return null
  }
  return match(resource)
    .with('design', () => opaqueLink({ provider: 'figma', kind: 'design', label: 'Figma design' }))
    .with('file', () => opaqueLink({ provider: 'figma', kind: 'file', label: 'Figma file' }))
    .with('proto', () =>
      opaqueLink({ provider: 'figma', kind: 'prototype', label: 'Figma prototype' })
    )
    .with('board', () =>
      opaqueLink({ provider: 'figma', kind: 'whiteboard', label: 'FigJam board' })
    )
    .otherwise(() => null)
}

/** Parse Google Docs and Sheets resource URLs. @private */
function parseGoogleDocsLink(segments: readonly string[]): IssueLink | null {
  const [resource, marker, identifier] = segments
  if (marker !== 'd' || identifier === undefined) {
    return null
  }
  return match(resource)
    .with('document', () =>
      opaqueLink({
        provider: 'google-docs',
        kind: 'document',
        label: 'Google Doc',
      })
    )
    .with('spreadsheets', () =>
      opaqueLink({
        provider: 'google-sheets',
        kind: 'spreadsheet',
        label: 'Google Sheet',
      })
    )
    .otherwise(() => null)
}

/** Parse a Google Drive file URL. @private */
function parseGoogleDriveLink(segments: readonly string[]): IssueLink | null {
  const [resource, marker, identifier] = segments
  if (resource !== 'file' || marker !== 'd' || identifier === undefined) {
    return null
  }
  return opaqueLink({ provider: 'google-drive', kind: 'file', label: 'Drive file' })
}

/** Parse a Trello card URL. @private */
function parseTrelloLink(segments: readonly string[]): IssueLink | null {
  const [resource, identifier] = segments
  if (resource !== 'c' || identifier === undefined) {
    return null
  }
  return opaqueLink({ provider: 'trello', kind: 'card', label: 'Trello card' })
}

/** Parse an Asana task URL. @private */
function parseAsanaLink(segments: readonly string[]): IssueLink | null {
  const [workspace, project, identifier] = segments
  if (workspace !== '0' || project === undefined || identifier === undefined) {
    return null
  }
  return {
    provider: 'asana',
    kind: 'task',
    label: `Task ${identifier}`,
    reference: identifier,
    title: `Task ${identifier} on Asana`,
  }
}

/** Parse a Loom share URL. @private */
function parseLoomLink(segments: readonly string[]): IssueLink | null {
  const [resource, identifier] = segments
  if (resource !== 'share' || identifier === undefined) {
    return null
  }
  return opaqueLink({ provider: 'loom', kind: 'video', label: 'Loom video' })
}

/** Parse Postman workspace and collection URLs. @private */
function parsePostmanLink(segments: readonly string[]): IssueLink | null {
  return match(segments)
    .when(
      (path) => path.includes('workspace'),
      () => opaqueLink({ provider: 'postman', kind: 'workspace', label: 'Postman workspace' })
    )
    .when(
      (path) => path.includes('collection') || path.includes('collections'),
      () => opaqueLink({ provider: 'postman', kind: 'collection', label: 'Postman collection' })
    )
    .otherwise(() => null)
}

/** Parse Jira or Confluence URLs hosted on Atlassian Cloud. @private */
function parseAtlassianLink(segments: readonly string[]): IssueLink | null {
  const jira = parseJiraLink(segments)
  return match({ jira, segments })
    .when(
      ({ jira: parsed }) => parsed !== null,
      ({ jira: parsed }) => parsed
    )
    .when(
      ({ segments: path }) => path.at(0) === 'wiki',
      ({ segments: path }) => parseConfluenceLink(path)
    )
    .otherwise(() => null)
}

/** Parse a Confluence Cloud page path. @private */
function parseConfluenceLink(segments: readonly string[]): IssueLink {
  const pagesIndex = segments.indexOf('pages')
  const identifier = segments.at(pagesIndex + 1)
  return match(identifier)
    .when(
      (value) => value !== undefined,
      (value) => ({
        provider: 'confluence' as const,
        kind: 'page' as const,
        label: `Page ${value}`,
        reference: value,
        title: `Page ${value} on Confluence`,
      })
    )
    .otherwise(() => opaqueLink({ provider: 'confluence', kind: 'page', label: 'Confluence page' }))
}

/** Parse a Slack message permalink. @private */
function parseSlackLink(segments: readonly string[]): IssueLink | null {
  const [resource, channel, timestamp] = segments
  if (resource !== 'archives' || channel === undefined || timestamp === undefined) {
    return null
  }
  return opaqueLink({ provider: 'slack', kind: 'message', label: 'Slack message' })
}

/** Parse a Sentry issue permalink. @private */
function parseSentryLink(segments: readonly string[]): IssueLink | null {
  const issueIndex = segments.indexOf('issues')
  const identifier = segments.at(issueIndex + 1)
  if (issueIndex === -1 || identifier === undefined) {
    return null
  }
  return {
    provider: 'sentry',
    kind: 'issue',
    label: `Issue #${identifier}`,
    reference: `#${identifier}`,
    title: `Issue #${identifier} on Sentry`,
  }
}

/** Build a numbered GitHub resource badge. @private */
function numberedGitHubLink({
  owner,
  repo,
  identifier,
  kind,
}: NumberedGitHubLinkParams): IssueLink {
  return match(kind)
    .with('issue', () => ({
      provider: 'github' as const,
      kind,
      label: `Issue #${identifier}`,
      reference: `#${identifier}`,
      title: `Issue #${identifier} in ${owner}/${repo} on GitHub`,
    }))
    .with('pull', () => ({
      provider: 'github' as const,
      kind,
      label: `Pull #${identifier}`,
      reference: `#${identifier}`,
      title: `Pull #${identifier} in ${owner}/${repo} on GitHub`,
    }))
    .with('discussion', () => ({
      provider: 'github' as const,
      kind,
      label: `Discussion #${identifier}`,
      reference: `#${identifier}`,
      title: `Discussion #${identifier} in ${owner}/${repo} on GitHub`,
    }))
    .exhaustive()
}

/** Build a numbered GitLab or Bitbucket resource badge. @private */
function numberedLink({ provider, kind, identifier }: NumberedLinkParams): IssueLink | null {
  return match({ provider, kind })
    .with({ provider: 'gitlab', kind: 'issue' }, () => ({
      provider: 'gitlab' as const,
      kind: 'issue' as const,
      label: `Issue #${identifier}`,
      reference: `#${identifier}`,
      title: `Issue #${identifier} on GitLab`,
    }))
    .with({ provider: 'gitlab', kind: 'merge' }, () => ({
      provider: 'gitlab' as const,
      kind: 'merge' as const,
      label: `Merge #${identifier}`,
      reference: `#${identifier}`,
      title: `Merge request #${identifier} on GitLab`,
    }))
    .with({ provider: 'bitbucket', kind: 'issue' }, () => ({
      provider: 'bitbucket' as const,
      kind: 'issue' as const,
      label: `Issue #${identifier}`,
      reference: `#${identifier}`,
      title: `Issue #${identifier} on Bitbucket`,
    }))
    .with({ provider: 'bitbucket', kind: 'pull' }, () => ({
      provider: 'bitbucket' as const,
      kind: 'pull' as const,
      label: `Pull #${identifier}`,
      reference: `#${identifier}`,
      title: `Pull request #${identifier} on Bitbucket`,
    }))
    .otherwise(() => null)
}

/** Build a commit badge using the short hash visible in the URL. @private */
function commitLink({ provider, owner, repo, identifier }: CommitLinkParams): IssueLink {
  const shortHash = identifier.slice(0, 7)
  const repository = repositoryLabel({ owner, repo })
  return match(provider)
    .with('github', () => ({
      provider,
      kind: 'commit' as const,
      label: `Commit ${shortHash}`,
      reference: shortHash,
      title: `Commit ${shortHash}${repository} on GitHub`,
    }))
    .with('gitlab', () => ({
      provider,
      kind: 'commit' as const,
      label: `Commit ${shortHash}`,
      reference: shortHash,
      title: `Commit ${shortHash} on GitLab`,
    }))
    .with('bitbucket', () => ({
      provider,
      kind: 'commit' as const,
      label: `Commit ${shortHash}`,
      reference: shortHash,
      title: `Commit ${shortHash}${repository} on Bitbucket`,
    }))
    .exhaustive()
}

/** Build the repository portion of a commit tooltip. @private */
function repositoryLabel({ owner, repo }: Pick<CommitLinkParams, 'owner' | 'repo'>): string {
  if (owner.length === 0 || repo.length === 0) {
    return ''
  }
  return ` in ${owner}/${repo}`
}

/** Parse a GitHub release tag URL. @private */
function parseGitHubRelease({ owner, repo, segments }: GitHubNestedLinkParams): IssueLink | null {
  const [tagMarker, identifier] = segments.slice(3)
  if (tagMarker !== 'tag' || identifier === undefined) {
    return null
  }
  return {
    provider: 'github',
    kind: 'release',
    label: `Release ${identifier}`,
    reference: identifier,
    title: `Release ${identifier} in ${owner}/${repo} on GitHub`,
  }
}

/** Parse a GitHub Actions run URL. @private */
function parseGitHubAction({ owner, repo, segments }: GitHubNestedLinkParams): IssueLink | null {
  const [runMarker, identifier] = segments.slice(3)
  if (runMarker !== 'runs' || identifier === undefined) {
    return null
  }
  return {
    provider: 'github',
    kind: 'action',
    label: `Run #${identifier}`,
    reference: `#${identifier}`,
    title: `Actions run #${identifier} in ${owner}/${repo} on GitHub`,
  }
}

/** Parse a Notion page hosted by Notion. @private */
function parseNotionLink(segments: readonly string[]): IssueLink | null {
  if (segments.length === 0) {
    return null
  }
  return opaqueLink({ provider: 'notion', kind: 'page', label: 'Notion page' })
}

/** Build metadata for a resource whose URL contains no useful human-readable identifier. @private */
function opaqueLink(params: OpaqueLinkParams): IssueLink {
  const provider = providerName(params.provider)
  return { ...params, reference: null, title: `${params.label} on ${provider}` }
}

/** Return the display name for an opaque resource provider. @private */
function providerName(provider: OpaqueProvider): string {
  return match(provider)
    .with('confluence', () => 'Confluence')
    .with('dash0', () => 'Dash0')
    .with('datadog', () => 'Datadog')
    .with('figma', () => 'Figma')
    .with('google-docs', () => 'Google Docs')
    .with('google-drive', () => 'Google Drive')
    .with('google-sheets', () => 'Google Sheets')
    .with('loom', () => 'Loom')
    .with('notion', () => 'Notion')
    .with('postman', () => 'Postman')
    .with('posthog', () => 'PostHog')
    .with('slack', () => 'Slack')
    .with('trello', () => 'Trello')
    .with('vercel', () => 'Vercel')
    .exhaustive()
}

/** Return whether a hostname is served by Notion. @private */
function isNotionHostname(hostname: string): boolean {
  return (
    hostname === 'notion.so' ||
    hostname === 'www.notion.so' ||
    hostname === 'app.notion.com' ||
    hostname === 'notion.site' ||
    hostname.endsWith('.notion.site')
  )
}

/** Return whether a hostname is a Slack workspace. @private */
function isSlackHostname(hostname: string): boolean {
  return hostname.endsWith('.slack.com')
}

/** Return whether a hostname is hosted by Sentry. @private */
function isSentryHostname(hostname: string): boolean {
  return hostname === 'sentry.io' || hostname.endsWith('.sentry.io')
}

/** Return whether a hostname is a Datadog application region. @private */
function isDatadogHostname(hostname: string): boolean {
  return /^(?:app|ap\d+|us\d+)\.datadoghq\.(?:com|eu)$/.test(hostname)
}

/** Return whether a hostname is a PagerDuty application tenant. @private */
function isPagerDutyHostname(hostname: string): boolean {
  return hostname === 'app.pagerduty.com' || hostname.endsWith('.pagerduty.com')
}
