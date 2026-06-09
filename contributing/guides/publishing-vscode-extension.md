# Publishing the VS Code Extension

Steps to publish a new version of the `ciderpress-vscode` extension to the VS Code Marketplace.

## Publisher

The extension is published as **bytefarm.ciderpress-vscode** (publisher `bytefarm`, package `ciderpress-vscode`).

- **Publisher page:** https://marketplace.visualstudio.com/manage/publishers/bytefarm

## Prerequisites

- Marketplace publish access for the `bytefarm` publisher.
- A valid Azure DevOps Personal Access Token with **Marketplace → Manage** scope, stored as the `VSCE_PAT` repository secret (used by the release workflow). For the manual fallback, you need either the same token locally or a logged-in `vsce` session.

## Preferred: automated release

The canonical publish path is the `VS Code Extension Release` workflow at `.github/workflows/vscode-release.yml`. It runs typecheck, build, and package against the current `main`, then publishes.

### 1. Bump the version

Open a PR that bumps `version` in `extensions/vscode/package.json`. Get it reviewed and merged into `main` like any other change.

```bash
git checkout -b chore/vscode-bump
# edit extensions/vscode/package.json — e.g. 0.2.2 -> 0.2.3
git commit -am "chore(extensions/vscode): bump version to 0.2.3"
git push -u origin chore/vscode-bump
gh pr create --fill
```

### 2. Trigger the workflow

After the bump PR merges, dispatch the release workflow:

```bash
gh workflow run "VS Code Extension Release" --ref main
```

The workflow runs, in order:

1. `pnpm install` (from the repo root)
2. `pnpm typecheck` (in `extensions/vscode/`)
3. `pnpm build`
4. `pnpm package` — produces `extensions/vscode/ciderpress-vscode-<version>.vsix`
5. `npx @vscode/vsce publish --pat "$VSCE_PAT" --no-git-tag-version`

If any step fails, the publish step is skipped. Fix the failure on `main` and re-dispatch.

### 3. Verify

```bash
gh run list --workflow "VS Code Extension Release" --limit 1
```

Then confirm the new version appears on the [Marketplace listing](https://marketplace.visualstudio.com/items?itemName=bytefarm.ciderpress-vscode) and the publisher dashboard.

## Fallback: manual publish

Only use this when the workflow is unavailable (e.g. broken Actions, secret rotation in progress). It bypasses the CI-validated build path.

### 1. Bump the version in a PR

Same as Step 1 above — never commit the bump directly to `main`.

### 2. Validate locally

From the repo root, run the same checks the workflow runs:

```bash
pnpm --filter ciderpress-vscode typecheck
pnpm --filter ciderpress-vscode build
pnpm --filter ciderpress-vscode package
```

The package step writes `extensions/vscode/ciderpress-vscode-<version>.vsix`.

### 3. Upload via the Marketplace UI

1. Go to https://marketplace.visualstudio.com/manage/publishers/bytefarm
2. Open the `...` menu on the **ciderpress** extension → **Update**
3. Upload the `.vsix` file

Or, if you have a valid `VSCE_PAT` locally:

```bash
cd extensions/vscode
npx @vscode/vsce publish --pat "$VSCE_PAT" --no-git-tag-version
```

## References

- [Develop a Feature](./developing-a-feature.md)
- [Commit Standards](../standards/git-commits.md)
