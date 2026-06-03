---
title: Scaling
description: How to evolve your documentation structure as your project grows.
---

# Scaling Your Docs

Documentation structure that works for a 5-page site doesn't work for a 500-page site. This page covers how to evolve your layout as your project grows.

## Stage 1: Single project, small team

Start minimal. You probably have a README and a few docs.

```
docs/
├── getting-started.md
├── guides/
│   └── deployment.md
└── reference/
    └── configuration.md
```

```ts
sections: [
  { title: 'Getting Started', path: '/getting-started', include: 'docs/getting-started.md' },
  {
    title: { from: 'heading' },
    path: '/guides',
    include: 'docs/guides/*.md',
  },
  {
    title: { from: 'heading' },
    path: '/reference',
    include: 'docs/reference/*.md',
  },
]
```

At this stage, auto-discovery with globs handles most of the work. New files show up automatically.

## Stage 2: Growing docs, more types

As the project matures, you'll find yourself writing conceptual docs, standards, and troubleshooting pages. Add sections for them.

```
docs/
├── getting-started/
│   ├── intro.md
│   └── quick-start.md
├── guides/
├── concepts/
├── reference/
├── standards/
└── troubleshooting/
```

```ts
sections: [
  {
    title: 'Getting Started',
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
  {
    title: { from: 'heading' },
    path: '/guides',
    include: 'docs/guides/*.md',
    sort: 'alpha',
  },
  {
    title: { from: 'heading' },
    path: '/concepts',
    include: 'docs/concepts/**/*.md',
    recursive: true,
    sort: 'alpha',
  },
  {
    title: { from: 'heading' },
    path: '/reference',
    include: 'docs/reference/**/*.md',
    recursive: true,
    sort: 'alpha',
  },
  {
    title: { from: 'heading' },
    path: '/standards',
    include: 'docs/standards/**/*.md',
    recursive: true,
    sort: 'alpha',
  },
  {
    title: { from: 'heading' },
    path: '/troubleshooting',
    include: 'docs/troubleshooting/*.md',
    sort: 'alpha',
  },
]
```

Key changes:

- **Getting Started** becomes a section with multiple pages (intro + quickstart)
- **Concepts** and **Standards** get their own sections instead of living in Guides
- **`recursive: true`** enables nested subdirectories as sidebar groups

## Stage 3: Monorepo with workspaces

When your repo has multiple apps and packages, each workspace gets its own docs directory. Use isolated sections to give each workspace a focused sidebar.

```
apps/
├── api/
│   └── docs/
│       ├── overview.md
│       └── endpoints/
├── web/
│   └── docs/
packages/
├── auth/
│   └── docs/
├── database/
│   └── docs/
docs/
├── getting-started/
├── guides/
├── concepts/
├── reference/
├── standards/
└── troubleshooting/
```

```ts
sections: [
  // ... shared sections from Stage 2 ...

  {
    title: 'Apps',
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
    path: '/packages',
    standalone: true,
    items: [
      {
        title: { from: 'heading' },
        path: '/packages/auth',
        include: 'packages/auth/docs/**/*.md',
        recursive: true,
        sort: 'alpha',
      },
      {
        title: { from: 'heading' },
        path: '/packages/database',
        include: 'packages/database/docs/**/*.md',
        recursive: true,
        sort: 'alpha',
      },
    ],
  },
]
```

Key changes:

- **Workspace docs live next to the code** — `apps/api/docs/`, not `docs/apps/api/`
- **Standalone sidebars** keep workspace navigation separate from shared docs
- **Shared sections** (Guides, Concepts, Standards) remain for cross-cutting concerns

## Patterns that scale

### Auto-discovery over explicit lists

As you add more docs, maintaining explicit `items` arrays becomes tedious. Lean on globs:

```ts
// Instead of listing every guide manually:
include: 'docs/guides/*.md',
title: { from: 'heading' },
sort: 'alpha',
```

### Recursive directories for deep content

When a topic needs sub-grouping, use directories and `recursive: true`:

```
docs/concepts/
├── auth/
│   ├── overview.md
│   ├── oauth.md
│   └── api-keys.md
└── data/
    ├── overview.md
    └── migrations.md
```

Each directory becomes a collapsible sidebar group automatically.

### Landing pages for section entry points

Sections with children and a `path` automatically get a generated landing page with cards linking to each child entry:

```ts
{
  title: 'Concepts',
  path: '/concepts',
  include: 'docs/concepts/**/*.md',
}
```

Navigating to `/concepts` shows a landing page with cards for each discovered page, orienting the reader before they dive into individual pages. Set `landing: false` to disable this behavior.

### Custom sort for intentional ordering

When alphabetical order doesn't tell the right story, use a custom comparator:

```ts
{
  title: 'Getting Started',
  path: '/getting-started',
  include: 'docs/getting-started/*.md',
  sort: (a, b) => {
    const order = { Introduction: 0, 'Quick Start': 1, 'Next Steps': 2 }
    return (order[a.title] ?? 99) - (order[b.title] ?? 99)
  },
}
```

## When to restructure

Signs your docs need a new stage:

- Contributors ask "where should I put this?" more than once
- Users can't find docs they know exist
- The sidebar is more than 3 scroll heights long
- You have docs that are half-guide, half-explanation

The fix is almost always the same: split a section into two, or promote a nested group into a top-level section.

## References

- [Recommended](/framework/recommended) — the full recommended layout
- [Types](/framework/types) — the seven doc types
- [Content](/concepts/content) — ciderpress section configuration, auto-discovery, and glob patterns
