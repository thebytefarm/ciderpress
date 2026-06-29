---
title: VSCode Extension
description: Preview your ciderpress docs site directly inside VS Code.
---

# VSCode Extension

The ciderpress VS Code extension runs your dev server and shows a live preview inside the editor — no need to keep a terminal or browser tab open while you write.

## Installation

Search for **ciderpress** in the VS Code extensions marketplace, or install from the command line:

```bash
code --install-extension bytefarm.ciderpress
```

The extension activates automatically when your workspace contains a `ciderpress.config.{ts,mts,mjs,js,json}` file.

## Workflow

1. Open the **ciderpress** view in the activity bar (the cider icon on the left rail).
2. The dev server auto-starts the first time the view becomes visible (controlled by [`ciderpress.server.autoStart`](#settings), default `true`).
3. The **Pages** tree shows every page in your config. Click an entry to open the preview panel beside your editor.
4. Open any markdown file tracked by ciderpress and the preview follows your cursor — switching files navigates the preview to the matching page.

The extension manages its own dev server. You don't need to run `ciderpress dev` in a separate terminal.

## Commands

All nine commands are registered under the `ciderpress:` prefix and available from the command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`).

| Command                    | Title                       | Description                                               |
| -------------------------- | --------------------------- | --------------------------------------------------------- |
| `ciderpress.start`         | ciderpress: Start Server    | Start the embedded dev server                             |
| `ciderpress.stop`          | ciderpress: Stop Server     | Stop the running dev server                               |
| `ciderpress.toggle`        | ciderpress: Toggle Server   | Start or stop based on current state                      |
| `ciderpress.restart`       | ciderpress: Restart Server  | Restart the dev server (e.g. after config changes)        |
| `ciderpress.preview`       | ciderpress: Preview Page    | Open the preview panel for the current markdown file      |
| `ciderpress.openPage`      | ciderpress: Open Page       | Open a specific page in the preview panel                 |
| `ciderpress.openInBrowser` | ciderpress: Open in Browser | Open the running site in the default external browser     |
| `ciderpress.collapseAll`   | Collapse All                | Collapse every section in the Pages tree (view title bar) |
| `ciderpress.editSource`    | Edit Source                 | Jump from a tree node to the underlying markdown file     |

## Settings

Configure via VS Code settings (`Cmd+,` / `Ctrl+,`) under the **ciderpress** namespace.

| Setting                       | Type                               | Default | Description                                                                         |
| ----------------------------- | ---------------------------------- | ------- | ----------------------------------------------------------------------------------- |
| `ciderpress.server.autoStart` | `boolean`                          | `true`  | Automatically start the dev server when the ciderpress sidebar is opened            |
| `ciderpress.server.autoOpen`  | `boolean`                          | `true`  | Automatically open the docs site in the browser when the dev server starts          |
| `ciderpress.server.port`      | `number`                           | `6174`  | Port for the dev server                                                             |
| `ciderpress.theme`            | `'base' \| 'midnight' \| 'arcade'` | `null`  | Override the theme used for the preview, without modifying `ciderpress.config`      |
| `ciderpress.theme.mode`       | `'dark' \| 'light' \| 'toggle'`    | `null`  | Override the color mode used for the preview, without modifying `ciderpress.config` |

## Requirements

- A ciderpress project with a `ciderpress.config.{ts,mts,mjs,js,json}` file at the workspace root.
- VS Code `^1.115.0`.

## References

- [Quick Start](/getting-started/quick-start) — set up your first ciderpress project
- [CLI reference — dev](/reference/cli#dev) — the same dev server, from the command line
- [Configuration](/reference/configuration) — full `ciderpress.config.ts` schema
