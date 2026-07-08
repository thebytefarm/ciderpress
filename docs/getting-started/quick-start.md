---
title: Quick Start
description: Install ciderpress and create your first documentation site in minutes.
---

# Quick Start

## Install

```bash
pnpm add ciderpress
```

ciderpress requires Node ≥24. Peer dependencies are `@rspress/core`, `react@19`, and `react-dom@19` — pnpm installs these automatically; npm classic and yarn classic users must install them explicitly.

## Initialize

Run `ciderpress setup` for an interactive walkthrough, or create a `ciderpress.config.ts` manually at your repo root:

```ts
import { defineConfig } from 'ciderpress'

export default defineConfig({
  title: 'My Project',
  description: 'Project documentation',
  pages: [
    {
      title: 'Getting Started',
      path: '/getting-started',
      include: 'docs/getting-started/*.md',
    },
  ],
})
```

Add another page to the `pages` array that auto-discovers child files from a directory:

```ts
// inside the pages array
{
  title: 'Guides',
  path: '/guides',
  include: 'docs/guides/*.md',
  icon: 'pixelarticons:book-open',
}
```

Every `.md` file matching the glob becomes a page under `/guides/`.

## Configure the site chrome

Tell ciderpress about your repo so visitors get a real "Edit this page" link, a version chip in the topbar, and a topbar CTA. Each field is its own top-level entry on the config:

```ts
// ciderpress.config.ts
export default defineConfig({
  // ...
  version: 'v1.0',
  editLink: { repo: 'acme/docs', branch: 'main', directory: 'docs' },
  reportLink: { repo: 'acme/docs' },
  topbar: {
    cta: { text: 'Get started →', href: '/getting-started' },
  },
})
```

Every field is optional — pieces you don't configure render nothing rather than placeholder content. See the [Configuration reference](/reference/configuration) for the full top-level surface, including the [sidebar promo](/reference/configuration#sidebar), [announcement banner](/reference/configuration#topbar), and [footer columns](/reference/configuration#footer).

## Start the dev server

```bash
ciderpress dev
```

This copies and processes your source markdown into the `.ciderpress/content/` build directory, starts a file watcher for live reload, and launches the dev server. Open the URL printed in the terminal to see your site.

Pass `--headless` for non-interactive shells (CI, Docker, nodemon) — the default Ink TUI requires a real TTY.

## Commands

| Command                | Purpose                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `ciderpress setup`     | Create a starter config and generate SVG assets                                     |
| `ciderpress dev`       | Start the dev server with live reload                                               |
| `ciderpress build`     | Build the static site for production                                                |
| `ciderpress serve`     | Preview the production build locally                                                |
| `ciderpress sync`      | Sync source files into `.ciderpress/content/`                                       |
| `ciderpress check`     | Validate config and check for broken links                                          |
| `ciderpress diff`      | Show changed files in configured source directories — useful for CI `ignoreCommand` |
| `ciderpress draft`     | Scaffold a new documentation file from a template                                   |
| `ciderpress templates` | List (`list`) and validate (`check`) built-in and custom document templates         |
| `ciderpress clean`     | Remove build artifacts, synced content, and cache                                   |
| `ciderpress dump`      | Print the resolved site structure as JSON                                           |

## Project structure

After running `ciderpress dev`, the `.ciderpress/` directory is created:

```txt
your-repo/
├── docs/                       # Your source markdown
│   ├── intro.md
│   └── guides/
│       └── _meta.json          # Optional: sidebar order/labels per folder
├── ciderpress.config.ts        # Site configuration
└── .ciderpress/                # Generated — add to .gitignore
    ├── content/                # Synced pages + Rspress-consumed _meta.json files
    │   └── _nav.json           # Top-nav definition consumed by Rspress
    ├── public/                 # Static assets
    ├── dist/                   # Build output
    └── cache/                  # Build cache
```

Inside `.ciderpress/content/`, sidebars are driven by `_meta.json` files placed alongside the markdown, and the top nav comes from `_nav.json` at the root — those are what Rspress reads. Runtime artifacts for the UI live under `.ciderpress/content/.generated/` (`workspaces.json`, `scopes.json`); `sidebar.json` and `nav.json` there are debug snapshots only.

If you skipped `ciderpress setup`, add `.ciderpress/` to your `.gitignore` manually.

## Next steps

- [Content](/concepts/content) — learn how pages, groups, and navigation work
- [Configuration reference](/reference/configuration) — complete field reference for `ciderpress.config.ts`
