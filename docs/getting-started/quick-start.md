---
title: Quick Start
description: Install ciderpress and create your first documentation site in minutes.
---

# Quick Start

## Install

```bash
pnpm add ciderpress
```

## Initialize

Run `ciderpress setup` for an interactive walkthrough, or create a `ciderpress.config.ts` manually at your repo root:

```ts
import { defineConfig } from 'ciderpress'

export default defineConfig({
  title: 'My Project',
  description: 'Project documentation',
  sections: [
    {
      title: 'Getting Started',
      path: '/getting-started',
      include: 'docs/getting-started/*.md',
    },
  ],
})
```

Add another section to the `sections` array that auto-discovers pages from a directory:

```ts
// inside the sections array
{
  title: 'Guides',
  path: '/guides',
  include: 'docs/guides/*.md',
  icon: 'pixelarticons:book-open',
}
```

Every `.md` file matching the glob becomes a page under `/guides/`.

## Configure the site chrome

Tell ciderpress about your repo so visitors get a real "Edit this page" link, a version chip in the topbar, and a topbar CTA:

```ts
// ciderpress.config.ts
export default defineConfig({
  // ...
  site: {
    version: 'v1.0',
    edit: { repo: 'acme/docs', branch: 'main', directory: 'docs' },
    report: { repo: 'acme/docs' },
    topbarCta: { text: 'Get started →', href: '/getting-started' },
  },
})
```

Every field is optional — pieces you don't configure render nothing rather than placeholder content. See the [Configuration reference](/reference/configuration#siteconfig) for the full `site.*` surface (sidebar promo, announcement banner, footer columns, etc.).

## Start the dev server

```bash
ciderpress dev
```

This copies and processes your source markdown into the `.ciderpress/content/` build directory, starts a file watcher for live reload, and launches the dev server. Open the URL printed in the terminal to see your site.

## Commands

| Command               | Purpose                                           |
| --------------------- | ------------------------------------------------- |
| `ciderpress setup`    | Create a starter config and generate SVG assets   |
| `ciderpress sync`     | Sync source files into `.ciderpress/content/`     |
| `ciderpress dev`      | Start the dev server with live reload             |
| `ciderpress build`    | Build the static site for production              |
| `ciderpress serve`    | Preview the production build locally              |
| `ciderpress check`    | Validate config and check for broken links        |
| `ciderpress draft`    | Scaffold a new documentation file from a template |
| `ciderpress clean`    | Remove build artifacts, synced content, and cache |
| `ciderpress dump`     | Print the resolved site structure as JSON         |
| `ciderpress generate` | Generate banner, logo, and icon SVG assets        |

## Project structure

After running `ciderpress dev`, the `.ciderpress/` directory is created:

```
your-repo/
├── docs/                       # Your source markdown
│   ├── intro.md
│   └── guides/
├── ciderpress.config.ts         # Site configuration
└── .ciderpress/                 # Generated — add to .gitignore
    ├── content/                # Synced pages
    │   └── .generated/         # sidebar.json, nav.json
    ├── public/                 # Static assets
    ├── dist/                   # Build output
    └── cache/                  # Build cache
```

Add `.ciderpress/` to your `.gitignore`.

## Next steps

- [Content](/concepts/content) — learn how sections, pages, and navigation work
- [Configuration reference](/reference/configuration) — complete field reference for `ciderpress.config.ts`
