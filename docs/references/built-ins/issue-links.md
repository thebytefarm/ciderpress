---
title: Link Badges
description: Render canonical service URLs as compact, provider-branded links without authentication.
---

# Link Badges

Ciderpress renders recognized resource URLs as compact links with the provider's icon. Paste a URL into Markdown—there is no component to import, authentication to configure, or metadata to fetch.

## Output

| Provider      | Bare URL                                                                                                                               | Authored label                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Linear        | [https://linear.app/acme/issue/ENG-123/example-issue](https://linear.app/acme/issue/ENG-123/example-issue)                             | [Fix navigation](https://linear.app/acme/issue/ENG-123/example-issue)                   |
| Jira Cloud    | [https://acme.atlassian.net/browse/DOCS-456](https://acme.atlassian.net/browse/DOCS-456)                                               | [Publish guide](https://acme.atlassian.net/browse/DOCS-456)                             |
| GitHub        | [https://github.com/thebytefarm/ciderpress/pull/42](https://github.com/thebytefarm/ciderpress/pull/42)                                 | [Ship link badges](https://github.com/thebytefarm/ciderpress/pull/42)                   |
| GitHub issue  | [https://github.com/thebytefarm/ciderpress/issues/73](https://github.com/thebytefarm/ciderpress/issues/73)                             | [Track link badges](https://github.com/thebytefarm/ciderpress/issues/73)                |
| GitLab        | [https://gitlab.com/acme/docs/-/merge_requests/8](https://gitlab.com/acme/docs/-/merge_requests/8)                                     | [Review docs](https://gitlab.com/acme/docs/-/merge_requests/8)                          |
| Bitbucket     | [https://bitbucket.org/acme/docs/pull-requests/9](https://bitbucket.org/acme/docs/pull-requests/9)                                     | [Merge release](https://bitbucket.org/acme/docs/pull-requests/9)                        |
| npm           | [https://www.npmjs.com/package/@ciderpress/ui](https://www.npmjs.com/package/@ciderpress/ui)                                           | [UI package](https://www.npmjs.com/package/@ciderpress/ui)                              |
| Confluence    | [https://acme.atlassian.net/wiki/spaces/DOCS/pages/123/Guide](https://acme.atlassian.net/wiki/spaces/DOCS/pages/123/Guide)             | [Architecture guide](https://acme.atlassian.net/wiki/spaces/DOCS/pages/123/Guide)       |
| Figma         | [https://www.figma.com/design/abc123/Docs](https://www.figma.com/design/abc123/Docs)                                                   | [Docs mockup](https://www.figma.com/design/abc123/Docs)                                 |
| Google Docs   | [https://docs.google.com/document/d/abc123/edit](https://docs.google.com/document/d/abc123/edit)                                       | [Launch notes](https://docs.google.com/document/d/abc123/edit)                          |
| Google Sheets | [https://docs.google.com/spreadsheets/d/abc123/edit](https://docs.google.com/spreadsheets/d/abc123/edit)                               | [Release tracker](https://docs.google.com/spreadsheets/d/abc123/edit)                   |
| Google Drive  | [https://drive.google.com/file/d/abc123/view](https://drive.google.com/file/d/abc123/view)                                             | [Launch assets](https://drive.google.com/file/d/abc123/view)                            |
| Notion        | [https://www.notion.so/acme/Docs-abc123](https://www.notion.so/acme/Docs-abc123)                                                       | [Product brief](https://www.notion.so/acme/Docs-abc123)                                 |
| Slack         | [https://acme.slack.com/archives/C123/p123456789](https://acme.slack.com/archives/C123/p123456789)                                     | [Decision thread](https://acme.slack.com/archives/C123/p123456789)                      |
| Sentry        | [https://acme.sentry.io/issues/12345/](https://acme.sentry.io/issues/12345/)                                                           | [Production error](https://acme.sentry.io/issues/12345/)                                |
| Trello        | [https://trello.com/c/abc123/docs](https://trello.com/c/abc123/docs)                                                                   | [Docs card](https://trello.com/c/abc123/docs)                                           |
| Asana         | [https://app.asana.com/0/123/456](https://app.asana.com/0/123/456)                                                                     | [Release task](https://app.asana.com/0/123/456)                                         |
| Loom          | [https://www.loom.com/share/abc123](https://www.loom.com/share/abc123)                                                                 | [Feature walkthrough](https://www.loom.com/share/abc123)                                |
| Postman       | [https://www.postman.com/acme/workspace/docs/overview](https://www.postman.com/acme/workspace/docs/overview)                           | [API workspace](https://www.postman.com/acme/workspace/docs/overview)                   |
| ClickUp       | [https://app.clickup.com/t/86abc123](https://app.clickup.com/t/86abc123)                                                               | [Ship release](https://app.clickup.com/t/86abc123)                                      |
| Dash0         | [https://app.dash0.com/goto/traces/explorer?traceid=abc123](https://app.dash0.com/goto/traces/explorer?traceid=abc123)                 | [Checkout trace](https://app.dash0.com/goto/traces/explorer?traceid=abc123)             |
| Datadog       | [https://app.datadoghq.com/dashboard/abc123/system](https://app.datadoghq.com/dashboard/abc123/system)                                 | [System health](https://app.datadoghq.com/dashboard/abc123/system)                      |
| LaunchDarkly  | [https://app.launchdarkly.com/projects/app/flags/new-nav/targeting](https://app.launchdarkly.com/projects/app/flags/new-nav/targeting) | [Navigation rollout](https://app.launchdarkly.com/projects/app/flags/new-nav/targeting) |
| PostHog       | [https://app.posthog.com/project/123/insights/abc](https://app.posthog.com/project/123/insights/abc)                                   | [Activation funnel](https://app.posthog.com/project/123/insights/abc)                   |
| Pulumi        | [https://app.pulumi.com/acme/platform/production](https://app.pulumi.com/acme/platform/production)                                     | [Production infrastructure](https://app.pulumi.com/acme/platform/production)            |
| PagerDuty     | [https://app.pagerduty.com/incidents/PABC123](https://app.pagerduty.com/incidents/PABC123)                                             | [API outage](https://app.pagerduty.com/incidents/PABC123)                               |
| Vercel        | [https://vercel.com/acme/docs](https://vercel.com/acme/docs)                                                                           | [Docs deployment](https://vercel.com/acme/docs)                                         |

Both bare URLs and labeled Markdown links render as badges. A bare URL derives its label from the URL. An explicit label keeps the authored description and adds URL-derived reference text only when the URL contains a useful identifier such as `#42`, `ENG-123`, or a commit hash.

Ciderpress never requests provider metadata. Private URLs render without credentials and cannot fail the documentation build because an account lacks access.

## Markdown

```md
https://github.com/acme/docs/pull/42

[Fix sidebar](https://github.com/acme/docs/pull/42)
```

## Supported URLs

| Provider         | Resources                                 | Canonical URL shape                                                               |
| ---------------- | ----------------------------------------- | --------------------------------------------------------------------------------- |
| Linear           | Issues                                    | `linear.app/{workspace}/issue/{id}`                                               |
| Jira Cloud       | Issues                                    | `{site}.atlassian.net/browse/{id}`                                                |
| GitHub           | Issues, pulls, discussions                | `github.com/{owner}/{repo}/{issues\|pull\|discussions}/{number}`                  |
| GitHub           | Commits, releases, Actions runs           | `github.com/{owner}/{repo}/{commit\|releases/tag\|actions/runs}/{id}`             |
| GitLab Cloud     | Issues, merge requests, commits, releases | `gitlab.com/{namespace}/{repo}/-/{issues\|merge_requests\|commit\|releases}/{id}` |
| Bitbucket Cloud  | Issues, pulls, commits                    | `bitbucket.org/{workspace}/{repo}/{issues\|pull-requests\|commits}/{id}`          |
| npm              | Packages                                  | `npmjs.com/package/{name}`                                                        |
| Confluence Cloud | Pages                                     | `{site}.atlassian.net/wiki/.../pages/{id}`                                        |
| Figma            | Designs, files, prototypes, FigJam boards | `figma.com/{design\|file\|proto\|board}/{key}`                                    |
| Google Docs      | Documents                                 | `docs.google.com/document/d/{id}`                                                 |
| Google Sheets    | Spreadsheets                              | `docs.google.com/spreadsheets/d/{id}`                                             |
| Google Drive     | Files                                     | `drive.google.com/file/d/{id}`                                                    |
| Notion           | Hosted pages                              | `notion.so/...` or `{site}.notion.site/...`                                       |
| Slack            | Message permalinks                        | `{workspace}.slack.com/archives/{channel}/{timestamp}`                            |
| Sentry           | Issues                                    | `{organization}.sentry.io/issues/{id}`                                            |
| Trello           | Cards                                     | `trello.com/c/{id}`                                                               |
| Asana            | Tasks                                     | `app.asana.com/0/{project}/{task}`                                                |
| Loom             | Videos                                    | `loom.com/share/{id}`                                                             |
| Postman          | Workspaces, collections                   | `postman.com/.../{workspace\|collection}/...`                                     |
| ClickUp          | Tasks                                     | `app.clickup.com/t/{id}`                                                          |
| Dash0            | Traces, logs, services, dashboards        | `app.dash0.com/goto/...`                                                          |
| Datadog          | Dashboards, monitors                      | `app.datadoghq.{com\|eu}/{dashboard\|monitors}/{id}`                              |
| LaunchDarkly     | Feature flags                             | `app.launchdarkly.com/projects/{project}/flags/{flag}`                            |
| PostHog          | Insights, recordings, feature flags       | `{app\|eu}.posthog.com/project/{project}/...`                                     |
| Pulumi Cloud     | Stacks                                    | `app.pulumi.com/{organization}/{project}/{stack}`                                 |
| PagerDuty        | Incidents                                 | `app.{eu.}pagerduty.com/incidents/{id}`                                           |
| Vercel           | Projects                                  | `vercel.com/{team}/{project}`                                                     |

URLs outside these shapes render as normal links. Titles, status, assignees, and other remote metadata are intentionally unavailable because rendering is derived entirely from the URL.
