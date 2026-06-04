# Ciderpress Instructions

<intro>

**Ciderpress** is a documentation framework for monorepos. Point it at your existing markdown — get a full site. It wraps Rspress with a config layer, sync engine, and Rspress plugin that handle sidebar/nav generation, workspace cards, OpenAPI integration, Liquid templates, and four built-in themes.

**Goal of this repo:** ship a polished, opinionated docs framework that conforms to a repo's existing structure rather than forcing a layout on it. The public package is `ciderpress`; internals are split across `@ciderpress/cli`, `@ciderpress/core`, and `@ciderpress/ui`.

</intro>

## Boundaries

<boundaries>

### Always

<always>

- Validate with `pnpm check` before claiming done (typecheck + lint + format).
- Use factories + closures, not classes.
- Return `Result<T, E>` tuples, not `throw` — see `.claude/rules/errors.md`.
- Immutable data; explicit return types on exports; JSDoc on every export.
- Object params for functions with 2+ args.
- kebab-case filenames; flat directory structure.
- Conventional Commits with directory-style scopes (`packages/cli`, `packages/core`, etc.).
- Prefer installed CLIs (`pnpm`, `oxlint`, `oxfmt`, `tsgo`) over `npx`/`bunx`.
- Run commands from repo root with workspace filters (e.g. `pnpm test --filter=@ciderpress/core`).
- Before proposing an implementation plan, read the relevant `<rules>` file(s) for the areas the change touches and verify the approach matches these Boundaries.

</always>

### Ask first

<ask>

- Adding a dependency in any package.
- Schema or config-shape changes (Zod schemas at module boundaries).
- Creating new packages or top-level directories.
- Changing exported APIs of `@ciderpress/*` packages.
- Renaming or deleting public exports.
- Force pushes, branch deletes, or anything rewriting shared history.

</ask>

### Never

<never>

- `class`, `let`, `for`/`while`/`do…while`, `throw`, `any`, `!`, `?.`, ternaries — see `.claude/rules/typescript.md`.
- ESLint, Prettier, or `tsc` — use **oxlint**, **oxfmt**, **tsgo**.
- `--no-verify` or any hook-bypass flag to make a commit go through. Fix the underlying failure.
- Direct commits to `main`.
- Override per-package build or TS config (Rslib, tsconfig) without a stated reason — the root config is canonical.
- Emojis in code, commits, PRs, or docs unless explicitly asked.
- Comments restating what well-named code already says.

</never>

### Rules

<rules>

- **Code style** — `.claude/rules/typescript.md` · any TypeScript change
- **Error handling** — `.claude/rules/errors.md` · error handling, Result types
- **Testing** — `.claude/rules/testing.md` · test file structure, mocking
- **Documentation** — `.claude/rules/documentation.md` · creating or editing markdown

</rules>

</boundaries>

## Structure

<structure>

```
.
├── packages/             # source packages — see below
│   ├── cli/              # @ciderpress/cli — CLI commands, watcher, Rspress integration
│   ├── core/             # @ciderpress/core — config loading, sync engine, sidebar/nav generation
│   ├── ui/               # @ciderpress/ui — Rspress plugin, theme components, and styles
│   └── ciderpress/       # ciderpress — public wrapper package (CLI + config re-exports)
├── docs/                 # the user-facing documentation site (concepts, guides, references, examples, framework, getting-started) — built with Ciderpress itself
├── contributing/         # internal contributor docs (concepts, guides, references, standards)
├── examples/             # working example sites: simple, kitchen-sink, large
├── extensions/           # editor/IDE integrations (vscode)
├── benchmarks/           # vitest benchmark suite
├── scripts/              # one-off scripts — *.lauf.ts run via `lauf run <name>`, plus shell utilities
├── assets/               # branding (banner.svg, logo, etc.)
├── patches/              # pnpm patches for upstream deps
├── .changeset/           # changeset configs and pending changesets
├── .github/              # workflows and PR templates
└── .claude/rules/        # canonical rule files referenced from <rules>
```

