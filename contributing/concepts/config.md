# Config

The single source of truth for the entire documentation site.

## Overview

The config file (`ciderpress.config.ts`) defines the information architecture -- content structure, navigation, metadata, and workspaces. It is loaded via [c12](https://github.com/unjs/c12) and validated at runtime by `loadConfig()`. Validation errors are returned as `Result` tuples; the CLI layer handles reporting and exits.

## Supported Formats

| Format     | Files                                               |
| ---------- | --------------------------------------------------- |
| TypeScript | `ciderpress.config.ts`, `.mts`, `.cts`              |
| JavaScript | `ciderpress.config.js`, `.mjs`, `.cjs`              |
| Data       | `ciderpress.config.json`, `.jsonc`, `.yml`, `.yaml` |

## Shape

```ts
import { defineConfig } from 'ciderpress'

export default defineConfig({
  title: 'My Docs',
  description: 'Platform documentation',
  tagline: 'A short tagline for the hero section',
  sections: [/* entry tree */],
  apps: [/* workspace items */],
  packages: [/* workspace items */],
  nav: 'auto',
})
```

| Field         | Purpose                                                              |
| ------------- | -------------------------------------------------------------------- |
| `title`       | Site title, used in hero and metadata                                |
| `description` | Site description for SEO                                             |
| `tagline`     | Hero section subtitle                                                |
| `sections`    | Entry tree defining the information architecture                     |
| `apps`        | Workspace items for application docs                                 |
| `packages`    | Workspace items for shared package docs                              |
| `workspaces`  | Custom workspace groups                                              |
| `nav`         | Top-level navigation (`'auto'` or explicit array)                    |
| `templates`   | Directory (or directories) of custom `.md`/`.mdx` document templates |

## Output Structure

The sync engine writes everything to `.ciderpress/`:

```text
.ciderpress/
├── content/                  # Synced markdown + generated MDX (Rspress root)
│   ├── index.md              # Home page (auto-generated or from source)
│   ├── getting-started.md
│   ├── guides/
│   │   └── _meta.json        # Per-directory sidebar (Rspress-consumed)
│   ├── _meta.json            # Root sidebar (Rspress-consumed)
│   ├── _nav.json             # Top nav (Rspress-consumed)
│   └── .generated/           # Machine-generated metadata
│       ├── workspaces.json   # Workspace cards (UI-consumed)
│       ├── scopes.json       # Standalone scope paths (UI-consumed)
│       ├── sidebar.json      # Debug snapshot (not consumed)
│       └── nav.json          # Debug snapshot (not consumed)
├── public/                   # Static assets (logos, icons, banners)
├── dist/                     # Build output (HTML, CSS, JS)
└── cache/                    # Rspress build cache
```

Rspress's root is set to `.ciderpress/content/`. It never sees the original repo layout.

## Rspress Integration

`createRspressConfig()` in `@ciderpress/ui` bridges sync output to Rspress:

- Sets Rspress `root` to `.ciderpress/content/`.
- Sidebar and nav are loaded by Rspress from `_meta.json` (one per content directory) and `_nav.json` (at the content root). Written by `packages/cli/src/lib/sync/sidebar/write-meta.ts`.
- The UI package loads `.generated/workspaces.json` (workspace card metadata) and `.generated/scopes.json` (standalone scope paths) at runtime. See `packages/ui/src/config.ts:89-98`.
- `.generated/sidebar.json` and `.generated/nav.json` are debug snapshots only — written for tooling but not consumed by Rspress.
- Registers `ciderpressPlugin()`, which adds three global UI components: `theme-provider`, `edit-source-button`, and `nav-logo` (see `packages/ui/src/plugin.ts:17-28`). Mermaid (`mermaidPlugin`) and file trees (`fileTree`) are separate Rspress plugins added alongside `ciderpressPlugin()` in `packages/ui/src/config.ts:172-178`, not bundled inside it.
- Configures Rsbuild aliases so generated MDX can import `@ciderpress/ui/theme` components.

## References

- [Architecture](./architecture.md)
- [Engine](./engine/overview.md)
- [CLI Reference](../references/cli.md)
