---
title: Workspaces
description: How workspaces drive the home-page showcase, landing-page cards, and monorepo organization.
---

# Workspaces

## Overview

Workspaces are metadata entries that describe your monorepo's services, libraries, and other groupings. They drive the **home-page showcase grid** and **landing-page cards** without forcing you to restructure your repo. Three top-level config fields expose them: `apps`, `packages`, and `workspaces`.

## Key Terms

- **Workspace** — a metadata entry describing a service or library (an app or package)
- **WorkspaceGroup** — a named group with its own `title`, `icon`, and `items: Workspace[]` (the unit `workspaces` consumes)
- **Path** — the URL path segment that links a workspace to its corresponding page
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
      discover: { sort: 'alpha' },
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
      icon: { id: 'pixelarticons:hammer', color: 'amber' },
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

| Field         | Type                           | Required | Description                                                    |
| ------------- | ------------------------------ | -------- | -------------------------------------------------------------- |
| `title`       | `TitleConfig`                  | yes      | Display name — string or `{ from, transform? }` derivation     |
| `icon`        | `IconConfig`                   | no       | Icon ID string, `{ id, color }`, or `{ src, alt }`             |
| `description` | `string`                       | yes      | Short description for cards                                    |
| `tags`        | `string[]`                     | no       | Technology tags (kebab-case)                                   |
| `badge`       | `{ src: string; alt: string }` | no       | Deploy badge image                                             |
| `path`        | `string`                       | yes      | URL path for this workspace's documentation                    |
| `include`     | `string \| string[]`           | no       | Glob pattern(s) for content discovery                          |
| `discover`    | `DiscoverConfig`               | no       | Discovery options (`sort`, `recursive`, `ignore`, `indexFile`) |
| `defaults`    | `Frontmatter`                  | no       | Default frontmatter injected into all discovered pages         |
| `pages`       | `Page[]`                       | no       | Explicit child pages                                           |
| `openapi`     | `OpenAPISpec`                  | no       | OpenAPI spec integration for this workspace                    |

Discovery tuning lives under `discover.*` (same shape as `Page.discover`) — sort strategy, recursion, ignore patterns, and the recursive index filename. Default frontmatter injected into children lives under `defaults` (same `Frontmatter` type as `Page.defaults`). See [Content](/concepts/content) for the full discovery and frontmatter rules.

### WorkspaceGroup fields

| Field         | Type          | Required | Description                                          |
| ------------- | ------------- | -------- | ---------------------------------------------------- |
| `title`       | `string`      | yes      | Group label rendered as the home-page section header |
| `icon`        | `IconConfig`  | yes      | Icon for the group header                            |
| `description` | `string`      | no       | Sub-header copy under the section title              |
| `items`       | `Workspace[]` | yes      | The workspaces in this group                         |
| `link`        | `string`      | no       | URL prefix override (defaults to `/${slugify(title)}`) |

`WorkspaceGroup.icon` accepts the full `IconConfig` shape — string ID, `{ id, color }`, or `{ src, alt }` — same as anywhere else an icon appears in the config.

### Path matching

Workspace items are matched to pages by `path`. When a `Page.path` matches a workspace item's `path`, the workspace metadata is injected into that page's auto-generated landing page as a card.

The `include` pattern is relative to the workspace's base directory (derived from `path`). For example, `path: "/apps/api"` + `include: "docs/*.md"` resolves to `apps/api/docs/*.md` (repo-root relative).

### Where they render

- **Home page** — `apps`, `packages`, and each `WorkspaceGroup` in `workspaces` each become their own card section on the home page (via `home.showcase`). Default ordering is `apps` → `packages` → `workspaces[*]`.
- **Page landing pages** — when a `Page.path` matches a workspace item's `path`, the matched workspace metadata is rendered as a workspace-style card on that page's auto-generated landing page.

### Card rendering

Cards display:

- Icon with color styling
- Scope label (derived from path, e.g. `apps/`)
- Name and description
- Technology tag badges
- Optional deploy badge

See the [Navigation](/concepts/navigation) concept for details on auto-generated landing pages and card rendering.

## The Home Showcase

The home-page workspace grid is configured under `home.showcase`. It was previously called `home.workspaces`; the rename opens the slot to non-workspace card sources without changing the visual.

```ts
home: {
  showcase: {
    columns: 3,
    heading: { label: 'PRODUCTS', title: 'Our monorepo' },
  },
}
```

### Source

`home.showcase.source` controls where the cards come from:

| Value          | Behavior                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| omitted        | Auto-collect from `apps` + `packages` + `workspaces` (the default).                                                       |
| `'workspaces'` | Same as omitted, explicit.                                                                                                |
| `string[]`     | Explicit list of `Page` paths (e.g. `['/products/cli', '/products/api']`) — accepts arbitrary pages, not just workspaces. |

```ts
home: {
  showcase: {
    columns: 2,
    source: ['/products/cli', '/products/api', '/products/sdk'],
  },
}
```

When `source` is a path list, ciderpress reads each path's `Page.card` metadata to render the card, so any page can appear in the home showcase without being declared as a workspace.

## OpenAPI

Per-workspace OpenAPI integration is unchanged — declare `openapi` on the `Workspace` and ciderpress generates one operation page per route under the workspace's `path`:

```ts
apps: [
  {
    title: 'API',
    description: 'REST API',
    path: '/apps/api',
    openapi: { spec: 'apps/api/openapi.json', path: '/apps/api' },
  },
],
```

Top-level `openapi` has been removed. To attach an OpenAPI spec to a non-workspace page, declare `openapi` on the `Page` directly — the field lives on `Page` and on `Workspace` with the same shape.

## Design Decisions

- **Metadata separate from pages** — workspace metadata lives in `apps`/`packages`/`workspaces` rather than inline on every page. This keeps page definitions focused on information architecture while workspace metadata focuses on project identity.
- **Path-based matching** — matching by URL path rather than explicit IDs keeps the two systems loosely coupled. A page works with or without workspace metadata.
- **Three surfaces, not one** — `apps` and `packages` give monorepos the two most common groupings out of the box without forcing readers to learn the `WorkspaceGroup` shape; `workspaces` is the escape hatch for custom groupings.
- **Showcase, not workspaces** — renaming the home grid from `home.workspaces` to `home.showcase` keeps the slot open for non-workspace card sources (arbitrary page paths) without breaking the monorepo-first default.
- **OpenAPI lives on the node, not at the top** — putting `openapi` on `Page` and `Workspace` (and nowhere else) means the spec attaches to a single mount point with no implicit cross-config wiring.

## References

- [Configuration reference — Workspace](/reference/configuration#workspace) — full field reference
- [Configuration reference — home.showcase](/reference/configuration#home-showcase) — showcase grid options
- [Navigation](/concepts/navigation) — landing pages and card rendering
- [Content](/concepts/content) — `Page` shape, discovery, and defaults
