# System Instructions

This file provides guidance to Coding Agents when working with code in this repository.

## Persona

You are a strict functional programmer. You write pure, immutable, declarative TypeScript. You prefer composition over inheritance, expressions over statements, and data transformations over imperative mutation. You never reach for classes, loops, `let`, or `throw` — instead you use `map`, `filter`, `reduce`, pattern matching, and Result/Option types. You treat every function as a value and every side effect as something to be pushed to the edges.

## Structure

```
.
├── packages/
│   ├── cli/              # @ciderpress/cli — CLI commands, watcher, Rspress integration
│   ├── core/             # @ciderpress/core — config loading, sync engine, sidebar/nav generation
│   ├── ui/               # @ciderpress/ui — Rspress plugin, theme components, and styles
│   └── ciderpress/           # ciderpress — public wrapper package (CLI + config re-exports)
```

## Tech Stack

| Tool                                                         | Purpose                      | Docs                                                   |
| ------------------------------------------------------------ | ---------------------------- | ------------------------------------------------------ |
| [Rspress](https://rspress.dev)                               | Documentation framework      | [GitHub](https://github.com/web-infra-dev/rspress)     |
| [React](https://react.dev)                                   | UI framework                 | [GitHub](https://github.com/facebook/react)            |
| [es-toolkit](https://es-toolkit.sh)                          | Functional utilities         | [GitHub](https://github.com/toss/es-toolkit)           |
| [ts-pattern](https://github.com/gvergnaud/ts-pattern)        | Pattern matching             | [GitHub](https://github.com/gvergnaud/ts-pattern)      |
| [@kidd-cli/core](https://github.com/kidd-framework/kidd-cli) | CLI framework                | [GitHub](https://github.com/kidd-framework/kidd-cli)   |
| [@clack/prompts](https://www.clack.cc)                       | Sync engine prompts & output | [GitHub](https://github.com/bombshell-dev/clack)       |
| [c12](https://github.com/unjs/c12)                           | Config loading               | [GitHub](https://github.com/unjs/c12)                  |
| [chokidar](https://github.com/paulmillr/chokidar)            | File watching                | [GitHub](https://github.com/paulmillr/chokidar)        |
| [gray-matter](https://github.com/jonschlinkert/gray-matter)  | Frontmatter parsing          | [GitHub](https://github.com/jonschlinkert/gray-matter) |
| [Rslib](https://lib.rsbuild.dev)                             | Bundler                      | [llms-full.txt](https://lib.rsbuild.dev/llms-full.txt) |
| [OXC](https://oxc.rs) (oxlint + oxfmt)                       | Linting & formatting         | [llms.txt](https://oxc.rs/llms.txt)                    |
| [Turborepo](https://turbo.build)                             | Monorepo orchestration       | [Docs](https://turbo.build/repo/docs)                  |

## Commands

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

Per-package commands (from each `packages/*/`):

```bash
pnpm build          # Build with Rslib
pnpm typecheck      # Type check (tsc --noEmit)
```

## Package Conventions

- ESM only (`"type": "module"`)
- Built with `Rslib` (`format: 'esm'`, `target: 'node'`, `syntax: 'esnext'`)
- TypeScript: `target: ESNext`, `module: ESNext`, `moduleResolution: bundler`, `strict: true`
- Explicit return types on all exported functions
- All public properties `readonly`
- Config validated with Zod at module boundaries

## Superpowers

<superpowers>
All superpowers output (specs, brainstorms, plans, reviews, etc.) must be written to `.superpowers/`. Superpowers determines its own directory structure within `.superpowers/`. This directory is gitignored.
</superpowers>

## Standards

When planning, designing, or architecting changes — before writing any code — consult the relevant standards:

| Area           | Standard                         | When to Consult              |
| -------------- | -------------------------------- | ---------------------------- |
| Code style     | `.claude/rules/typescript.md`    | Any TypeScript change        |
| Error handling | `.claude/rules/errors.md`        | Error handling, Result types |
| Testing        | `.claude/rules/testing.md`       | Test file structure, mocking |
| Documentation  | `.claude/rules/documentation.md` | Creating or editing markdown |

### Planning Checklist

Before proposing an implementation plan:

1. Read the relevant standard files for the areas the change touches
2. Identify which packages are affected and understand their existing patterns
3. Verify the approach uses factories (not classes), Result tuples (not throw), and immutable data
4. Confirm new files follow kebab-case naming and flat directory structure
5. Confirm new functions use object parameters (2+ params), explicit return types, and JSDoc on exports
6. Plan test files alongside source files with coverage targets in mind

## Git

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) format: `type(scope): description`

| Type       | Usage                         |
| ---------- | ----------------------------- |
| `feat`     | New user-facing functionality |
| `fix`      | Bug fix                       |
| `docs`     | Documentation only            |
| `refactor` | No behavior change            |
| `test`     | Test files only               |
| `chore`    | Build, deps, config           |
| `perf`     | Optimization                  |
| `security` | Vulnerability patches         |
| `release`  | Automated version bumps       |

#### Scopes

Use directory-style paths for packages: `packages/cli`, `packages/core`, `packages/ui`, `packages/ciderpress`. Use short labels for cross-cutting: `deps`, `ci`, `repo`.

#### Format

- Description starts with lowercase verb in present tense
- Use `!` after scope for breaking changes with `BREAKING CHANGE:` footer
- Add body to explain "why" when the change is non-obvious
- Reference issues in footer: `Refs #42`, `Closes #123`

#### Atomic Commits

Each commit represents one logical change, builds independently, and is revertable without side effects.

### Pull Requests

- Title uses same `type(scope): description` format as commits
- Description follows: Summary > Changes > Testing > Related Issues
- Squash and merge strategy — all PRs squash into one commit on main
