---
title: Workspaces
description: How workspaces drive home pages, landing page cards, and monorepo organization.
---

# Workspaces

## Overview

Workspaces are metadata entries that describe your monorepo's services, libraries, and other groupings. They drive **home-page card sections** and **landing-page cards** without forcing you to restructure your repo. Three top-level config fields expose them: `apps`, `packages`, and `workspaces`.

## Key Terms

- **Workspace** — a metadata entry describing a service or library (an app or package)
- **WorkspaceGroup** — a named group with its own `title`, `icon`, and `items: Workspace[]` (the unit `workspaces` consumes)
- **Path** — the URL path segment that links a workspace to its corresponding section
- **Discovery** — glob-based content discovery scoped to a workspace's base path

## How It Works

### The three top-level surfaces

`CiderpressConfig` exposes three workspace fields:

| Field        | Type               | Purpose                                                                     |
| ------------ | ------------------ | --------------------------------------------------------------------------- |
| `apps`       | `Workspace[]`      | Services / runtime apps. Rendered as one home-page section labelled "Apps". |
| `packages`   | `Workspace[]`      | Libraries / publishable packages. Rendered as one home-page section.        |
| `workspaces` | `WorkspaceGroup[]` | Custom named groupings — each group becomes its own home-page section.      |

`apps` and `packages` are flat arrays of `Workspace`; `workspaces` is an array of `WorkspaceGroup`, each containing its own `items: Workspace[]`. Use `apps`/`packages` for the common case; use `workspaces` when you need custom group names (e.g. "Internal Tools", "Plugins", "Adapters").

### Dogfood pattern

The ciderpress repo itself uses `packages` (not `workspaces`) since every entry is a publishable package:

```ts
import { defineConfig } from 'ciderpress'

export default defineConfig({
  packages: [
    {
      title: 'ciderpress',
      icon: { id: 'simpleicons:apple', color: 'red' },
      description: 'Public wrapper package',
      tags: ['typescript', 'cli'],
      path: '/packages/ciderpress',
      include: 'docs/*.md',
    },
    {
      title: '@ciderpress/cli',
      description: 'CLI commands and Rspress integration',
      path: '/packages/cli',
      include: 'docs/*.md',
    },
  ],
})
```

### Mixed apps + packages + custom groups

```ts
import { defineConfig } from 'ciderpress'

export default defineConfig({
  apps: [
    {
      title: 'API',
      icon: { id: 'devicon:hono', color: 'blue' },
      description: 'REST API with typed routes',
      tags: ['hono', 'typescript', 'node'],
      path: '/apps/api',
      include: 'docs/*.md',
      sort: 'alpha',
    },
  ],
  packages: [
    {
      title: 'SDK',
      description: 'TypeScript client SDK',
      tags: ['typescript', 'npm'],
      path: '/packages/sdk',
      include: 'docs/*.md',
    },
  ],
  workspaces: [
    {
      title: 'Internal Tools',
      icon: 'pixelarticons:hammer',
      items: [
        {
          title: 'release-bot',
          description: 'Slack release bot',
          path: '/internal/release-bot',
          include: 'docs/*.md',
        },
      ],
    },
  ],
})
```

### Workspace fields

| Field         | Type                           | Required | Description                                           |
| ------------- | ------------------------------ | -------- | ----------------------------------------------------- |
| `title`       | `string`                       | yes      | Display name                                          |
| `icon`        | `IconConfig`                   | no       | Icon ID string or `{ id, color }` object              |
| `description` | `string`                       | yes      | Short description for cards                           |
| `tags`        | `string[]`                     | no       | Technology tags (kebab-case)                          |
| `badge`       | `{ src: string; alt: string }` | no       | Deploy badge image                                    |
| `path`        | `string`                       | yes      | URL path for this workspace's documentation           |
| `include`     | `string \| string[]`           | no       | Glob pattern(s) for content discovery                 |
| `sort`        | `SortStrategy`                 | no       | Sort strategy for discovered pages                    |
| `exclude`     | `string[]`                     | no       | Glob patterns to exclude from discovery               |
| `recursive`   | `boolean`                      | no       | Map subdirectories to nested sidebar groups           |
| `entryFile`   | `string`                       | no       | Filename promoted to section header in recursive mode |
| `frontmatter` | `Record<string, unknown>`      | no       | Frontmatter injected into all discovered pages        |
| `items`       | `Section[]`                    | no       | Explicit child sections                               |
| `openapi`     | `OpenAPIConfig`                | no       | OpenAPI spec integration for this workspace           |

### WorkspaceGroup fields

| Field         | Type          | Required | Description                                          |
| ------------- | ------------- | -------- | ---------------------------------------------------- |
| `title`       | `string`      | yes      | Group label rendered as the home-page section header |
| `icon`        | `IconConfig`  | no       | Icon for the group header                            |
| `description` | `string`      | no       | Sub-header copy under the section title              |
| `items`       | `Workspace[]` | yes      | The workspaces in this group                         |

### Path matching

Workspace items are matched to sections by `path`. When a section's `path` matches a workspace item's `path`, the workspace metadata is injected into that section's auto-generated landing page as a card.

The `include` pattern is relative to the workspace's base directory (derived from `path`). For example, `path: "/apps/api"` + `include: "docs/*.md"` resolves to `apps/api/docs/*.md` (repo-root relative).

### Where they render

- **Home page** — `apps`, `packages`, and each `WorkspaceGroup` in `workspaces` each become their own card section on the home page (rendered by `buildWorkspaceSection`). Order on the home page is `apps` → `packages` → `workspaces[*]`.
- **Section landing pages** — when a section's `path` matches a workspace item's `path`, the matched workspace metadata is rendered as a workspace-style card on that section's auto-generated landing page.

### Card rendering

Cards display:

- Icon with color styling
- Scope label (derived from path, e.g. `apps/`)
- Name and description
- Technology tag badges
- Optional deploy badge

See the [Navigation](/concepts/navigation) concept for details on auto-generated landing pages and section cards.

## Design Decisions

- **Metadata separate from sections** — workspace metadata lives in `apps`/`packages`/`workspaces` rather than inline on sections. This keeps section definitions focused on information architecture while workspace metadata focuses on project identity.
- **Path-based matching** — matching by URL path rather than explicit IDs keeps the two systems loosely coupled. A section works with or without workspace metadata.
- **Three surfaces, not one** — `apps` and `packages` give monorepos the two most common groupings out of the box without forcing readers to learn the `WorkspaceGroup` shape; `workspaces` is the escape hatch for custom groupings.

## References

- [Configuration reference — Workspace](/reference/configuration#workspace) — full field reference
- [Navigation](/concepts/navigation) — landing pages and card rendering
- [Content](/concepts/content) — section and page definitions
