# Contributing to ciderpress

Thanks for your interest in contributing to ciderpress! This document covers the basics you need to get started.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 24.0.0
- [pnpm](https://pnpm.io/) 10.x (`corepack enable` to activate)

## Getting Started

1. Fork and clone the repo
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Make sure everything builds and passes checks:

   ```bash
   pnpm check && pnpm build
   ```

## Development Workflow

### Available Commands

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `pnpm build`      | Build all packages (via Turborepo) |
| `pnpm lint`       | Lint with OXLint                   |
| `pnpm lint:fix`   | Auto-fix lint issues               |
| `pnpm format`     | Check formatting with OXFmt        |
| `pnpm format:fix` | Auto-fix formatting                |
| `pnpm typecheck`  | Type check all packages            |
| `pnpm check`      | Typecheck + lint + format          |
| `pnpm clean`      | Clean all dist output              |

### Making Changes

1. Create a new branch from `main`:
   ```bash
   git checkout -b my-change
   ```
2. Make your changes
3. Run the full check suite before committing:
   ```bash
   pnpm check && pnpm build
   ```
4. Commit your changes (see [Commit Messages](#commit-messages))

## Pull Requests

- Open PRs against the `main` branch
- Keep PRs focused — one logical change per PR
- Include a clear description of **what** changed and **why**
- Make sure CI passes (lint, format, typecheck, build)

## Commit Messages

All commits follow [Conventional Commits](https://www.conventionalcommits.org/) format: `type(scope): description`.

Write clear, concise descriptions in the imperative mood ("add feature" not "added feature"). A short subject line is usually sufficient; add a body if the **why** isn't obvious from the diff.

## Project Structure

```text
packages/
├── cli/              # @ciderpress/cli — CLI commands, watcher, Rspress integration
├── core/             # @ciderpress/core — config loading, sync engine, sidebar/nav generation
├── ui/               # @ciderpress/ui — Rspress plugin, theme components, and styles
└── ciderpress/           # ciderpress — public wrapper package (CLI + config re-exports)
```

## Code Style

- TypeScript, strict mode
- Formatting and linting are handled by [OXC](https://oxc.rs/) (oxfmt + oxlint) — run `pnpm format:fix` and `pnpm lint:fix` to auto-fix
- Prefer pure functions and immutable data
- Avoid classes, `let`, and imperative mutation where possible

## License

By contributing, you agree that your contributions will be licensed under the project's license.
