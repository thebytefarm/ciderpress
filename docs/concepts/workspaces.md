---
title: Workspaces
description: How workspaces drive home pages, landing page cards, and monorepo organization.
---

# Workspaces

How monorepo metadata drives the home page, landing page cards, and introduction content.

## Overview

Workspaces are metadata entries that describe your monorepo's services and libraries. The `workspaces` array defines titles, icons, descriptions, and tags that ciderpress uses to generate rich landing page cards and home page content. Workspaces are matched to sections by `path`.

## Key Terms

- **Workspace** — a metadata entry describing a service or library (an app or package)
- **Path** — the URL path segment that links a workspace to its corresponding section
- **Discovery** — glob-based content discovery scoped to a workspace's base path

## How It Works

### Defining workspace items

```ts
import { defineConfig } from 'ciderpress'

export default defineConfig({
  workspaces: [
    {
      title: 'Services',
      icon: 'pixelarticons:server',
      items: [
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
    },
    {
      title: 'Libraries',
      icon: 'pixelarticons:package',
      items: [
        {
          title: 'SDK',
          description: 'TypeScript client SDK',
          tags: ['typescript', 'npm'],
          path: '/packages/sdk',
          include: 'docs/*.md',
        },
      ],
    },
  ],
  sections: [
    { title: 'Getting Started', path: '/getting-started', include: 'docs/getting-started.md' },
  ],
})
```

### Fields

| Field         | Type                           | Required | Description                                           |
| ------------- | ------------------------------ | -------- | ----------------------------------------------------- |
| `title`       | `TitleConfig`                  | yes      | Display name or derived title config                  |
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

### Path matching

Workspace items are matched to sections by `path`. When a section's `path` matches a workspace item's `path`, the workspace metadata is injected into that section's auto-generated landing page as a card.

The `include` pattern is relative to the workspace's base directory (derived from `path`). For example, `path: "/apps/api"` + `include: "docs/*.md"` resolves to `apps/api/docs/*.md` (repo-root relative).

### Card rendering

Cards display:

- Icon with color styling
- Scope label (derived from path, e.g. `apps/`)
- Name and description
- Technology tag badges
- Optional deploy badge

### Landing pages

Sections with children but no explicit page source automatically get a generated landing page. When workspace metadata matches, the landing page uses workspace-style cards. Without workspace metadata, sections use simpler section cards with descriptions extracted from child page frontmatter.

See the [Navigation](/concepts/navigation) concept for details on auto-generated pages, section cards, and overview file promotion.

### Workspace categories

The `workspaces` array contains `WorkspaceCategory` entries — named groups that organize workspace items. Each category has a `title`, `icon`, and an `items` array of `Workspace` entries. This grouping drives the home page layout, rendering one card section per category.

## Design Decisions

- **Metadata separate from sections** — workspace metadata lives in `workspaces` rather than inline on sections. This keeps section definitions focused on information architecture while workspace metadata focuses on project identity.
- **Path-based matching** — matching by URL path rather than explicit IDs keeps the two systems loosely coupled. A section works with or without workspace metadata.
- **Category-based grouping** — workspaces are organized into named `WorkspaceCategory` groups, each with its own icon and title, providing visual structure on the home page.

## References

- [Configuration reference — Workspace](/reference/configuration#workspace) — full field reference
- [Navigation](/concepts/navigation) — landing pages and card rendering
- [Content](/concepts/content) — section and page definitions
