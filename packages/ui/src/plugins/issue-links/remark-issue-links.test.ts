import { describe, expect, it } from 'vitest'

import { parseIssueLink, remarkIssueLinks } from './remark-issue-links.ts'

describe('parseIssueLink()', () => {
  it.each([
    ['https://github.com/thebytefarm/ciderpress/issues/73', 'github', 'Issue #73'],
    ['https://github.com/thebytefarm/ciderpress/pull/42', 'github', 'Pull #42'],
    ['https://github.com/thebytefarm/ciderpress/discussions/12', 'github', 'Discussion #12'],
    ['https://github.com/thebytefarm/ciderpress/commit/abcdef123456', 'github', 'Commit abcdef1'],
    ['https://github.com/thebytefarm/ciderpress/releases/tag/v1.2.3', 'github', 'Release v1.2.3'],
    ['https://github.com/thebytefarm/ciderpress/actions/runs/12345', 'github', 'Run #12345'],
    ['https://gitlab.com/acme/docs/-/issues/7', 'gitlab', 'Issue #7'],
    ['https://gitlab.com/acme/docs/-/merge_requests/8', 'gitlab', 'Merge #8'],
    ['https://bitbucket.org/acme/docs/pull-requests/9', 'bitbucket', 'Pull #9'],
    ['https://www.npmjs.com/package/@ciderpress/ui', 'npm', '@ciderpress/ui'],
    ['https://linear.app/acme/issue/eng-123/fix-links', 'linear', 'ENG-123'],
    ['https://acme.atlassian.net/browse/docs-456', 'jira', 'DOCS-456'],
    ['https://acme.atlassian.net/wiki/spaces/DOCS/pages/123/Guide', 'confluence', 'Page 123'],
    ['https://www.figma.com/design/abc123/Docs', 'figma', 'Figma design'],
    ['https://docs.google.com/document/d/abc123/edit', 'google-docs', 'Google Doc'],
    ['https://docs.google.com/spreadsheets/d/abc123/edit', 'google-sheets', 'Google Sheet'],
    ['https://drive.google.com/file/d/abc123/view', 'google-drive', 'Drive file'],
    ['https://www.notion.so/acme/Docs-abc123', 'notion', 'Notion page'],
    ['https://acme.slack.com/archives/C123/p123456789', 'slack', 'Slack message'],
    ['https://acme.sentry.io/issues/12345/', 'sentry', 'Issue #12345'],
    ['https://trello.com/c/abc123/docs', 'trello', 'Trello card'],
    ['https://app.asana.com/0/123/456', 'asana', 'Task 456'],
    ['https://www.loom.com/share/abc123', 'loom', 'Loom video'],
    ['https://www.postman.com/acme/workspace/docs/overview', 'postman', 'Postman workspace'],
    ['https://app.clickup.com/t/86abc123', 'clickup', 'Task 86abc123'],
    ['https://app.dash0.com/goto/traces/explorer?traceid=abc123', 'dash0', 'Dash0 trace'],
    ['https://app.datadoghq.com/dashboard/abc-123/system', 'datadog', 'Datadog dashboard'],
    [
      'https://app.launchdarkly.com/projects/app/flags/new-nav/targeting',
      'launchdarkly',
      'Flag new-nav',
    ],
    ['https://app.posthog.com/project/123/insights/abc', 'posthog', 'PostHog insight'],
    ['https://app.pulumi.com/acme/platform/production', 'pulumi', 'Stack production'],
    ['https://app.pagerduty.com/incidents/PABC123', 'pagerduty', 'Incident PABC123'],
    ['https://acme.pagerduty.com/incidents/PDEF456', 'pagerduty', 'Incident PDEF456'],
    ['https://vercel.com/acme/docs', 'vercel', 'Vercel project'],
  ])('should recognize %s', (url, provider, label) => {
    expect(parseIssueLink(url)).toMatchObject({ provider, label })
  })

  it.each([
    'http://github.com/thebytefarm/ciderpress/issues/73',
    'https://github.com/thebytefarm/ciderpress/wiki',
    'https://github.com/thebytefarm/ciderpress/issues/new',
    'https://gitlab.com/acme/docs/-/issues/new',
    'https://bitbucket.org/acme/docs/issues/new',
    'https://linear.app/acme/project/ENG-123',
    'https://example.com/browse/ENG-123',
    'https://www.notion.so/',
    'https://www.figma.com/community',
    'https://example.com/acme/docs/-/issues/7',
    'https://vercel.com/templates/next.js',
    'https://app.posthog.com/project/123/insights',
    'https://app.posthog.com/project/123/replay',
    'not-a-url',
  ])('should ignore unsupported URL %s', (url) => {
    expect(parseIssueLink(url)).toBeNull()
  })

  it('should use an opaque label for Confluence routes without a page identifier', () => {
    expect(parseIssueLink('https://acme.atlassian.net/wiki/spaces/DOCS/overview')).toMatchObject({
      provider: 'confluence',
      label: 'Confluence page',
      reference: null,
    })
  })
})

