# Commit Standards

## Overview

All commits follow [Conventional Commits](https://www.conventionalcommits.org/) for a clear, structured history that enables automated versioning and changelog generation via Changesets. Every commit message must include a type, an optional scope, and a concise description in the imperative mood.

## Rules

### Follow Conventional Commits Format

Every commit message uses the format `type(scope): description`. The type indicates the category of change, the scope identifies the affected area, and the description starts with a lowercase verb in present tense.

| Type       | Description      | Usage                     |
| ---------- | ---------------- | ------------------------- |
| `feat`     | New feature      | User-facing functionality |
| `fix`      | Bug fix          | Fixes broken behavior     |
| `docs`     | Documentation    | Only doc changes          |
| `refactor` | Code refactoring | No behavior change        |
| `test`     | Add/update tests | Test files only           |
| `chore`    | Maintenance      | Build, deps, config       |
| `perf`     | Performance      | Optimization              |
| `security` | Security fix     | Vulnerability patches     |
| `release`  | Release          | Automated version bumps   |

#### Correct

```bash
git commit -m "feat(packages/cli): add workspace script discovery"
git commit -m "fix(packages/config): resolve config loading from parent directories"
git commit -m "docs: add contributing guidelines"
git commit -m "chore(deps): update zod to 3.24.0"
```

#### Incorrect

```bash
# Missing type
git commit -m "add script discovery"

# Vague description
git commit -m "fix: fix bug"

# Past tense
git commit -m "feat(packages/cli): added workspace support"
```

### Use Correct Scopes

Scopes identify what part of the codebase changed. Use directory-style paths for packages and short labels for cross-cutting concerns.

| Scope                 | Description                                |
| --------------------- | ------------------------------------------ |
| `packages/cli`        | The CLI commands and sync engine package   |
| `packages/ui`         | The UI plugin and theme components package |
| `packages/config`     | The config schema and loader package       |
| `packages/templates`  | The Liquid template registry package       |
| `packages/theme`      | The theme definitions and schema package   |
| `packages/ciderpress` | The public-facing wrapper package          |
| `extensions/vscode`   | The VS Code extension                      |
| `deps`                | Dependency updates                         |
| `ci`                  | CI/CD workflow changes                     |
| `repo`                | Workspace/monorepo config                  |

Recent history (`git log -50`) shows the team also uses bare-name shorthand: `feat(ui)` for `packages/ui`, `feat(theme)` for `packages/theme`, `chore(extensions/vscode)` for the extension. Treat the shorthand as a legitimate alias for the corresponding `packages/<name>` row above. The directory-style form is preferred for readability.

#### Correct

```bash
git commit -m "feat(packages/cli): add parallel script execution"
git commit -m "chore(deps): update typescript to 5.7.0"
git commit -m "chore(ci): add security audit workflow"
git commit -m "chore(repo): update turbo.json pipeline"
git commit -m "chore(extensions/vscode): bump engines.vscode"
```

### Mark Breaking Changes

Breaking changes must include `!` after the scope and a `BREAKING CHANGE:` footer per the [Conventional Commits spec](https://www.conventionalcommits.org/en/v1.0.0/#specification). Mark as breaking when removing or renaming public APIs, changing config schema, or modifying CLI flags.

The `BREAKING CHANGE:` line is a **footer**, separated from the body by a blank line — not part of the body. Tooling (changesets, semantic-release) greps for footer-shaped lines, so placement matters.

#### Correct

```bash
git commit -m "feat(packages/config)!: change config schema

Renames the top-level scripts field so it matches the CLI flag naming.

BREAKING CHANGE: scripts field renamed from 'tasks' to 'scripts'"
```

The structure is:

1. Subject — `type(scope)!: description`
2. Blank line
3. Body — optional explanation (what / why)
4. Blank line
5. Footer — `BREAKING CHANGE: <description>` (uppercase, with colon)

### Include Body and Footer When Needed

Use the body to explain why the change was made and what problem it solves. Use the footer for issue references, co-authors, and breaking change descriptions.

#### Correct

```bash
git commit -m "refactor(packages/cli): extract config resolution into lib/

Config loading logic was duplicated between init and run handlers.
This extracts it into a shared module for consistency.

Refs #42"
```

### Make Atomic Commits

Each commit should represent one logical change, build and pass checks independently, and be revertable without side effects.

#### Correct

```bash
git commit -m "feat(packages/cli): add script tree display"
git commit -m "test(packages/cli): add script tree tests"
git commit -m "docs: document script tree command"
```

#### Incorrect

```bash
# Multiple unrelated changes in one commit
git commit -m "feat: add script tree and fix config bug and update docs"
```

### Include a Changeset for Version-Bumping Changes

The repo uses [Changesets](https://github.com/changesets/changesets) for versioning and changelog generation. CI runs `pnpm changeset status --since=origin/main` (`.github/workflows/ci.yml`) — a feature, fix, or breaking-change commit that ships to a published package without a changeset will fail.

Create one with:

```bash
pnpm changeset
```

Commit the generated file under `.changeset/` alongside the change. Doc-only or internal-tooling commits that don't ship to npm can skip this.

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Changesets](https://github.com/changesets/changesets)

## References

- [Git Pull Requests](./git-pulls.md)
