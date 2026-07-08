---
title: CLI Commands
description: Reference for all ciderpress CLI commands, flags, and behavior.
---

# CLI Commands

All commands are run from your repo root where `ciderpress.config.ts` lives.

```bash
ciderpress <command> [flags]
```

The eleven registered commands are: [`setup`](#setup), [`dev`](#dev), [`build`](#build), [`serve`](#serve), [`sync`](#sync), [`check`](#check), [`diff`](#diff), [`draft`](#draft), [`templates`](#templates), [`clean`](#clean), [`dump`](#dump).

## Common flags

Several commands share the same option set. Where a per-command table omits a flag, it isn't supported.

| Flag          | Type                | Default | Commands                     | Description                                                                |
| ------------- | ------------------- | ------- | ---------------------------- | -------------------------------------------------------------------------- |
| `--quiet`     | `boolean`           | `false` | `sync`, `dev`, `build`       | Suppress non-error output                                                  |
| `--clean`     | `boolean`           | `false` | `dev`, `build`               | Remove build artifacts before running                                      |
| `--port`      | `number`            | —       | `dev` (6174), `serve` (8080) | Preferred port — falls back to the next free port in a 5-port range        |
| `--host`      | `string`            | —       | `dev`                        | Bind interface. Overrides `devServer.host` (default `'localhost'`)         |
| `--url`       | `string`            | —       | `dev`                        | Externally-visible URL. Overrides `devServer.url` (e.g. portless host)     |
| `--theme`     | `string`            | —       | `dev`, `serve`               | Force a registered theme name for this run (must appear in `theme.themes`) |
| `--colorMode` | `'dark' \| 'light'` | —       | `dev`, `serve`               | Force the initial variant for this run (overrides `theme.defaultVariant`)  |
| `--vscode`    | `boolean`           | `false` | `dev`, `serve`               | Emit the VS Code extension's chrome trimmings (no topbar, panel layout)    |

## setup

Initialize a ciderpress config file in the current project.

```bash
ciderpress setup
```

Derives the project title from `git remote get-url origin` (falling back to the directory name), writes a starter `ciderpress.config.ts`, ensures `.ciderpress/` is gitignored, and generates initial branded SVG assets in `.ciderpress/public/`. Skips with a warning if `ciderpress.config.ts` already exists.

## sync

Sync documentation sources into `.ciderpress/`.

```bash
ciderpress sync [--quiet]
```

| Flag      | Type      | Default | Description               |
| --------- | --------- | ------- | ------------------------- |
| `--quiet` | `boolean` | `false` | Suppress non-error output |

Resolves all entries in the config, copies source files into `.ciderpress/content/`, merges frontmatter, and writes `_meta.json` and `_nav.json` files alongside each section.

## dev

Start the dev server with live reload.

```bash
ciderpress dev [--quiet] [--clean] [--port <n>] [--host <h>] [--url <u>] [--theme <name>] [--colorMode <dark|light>] [--vscode] [--headless]
```

| Flag          | Type                | Default       | Description                                                                                         |
| ------------- | ------------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `--quiet`     | `boolean`           | `false`       | Suppress non-error output                                                                           |
| `--clean`     | `boolean`           | `false`       | Remove build artifacts before starting                                                              |
| `--port`      | `number`            | `6174`        | Preferred port (falls back to the next free port in a 5-port range). Overrides `devServer.port`     |
| `--host`      | `string`            | `'localhost'` | Bind interface. Set `'0.0.0.0'` to expose on every interface. Overrides `devServer.host`            |
| `--url`       | `string`            | —             | Externally-visible URL surfaced to the ready message + browser auto-open. Overrides `devServer.url` |
| `--theme`     | `string`            | —             | Force a registered theme name for this run                                                          |
| `--colorMode` | `'dark' \| 'light'` | —             | Force the initial variant for this run                                                              |
| `--vscode`    | `boolean`           | `false`       | Emit the VS Code extension's chrome trimmings                                                       |
| `--headless`  | `boolean`           | `false`       | Run without the Ink TUI — plain log output                                                          |

Runs `sync` first, starts a file watcher on all source files, and launches the Rspress dev server. Changes to source markdown files are detected and re-synced automatically.

`--headless` is required when invoking `dev` from a non-TTY shell (CI, Docker, nodemon, background tasks) — the default Ink TUI needs raw-mode stdin and will error otherwise.

## build

Build the static site for production.

```bash
ciderpress build [--quiet] [--clean] [--check | --no-check] [--verbose]
```

| Flag                     | Type      | Default | Description                                                             |
| ------------------------ | --------- | ------- | ----------------------------------------------------------------------- |
| `--quiet`                | `boolean` | `false` | Suppress non-error output                                               |
| `--clean`                | `boolean` | `false` | Remove build artifacts before building                                  |
| `--check` / `--no-check` | `boolean` | `true`  | Validate config and check for broken links during the build             |
| `--verbose`              | `boolean` | `false` | Surface raw Rspress output during the check pass (otherwise suppressed) |

Runs `sync` first, then builds the Rspress site. Output is written to `.ciderpress/dist/`. Branded SVG assets (banner, logo, icon) are regenerated as a side effect when `title` is configured.

When `--check` is enabled (the default), config validation and deadlink detection run as part of the build. Use `--no-check` to skip checks and build with standard Rspress output. Use `--verbose` to see raw Rspress diagnostics during the check pass.

## serve

Preview the production build locally.

```bash
ciderpress serve [--no-open] [--port <n>] [--theme <name>] [--colorMode <dark|light>] [--vscode]
```

| Flag          | Type                | Default | Description                                                         |
| ------------- | ------------------- | ------- | ------------------------------------------------------------------- |
| `--no-open`   | `boolean`           | `false` | Don't open the browser automatically                                |
| `--port`      | `number`            | `8080`  | Preferred port (falls back to the next free port in a 5-port range) |
| `--theme`     | `string`            | —       | Force a registered theme name for this run                          |
| `--colorMode` | `'dark' \| 'light'` | —       | Force the initial variant for this run                              |
| `--vscode`    | `boolean`           | `false` | Emit the VS Code extension's chrome trimmings                       |

Starts a local static file server pointed at `.ciderpress/dist/`. Requires a prior `ciderpress build`.

## clean

Remove build artifacts, synced content, and build cache.

```bash
ciderpress clean
```

Deletes the following directories:

| Directory              | Contents     |
| ---------------------- | ------------ |
| `.ciderpress/cache/`   | Build cache  |
| `.ciderpress/content/` | Synced pages |
| `.ciderpress/dist/`    | Build output |

Safe to run at any time — all directories are regenerated by `sync` and `build`.

## diff

Show changed files in configured source directories.

```bash
ciderpress diff [--pretty] [--ref <ref>]
```

| Flag       | Type      | Default | Description                                                        |
| ---------- | --------- | ------- | ------------------------------------------------------------------ |
| `--pretty` | `boolean` | `false` | Human-readable output with headers (default: space-separated list) |
| `--ref`    | `string`  | —       | Git ref to compare against `HEAD` (e.g. `HEAD^`, `main`)           |

Loads the config and extracts every source directory from `include` fields, plus their top-level roots and the config files themselves.

**Default mode (no `--ref`)** runs `git status --short` scoped to those paths and prints a space-separated file list to stdout — suitable for piping into lefthook, scripts, or git hooks.

**Ref mode (`--ref <ref>`)** runs `git diff --name-only <ref> HEAD` and exits with code `1` when changes are detected. This matches the [Vercel `ignoreCommand`](https://vercel.com/docs/projects/project-configuration/ignored-build-step) convention — exit `1` means "proceed with build", exit `0` means "skip build":

```bash
# vercel.json
{ "ignoreCommand": "ciderpress diff --ref HEAD^" }
```

Use `--pretty` for labeled, human-readable output instead of the machine-friendly list.

## dump

Resolve and print the full site structure as JSON.

```bash
ciderpress dump
```

Loads the config, resolves all entries (including glob patterns and recursive discovery), and outputs the resolved navigation tree to stdout. Useful for debugging your site structure.

Output includes `text`, `link`, `collapsible`, `hidden`, `standalone`, and nested `items` for each entry.

## check

Validate config and check for broken links.

```bash
ciderpress check
```

Validates the config file, syncs content, then runs a build to detect deadlinks. Also validates any custom templates declared via the [`templates`](/reference/configuration) config field. Reports results for config, templates, and link checking. Exits with code `1` if any check fails. Useful for CI pipelines.

## draft

Scaffold a new documentation file from a template.

```bash
ciderpress draft [--type <type>] [--title <title>] [--out <dir>]
```

| Flag      | Type     | Default | Description                         |
| --------- | -------- | ------- | ----------------------------------- |
| `--type`  | `string` | —       | Template type (prompts if omitted)  |
| `--title` | `string` | —       | Document title (prompts if omitted) |
| `--out`   | `string` | `"."`   | Output directory for the new file   |

When `--type` or `--title` are omitted, an interactive prompt lets you select from the available templates and enter a title. The output filename is derived from the title slug (e.g. `"Authentication"` → `authentication.md`).

The available templates are the built-ins plus any declared via the [`templates`](/reference/configuration) config field. A custom template whose filename matches a built-in overrides it, and `.mdx` templates scaffold to `.mdx` files. See [Templates](/framework/templates) for the authoring format.

## templates

List and validate document templates.

```bash
ciderpress templates list    # List built-in and custom templates
ciderpress templates check   # Validate template frontmatter and syntax
```

| Subcommand | Description                                                                       |
| ---------- | --------------------------------------------------------------------------------- |
| `list`     | Print built-in and custom templates, grouped by source; overrides marked with `*` |
| `check`    | Validate every template's frontmatter and placeholders; exits `1` on any issue    |

`check` reports frontmatter errors (missing/unknown fields), invalid types, unknown `{{placeholders}}`, and duplicate types. The same validation runs as part of [`check`](#check) and [`build`](#build). See [Templates](/framework/templates) for how to declare and author custom templates.

## References

- [Configuration](/reference/configuration) — full `ciderpress.config.ts` schema
- [Frontmatter](/reference/frontmatter) — per-page metadata
- [VSCode Extension](/reference/vscode-extension) — preview docs inside the editor

## Resources

- [Vercel ignoreCommand](https://vercel.com/docs/projects/project-configuration/ignored-build-step) — exit-code contract used by `diff --ref`
