# CLI Reference

Command syntax, flags, and Rspress integration for the `ciderpress` CLI.

## Overview

ciderpress uses [`@kidd-cli/core`](https://github.com/kidd-framework/kidd-cli) for command routing. Styled terminal output goes through [`@clack/prompts`](https://www.clack.cc). The CLI entry point is `packages/cli/src/index.ts`, which registers all commands. Each command is a standalone module that orchestrates the engine and Rspress build APIs.

## Commands

| Command | Description                                                              |
| ------- | ------------------------------------------------------------------------ |
| `setup` | Create a starter `ciderpress.config.ts`                                  |
| `dev`   | Sync + Rspress dev server + file watcher                                 |
| `build` | Sync + Rspress static build                                              |
| `serve` | Preview a built site from `.ciderpress/dist/`                            |
| `sync`  | Run the sync engine only — no dev server, no build                       |
| `check` | Validate config and check for broken links                               |
| `diff`  | Show changed files in configured source directories                      |
| `draft` | Scaffold a new documentation file from a template                        |
| `clean` | Remove `.ciderpress/cache/`, `.ciderpress/content/`, `.ciderpress/dist/` |
| `dump`  | Resolve the full entry tree and print as JSON                            |

### `setup`

```bash
ciderpress setup
```

Creates a starter `ciderpress.config.ts` in the current directory if one does not already exist.

### `dev`

```bash
ciderpress dev [--quiet] [--clean] [--port <port>] [--theme <name>] [--colorMode <mode>] [--vscode] [--headless]
```

The primary development workflow. Combines initial sync, file watcher, and Rspress dev server on `http://localhost:6174`. The `--clean` flag removes cache, content, and dist before starting.

Use `--headless` to skip the Ink TUI and emit plain log output. Required when running from a non-TTY shell (tmux without a real PTY, background agent tasks, CI). Note that the headless runner does not construct the shared OpenAPI cache, so OpenAPI dereferencing repeats on every sync — see [Dev Mode](../concepts/engine/dev.md).

See [Dev Mode](../concepts/engine/dev.md) for how the watch loop, HMR, and config reload work.

### `build`

```bash
ciderpress build [--quiet] [--clean] [--check] [--no-check] [--verbose]
```

Produces a static site:

1. Optional clean step
2. Full sync
3. Rspress build (generates optimized HTML/CSS/JS in `.ciderpress/dist/`)
4. Link check (enabled by default, disable with `--no-check`)

### `serve`

```bash
ciderpress serve [--no-open] [--port <port>] [--theme <name>] [--colorMode <mode>] [--vscode]
```

Starts a static file server pointing at `.ciderpress/dist/` on `http://localhost:8080`. The browser opens automatically; use `--no-open` to disable.

### `sync`

```bash
ciderpress sync [--quiet]
```

Runs the sync engine and exits — no dev server, no Rspress build. Loads config, syncs all content into `.ciderpress/content/`, reports pages written / skipped / removed and elapsed ms. Useful for CI pipelines, benchmarking the sync pipeline in isolation, and pre-warming `.ciderpress/` before a separate build step.

### `check`

```bash
ciderpress check
```

Validates the config and runs a build to detect broken links. Reports config errors and deadlinks with a summary table.

### `diff`

```bash
ciderpress diff [--ref <ref>] [--pretty]
```

Shows changed files in configured source directories. Two modes:

- **Without `--ref` (default):** uses `git status` to detect uncommitted changes in the working tree.
- **With `--ref <ref>`:** uses `git diff --name-only <ref> HEAD` to compare commits. Exits with code `1` when changes are detected — matching the Vercel `ignoreCommand` convention (exit 1 = proceed with build, exit 0 = skip).

By default, output is a space-separated file list on stdout (suitable for scripts and piping). Pass `--pretty` to emit intro/note/outro formatting via `@clack/prompts` — not pipeable, but human-readable.

### `draft`

```bash
ciderpress draft [--type <type>] [--title <title>] [--out <dir>]
```

Scaffolds a new documentation file from a template. Prompts for doc type and title when not provided via args, then writes the rendered template to the specified output directory. The template set is the built-ins merged with any declared via the `templates` config field (user templates override built-ins by type). The output file preserves the template's extension, so `.mdx` templates scaffold to `.mdx`.

### `templates`

```bash
ciderpress templates list    # list built-in + custom templates (overrides marked *)
ciderpress templates check   # validate template frontmatter and syntax; exits 1 on failure
```

Resolves templates the same way `draft` does (`lib/templates.ts` → `resolveTemplates`), surfacing frontmatter, placeholder, and duplicate-type issues. `templates check` shares its validation with `ciderpress check` and `ciderpress build`.

### `clean`

```bash
ciderpress clean
```

Removes `.ciderpress/cache/`, `.ciderpress/content/`, and `.ciderpress/dist/` (all three targets live under `.ciderpress/`). Safe to run at any time -- all content is regenerated by sync/build.

### `dump`

```bash
ciderpress dump
```

Resolves the full entry tree from the config and prints it as JSON. Useful for debugging config resolution and glob patterns.

## Rspress Integration

The CLI communicates with Rspress through `packages/cli/src/lib/rspress.ts`:

| Function              | Purpose                                          |
| --------------------- | ------------------------------------------------ |
| `startDevServer()`    | Launch Rspress dev server on port 6174           |
| `buildSite()`         | Run Rspress static build to `.ciderpress/dist/`  |
| `buildSiteForCheck()` | Build with deadlink detection enabled            |
| `serveSite()`         | Start static file server for `.ciderpress/dist/` |
| `openBrowser()`       | Cross-platform browser launcher                  |

All functions receive a Rspress config object built by `createRspressConfig()` from `@ciderpress/ui`. Sidebar and nav are loaded by Rspress from `_meta.json` / `_nav.json` in the content tree; the UI config additionally loads `workspaces.json` and `scopes.json` from `.ciderpress/content/.generated/` and wires up the ciderpress theme.

## Error Handling

CLI errors are handled at the command boundary:

- **Config errors** -- `loadConfig()` returns a `Result<T, ConfigError>` tuple; commands report errors via `@clack/prompts` and call `process.exit(1)`
- **Sync errors** -- Result tuples propagate up; the CLI reports them and exits
- **Rspress errors** -- Build/dev failures are caught and reported

All user-facing error formatting is centralized in the CLI layer.

## References

- [Architecture](../concepts/architecture.md)
- [Engine Overview](../concepts/engine/overview.md)
- [Dev Mode](../concepts/engine/dev.md)
