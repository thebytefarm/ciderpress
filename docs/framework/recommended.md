---
title: Recommended
description: The recommended section layout for a ciderpress documentation site.
---

# Recommended Layout

This is the section structure we recommend for most projects. It maps each doc type to a clear section in the sidebar.

## The layout

```ts
import { defineConfig } from 'ciderpress'

export default defineConfig({
  sections: [
    // Onboarding — tutorials and quickstarts
    {
      title: 'Getting Started',
      icon: 'pixelarticons:speed-fast',
      path: '/getting-started',
      items: [
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
      sort: 'alpha',
    },

    // Conceptual explanations
    {
      title: { from: 'heading' },
      icon: 'pixelarticons:label',
      path: '/concepts',
      include: 'docs/concepts/**/*.md',
      recursive: true,
      sort: 'alpha',
    },

    // API, config, CLI reference
    {
      title: { from: 'heading' },
      icon: 'pixelarticons:list-box',
      path: '/reference',
      include: 'docs/reference/**/*.md',
      recursive: true,
      sort: 'alpha',
    },

    // Rules and conventions
    {
      title: { from: 'heading' },
      icon: 'pixelarticons:clipboard',
      path: '/standards',
      include: 'docs/standards/**/*.md',
      recursive: true,
      sort: 'alpha',
    },

    // Common problems and fixes
    {
      title: { from: 'heading' },
      icon: 'pixelarticons:alert',
      path: '/troubleshooting',
      include: 'docs/troubleshooting/*.md',
      sort: 'alpha',
    },
  ],
})
```

## Section-to-type mapping

| Section         | Doc types                 | Directory               |
| --------------- | ------------------------- | ----------------------- |
| Getting Started | Tutorials, Quickstarts    | `docs/getting-started/` |
| Guides          | Guides                    | `docs/guides/`          |
| Concepts        | Explanations              | `docs/concepts/`        |
| Reference       | Reference                 | `docs/reference/`       |
| Standards       | Standards                 | `docs/standards/`       |
| Troubleshooting | Troubleshooting, Runbooks | `docs/troubleshooting/` |

## Monorepo additions

For monorepos with multiple apps or packages, add isolated sections for each workspace:

```ts
{
  title: 'Apps',
  icon: 'pixelarticons:device-laptop',
  path: '/apps',
  standalone: true,
  items: [
    {
      title: { from: 'heading' },
      path: '/apps/api',
      include: 'apps/api/docs/**/*.md',
      recursive: true,
      sort: 'alpha',
    },
    {
      title: { from: 'heading' },
      path: '/apps/web',
      include: 'apps/web/docs/**/*.md',
      recursive: true,
      sort: 'alpha',
    },
  ],
},
{
  title: 'Packages',
  icon: 'pixelarticons:archive',
  path: '/packages',
  standalone: true,
  items: [
    {
      title: { from: 'heading' },
      path: '/packages/ui',
      include: 'packages/ui/docs/**/*.md',
      recursive: true,
      sort: 'alpha',
    },
  ],
},
```

Using `standalone: true` gives each app or package its own sidebar, keeping navigation focused.

## File structure

The recommended directory layout mirrors the sections:

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

Not every project needs all sections. Start with what you have:

| Project size | Recommended sections                         |
| ------------ | -------------------------------------------- |
| Small        | Getting Started, Reference                   |
| Medium       | Getting Started, Guides, Concepts, Reference |
| Large        | All sections                                 |
| Monorepo     | All sections + standalone Apps/Packages      |

Add sections as your docs grow. Removing an empty section is easier than reorganizing a flat pile of docs later.

## References

- [Overview](/framework/overview) — why this framework exists
- [Types](/framework/types) — the seven doc types in detail
- [Scaling](/framework/scaling) — how the layout evolves over time
- [Content](/concepts/content) — ciderpress section configuration
