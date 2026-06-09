# Pull Request Standards

## Overview

Standards for creating, reviewing, and merging pull requests. All pull requests must pass CI checks, receive at least one approving review, have no unresolved blocking comments, include tests for new features, and update documentation as needed. These rules keep the main branch stable and the review process predictable.

## Rules

### No Direct Commits to `main`

Direct commits to `main` are forbidden. All changes land via pull request. This is a hard project rule — see `CLAUDE.md` `<never>` block. Never use `--no-verify` or any other hook-bypass flag to push past this constraint. Fix the underlying failure instead.

### Write Clear PR Titles

Use the same `type(scope): description` format as commit messages. The title should be a concise summary of the change.

#### Correct

```
feat(packages/cli): add parallel script execution
fix(packages/config): resolve nested workspace discovery
docs: update CLI usage guide
```

#### Incorrect

```
fix stuff
update code
WIP changes
```

### Write Complete PR Descriptions

Use the format prescribed by `.github/PULL_REQUEST_TEMPLATE.md`. GitHub auto-fills this when you open a PR — fill in each section. Do not improvise the structure.

#### Correct

```markdown
## Summary

- 1-3 bullet points describing what this PR does and why

## Changes

- List the key changes made

## Testing

- [ ] `pnpm check` passes (typecheck + lint + format)
- [ ] `pnpm build` succeeds
- [ ] Manual verification completed

## Related Issues

Closes #123, Refs #456
```

The Summary uses bullets, not prose. The Testing section is a checklist — tick each box once you've run it. If the change does not need version-bump tracking, also confirm a changeset is included (see [Include a Changeset When Bumping Versions](#include-a-changeset-when-bumping-versions)).

### Follow Review Process

Authors and reviewers share responsibility for keeping PRs moving. Authors self-review before requesting feedback and respond within 24 hours. Reviewers provide constructive, timely reviews within 24-48 hours.

Use this checklist when reviewing:

| Category          | Items                                                     |
| ----------------- | --------------------------------------------------------- |
| **Functionality** | Works as intended, handles edge cases, no regressions     |
| **Code Quality**  | Readable, maintainable, follows patterns, DRY             |
| **Security**      | Input validation, auth checks, no sensitive data leaks    |
| **Performance**   | No obvious bottlenecks, efficient queries, proper caching |
| **Tests**         | Adequate coverage, tests pass, tests are meaningful       |
| **Documentation** | Code comments where needed, docs updated, clear naming    |

### Include a Changeset When Bumping Versions

The repo uses [Changesets](https://github.com/changesets/changesets). CI runs `pnpm changeset status --since=origin/main` (`.github/workflows/ci.yml`) — a PR that adds user-facing changes to any published package without a changeset will fail CI.

Add one with:

```bash
pnpm changeset
```

Pick the affected packages and bump type (patch / minor / major), then commit the generated file under `.changeset/`. Doc-only or internal-tooling PRs that don't ship to npm can skip this.

### Use Squash and Merge

All PRs use **Squash and Merge** as the merge strategy. This combines all commits into one, keeps main branch history clean, and preserves the PR discussion link. The PR title becomes the squashed commit message — it must follow [Commit Standards](./git-commits.md) (`type(scope): description`).

Before merging, verify:

1. All CI checks pass (including `changeset status`)
2. At least one approval
3. No unresolved comments
4. Branch is up to date with main

## References

- [Commit Standards](./git-commits.md)
