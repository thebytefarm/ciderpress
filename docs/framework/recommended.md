---
title: Recommended
description: The recommended layout for a ciderpress documentation site.
---

# Recommended Layout

This is the layout we recommend for most projects. It maps each doc type to a clear top-level page in the sidebar.

## The layout

```ts
import { defineConfig } from 'ciderpress'

export default defineConfig({
  pages: [
    // Onboarding — tutorials and quickstarts
    {
      title: 'Getting Started',
      icon: 'pixelarticons:speed-fast',
      path: '/getting-started',
      pages: [
        {
          title: 'Introduction',
          path: '/getting-started/intro',
          include: 'docs/getting-started/intro.md',
        },
        {
          title: 'Quick Start',
          path: '/getting-started/quick-start',
          include: 'docs/getting-started/quick-start.md',
        },
      ],
    },

    // Task-oriented how-tos
    {
      title: { from: 'heading' },
      icon: 'pixelarticons:article',
      path: '/guides',
      include: 'docs/guides/*.md',
      discover: { sort: 'alpha' },
    },

    // Conceptual explanations
    {
      title: { from: 'heading' },
      icon: 'pixelarticons:label',
      path: '/concepts',
      include: 'docs/concepts/**/*.md',
      discover: { recursive: true, sort: 'alpha' },
    },

    // API, config, CLI reference
    {
      title: { from: 'heading' },
      icon: 'pixelarticons:list-box',
      path: '/reference',
      include: 'docs/reference/**/*.md',
      discover: { recursive: true, sort: 'alpha' },
    },

    // Rules and conventions
    {
      title: { from: 'heading' },
      icon: 'pixelarticons:clipboard',
      path: '/standards',
      include: 'docs/standards/**/*.md',
      discover: { recursive: true, sort: 'alpha' },
    },

    // Common problems and fixes
    {
      title: { from: 'heading' },
      icon: 'pixelarticons:alert',
      path: '/troubleshooting',
      include: 'docs/troubleshooting/*.md',
      discover: { sort: 'alpha' },
    },
  ],
})
```

## Page-to-type mapping

| Page            | Doc types                 | Directory               |
| --------------- | ------------------------- | ----------------------- |
| Getting Started | Tutorials, Quickstarts    | `docs/getting-started/` |
| Guides          | Guides                    | `docs/guides/`          |
| Concepts        | Explanations              | `docs/concepts/`        |
| Reference       | Reference                 | `docs/reference/`       |
| Standards       | Standards                 | `docs/standards/`       |
| Troubleshooting | Troubleshooting, Runbooks | `docs/troubleshooting/` |

## Monorepo additions

For monorepos with multiple apps or packages, add a top-level page per workspace tree and mark it as a sidebar island so navigation stays focused:

```ts
{
  title: 'Apps',
  icon: 'pixelarticons:device-laptop',
  path: '/apps',
  nav: { island: true },
  pages: [
    {
      title: { from: 'heading' },
      path: '/apps/api',
      include: 'apps/api/docs/**/*.md',
      discover: { recursive: true, sort: 'alpha' },
    },
    {
      title: { from: 'heading' },
      path: '/apps/web',
      include: 'apps/web/docs/**/*.md',
      discover: { recursive: true, sort: 'alpha' },
    },
  ],
},
{
  title: 'Packages',
  icon: 'pixelarticons:archive',
  path: '/packages',
  nav: { island: true },
  pages: [
    {
      title: { from: 'heading' },
      path: '/packages/ui',
      include: 'packages/ui/docs/**/*.md',
      discover: { recursive: true, sort: 'alpha' },
    },
  ],
},
```

`nav: { island: true }` gives each app or package its own sidebar — children only appear when the user is inside that branch.

For richer card metadata on the home page (icons, tags, deploy badges), promote those workspaces into the top-level `apps` / `packages` fields instead — see [Workspaces](/concepts/workspaces).

## File structure

The recommended directory layout mirrors the top-level pages:

```
docs/
├── getting-started/
│   ├── intro.md
│   └── quick-start.md
├── guides/
│   ├── add-a-plugin.md
│   ├── configure-ci.md
│   └── deploy-to-vercel.md
├── concepts/
│   ├── authentication.md
│   └── data-flow.md
├── reference/
│   ├── configuration.md
│   ├── cli.md
│   └── api/
│       ├── overview.md
│       └── endpoints.md
├── standards/
│   ├── typescript.md
│   └── git-commits.md
└── troubleshooting/
    └── deployments.md
```

## Adapting the layout

Not every project needs every page. Start with what you have:

| Project size | Recommended pages                            |
| ------------ | -------------------------------------------- |
| Small        | Getting Started, Reference                   |
| Medium       | Getting Started, Guides, Concepts, Reference |
| Large        | All pages                                    |
| Monorepo     | All pages + sidebar-island Apps / Packages   |

Add pages as your docs grow. Removing an empty page is easier than reorganizing a flat pile of docs later.

## References

- [Overview](/framework/overview) — why this framework exists
- [Types](/framework/types) — the seven doc types in detail
- [Scaling](/framework/scaling) — how the layout evolves over time
- [Content](/concepts/content) — ciderpress page configuration
- [Workspaces](/concepts/workspaces) — when to promote workspace pages into `apps` / `packages`