Important top-level configs:

- **`ciderpress.config.ts`** — Ciderpress eats its own dogfood; this drives the live docs site
- **`package.json`** — root workspace scripts (`dev`, `build`, `test`, `check`, `docs:dev`, `bench`, etc.)
- **`pnpm-workspace.yaml`** — pnpm workspace definition
- **`turbo.json`** — Turbo task graph
- **`tsconfig.json`** — root TS config; packages extend this
- **`.oxlintrc.json`** · **`.oxfmtrc.json`** — OXC lint/format rules (enforce the `<never>` list)
- **`vitest.workspace.ts`** — vitest workspace
- **`lauf.config.ts`** — script runner config for `scripts/*.lauf.ts`
- **`vercel.json`** — deploy config for the docs site

</structure>

## Tech Stack

<tech-stack>

- **Rspress** — documentation framework · [site](https://rspress.dev) · [github](https://github.com/web-infra-dev/rspress)
- **React** — UI framework · [github](https://github.com/facebook/react)
- **es-toolkit** — functional utilities · [site](https://es-toolkit.sh) · [github](https://github.com/toss/es-toolkit)
- **ts-pattern** — pattern matching · [github](https://github.com/gvergnaud/ts-pattern)
- **@kidd-cli/core** — CLI framework · [github](https://github.com/kidd-framework/kidd-cli)
- **@clack/prompts** — sync-engine prompts & output · [site](https://www.clack.cc) · [github](https://github.com/bombshell-dev/clack)
- **c12** — config loading · [github](https://github.com/unjs/c12)
- **chokidar** — file watching · [github](https://github.com/paulmillr/chokidar)
- **gray-matter** — frontmatter parsing · [github](https://github.com/jonschlinkert/gray-matter)
- **Rslib** — bundler · [docs](https://lib.rsbuild.dev) · [llms-full.txt](https://lib.rsbuild.dev/llms-full.txt)
- **OXC** (oxlint + oxfmt) — linting & formatting · [site](https://oxc.rs) · [llms.txt](https://oxc.rs/llms.txt)
- **Turborepo** — monorepo orchestration · [docs](https://turbo.build/repo/docs)

</tech-stack>

## Commands

<commands>

```bash
pnpm lint           # Lint with OXLint
pnpm lint:fix       # Auto-fix lint issues
pnpm format         # Check formatting with OXFmt
pnpm format:fix     # Auto-fix formatting
pnpm typecheck      # Type check all packages (via Turbo)
pnpm check          # Typecheck + lint + format
pnpm build          # Build all packages (via Turbo)
pnpm clean          # Clean all dist output (via Turbo)
```

Per-package (from `packages/*/`):

```bash
pnpm build          # Build with Rslib
pnpm typecheck      # Type check (tsc --noEmit)
```

</commands>

## Git

<git>

Follow [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): description`.

Types:

- **feat** — new user-facing functionality
- **fix** — bug fix
- **docs** — documentation only
- **refactor** — no behavior change
- **test** — test files only
- **chore** — build, deps, config
- **perf** — optimization
- **security** — vulnerability patches
- **release** — automated version bumps

Scopes use directory-style paths for packages (`packages/cli`, `packages/core`, `packages/ui`, `packages/ciderpress`) and short labels for cross-cutting (`deps`, `ci`, `repo`).

### Pull Requests

<pull-requests>

- Title uses the same `type(scope): description` format as commits.
- Description follows: Summary > Changes > Testing > Related Issues.
- Squash-and-merge — all PRs squash into one commit on `main`.

</pull-requests>

</git>

## Superpowers

<superpowers>

All superpowers output (specs, brainstorms, plans, reviews, etc.) must be written to `.superpowers/`. Superpowers determines its own directory structure within `.superpowers/`. This directory is gitignored.

</superpowers>

## Scratchpad

<scratchpad>

Create files, markdown documents, scripts, or anything else you need in `./.scratchpad` — it's gitignored.

</scratchpad>