describe('remarkIssueLinks()', () => {
  it('should add an icon and preserve an authored label on recognized links', () => {
    const link = {
      type: 'link' as const,
      url: 'https://github.com/thebytefarm/ciderpress/pull/42',
      children: [{ type: 'text' as const, value: 'review this' }],
    }
    const tree = { type: 'root', children: [link] }

    remarkIssueLinks()(tree)

    expect(link).toMatchObject({
      children: [
        {
          type: 'mdxJsxTextElement',
          name: 'IssueLinkIcon',
          attributes: [{ name: 'provider', value: 'github' }],
        },
        { type: 'text', value: 'review this' },
        {
          type: 'mdxJsxTextElement',
          name: 'span',
          children: [{ value: '#42' }],
        },
      ],
      data: {
        hProperties: {
          className: ['cp-issue-link', 'cp-issue-link--github'],
        },
      },
    })
  })

  it('should derive the label for a bare URL', () => {
    const url = 'https://github.com/thebytefarm/ciderpress/pull/42'
    const link = {
      type: 'link' as const,
      url,
      children: [{ type: 'text' as const, value: url }],
    }
    const tree = { type: 'root', children: [link] }

    remarkIssueLinks()(tree)

    expect(link.children).toMatchObject([
      { type: 'mdxJsxTextElement', name: 'IssueLinkIcon' },
      { type: 'text', value: 'Pull #42' },
    ])
  })

  it('should omit redundant provider text from authored opaque links', () => {
    const link = {
      type: 'link' as const,
      url: 'https://www.notion.so/acme/Docs-abc123',
      children: [{ type: 'text' as const, value: 'Product brief' }],
    }
    const tree = { type: 'root', children: [link] }

    remarkIssueLinks()(tree)

    expect(link).toMatchObject({
      children: [
        { type: 'mdxJsxTextElement', name: 'IssueLinkIcon' },
        { type: 'text', value: 'Product brief' },
      ],
      data: { hProperties: { className: ['cp-issue-link', 'cp-issue-link--notion'] } },
    })
  })

  it('should delegate Slack to the shared icon component', () => {
    const url = 'https://acme.slack.com/archives/C123/p123456789'
    const link = {
      type: 'link' as const,
      url,
      children: [{ type: 'text' as const, value: url }],
    }
    const tree = { type: 'root', children: [link] }

    remarkIssueLinks()(tree)

    expect(link).toMatchObject({
      children: [
        {
          type: 'mdxJsxTextElement',
          name: 'IssueLinkIcon',
          attributes: [{ name: 'provider', value: 'slack' }],
        },
        { type: 'text', value: 'Slack message' },
      ],
    })
  })

  it('should preserve unrecognized links', () => {
    const link = {
      type: 'link' as const,
      url: 'https://rspress.rs',
      children: [{ type: 'text' as const, value: 'Rspress' }],
    }
    const tree = { type: 'root', children: [link] }

    remarkIssueLinks()(tree)

    expect(link).toStrictEqual({
      type: 'link',
      url: 'https://rspress.rs',
      children: [{ type: 'text', value: 'Rspress' }],
    })
  })

  it('should preserve existing link properties and accessible authored text', () => {
    const link = {
      type: 'link' as const,
      url: 'https://github.com/thebytefarm/ciderpress/pull/42',
      children: [{ type: 'text' as const, value: 'Review accessibility fix' }],
      data: { hProperties: { className: ['existing'], rel: 'noreferrer' } },
    }
    const tree = { type: 'root', children: [link] }

    remarkIssueLinks()(tree)

    expect(link.data.hProperties).toMatchObject({
      className: ['existing', 'cp-issue-link', 'cp-issue-link--github'],
      rel: 'noreferrer',
    })
    expect(link.data.hProperties).not.toHaveProperty('aria-label')
  })
})
