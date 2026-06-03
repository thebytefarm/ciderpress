<!-- markdownlint-disable MD033 MD041 -->
<div align="center">

<img src="https://raw.githubusercontent.com/thebytefarm/ciderpress/main/extensions/vscode/resources/logo.png" alt="ciderpress" width="420" />

<br />
<br />

**Browse your project docs and API references directly in VS Code.**

</div>

---

## What is ciderpress?

[ciderpress](https://ciderpress.dev) is a config-driven documentation framework for monorepos — it turns your markdown files and OpenAPI specs into a full documentation site with sidebar navigation, search, theming, and interactive API references.

## What does this extension do?

This extension brings your ciderpress docs into VS Code so you can browse them without leaving your editor.

<div align="center">
<img src="https://raw.githubusercontent.com/thebytefarm/ciderpress/main/extensions/vscode/resources/screenshot-base.png" alt="ciderpress in VS Code" width="100%" />
</div>

## Features

- **In-editor preview** — browse your docs in a webview panel alongside your code
- **Sidebar navigation** — explore your documentation structure from the activity bar
- **OpenAPI references** — view auto-generated API docs with parameters, schemas, and code samples in 6 languages
- **CodeLens** — click "Preview in ciderpress" above any tracked markdown file
- **Live reload** — preview updates instantly as you edit

### OpenAPI

<div align="center">
<img src="https://raw.githubusercontent.com/thebytefarm/ciderpress/main/extensions/vscode/resources/screenshot-openapi.png" alt="ciderpress OpenAPI reference" width="100%" />
</div>

## Getting Started

1. Install [ciderpress](https://ciderpress.dev/getting-started/quick-start) in your project.
2. Open a workspace that contains a `ciderpress.config.ts` (or `.js`, `.mjs`, `.mts`, `.json`).
3. The extension activates automatically and starts the dev server.
4. Use the sidebar to browse pages, or open a markdown file and click the globe icon to preview.

## Configuration

| Setting                   | Type      | Default | Description                                                    |
| ------------------------- | --------- | ------- | -------------------------------------------------------------- |
| `ciderpress.server.autoStart` | `boolean` | `true`  | Automatically start the dev server when the sidebar is opened. |
| `ciderpress.server.port`      | `number`  | `6174`  | Port for the dev server.                                       |
| `ciderpress.theme`            | `string`  | —       | Override the theme (`base`, `midnight`, or `arcade`).          |
| `ciderpress.theme.mode`       | `string`  | —       | Override the color mode (`dark`, `light`, or `toggle`).        |

## Known Issues

None at this time. If you encounter a bug, please [open an issue](https://github.com/thebytefarm/ciderpress/issues).

## Release Notes

See [CHANGELOG](CHANGELOG.md) for a full list of changes.
