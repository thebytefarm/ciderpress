---
title: VSCode Extension
description: Preview your ciderpress docs site directly inside VS Code.
---

# VSCode Extension

The ciderpress VSCode extension lets you preview your documentation site directly inside your editor as you write. No need to switch between your terminal and browser — see changes live in a VS Code panel.

## Installation

Search for **ciderpress** in the VS Code extensions marketplace, or install from the command line:

```bash
code --install-extension joggr.ciderpress
```

## Live Preview

The extension embeds a live preview of your ciderpress dev server directly in VS Code. As you edit markdown files, the preview updates automatically.

To open the preview:

1. Open the command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Run **ciderpress: Open Preview**

The preview panel opens alongside your editor. Navigate between pages, and the preview follows your cursor — when you open a different markdown file, the preview jumps to the corresponding page.

## Requirements

- A ciderpress project with a `ciderpress.config.ts` file
- The ciderpress dev server running (`ciderpress dev`) — the extension connects to it for live preview

See the [Quick Start](/getting-started/quick-start) guide for initial setup.

## References

- [Quick Start](/getting-started/quick-start) — set up your first ciderpress project
- [CLI reference — dev](/reference/cli#dev) — dev server options
