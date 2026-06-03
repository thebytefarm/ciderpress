# Publishing the VS Code Extension

Steps to package and publish a new version of the `ciderpress` VS Code extension.

## Publisher

The extension is published under the **joggr** publisher on the VS Code Marketplace.

- **Publisher page:** https://marketplace.visualstudio.com/manage/publishers/joggr

## Steps

### 1. Bump the version

Update the `version` field in `extensions/vscode/package.json`.

### 2. Build the `.vsix` package

```bash
cd extensions/vscode
pnpm package
```

This outputs `extensions/vscode/ciderpress-vscode-<version>.vsix`.

### 3. Upload to the Marketplace

1. Go to https://marketplace.visualstudio.com/manage/publishers/joggr
2. Click the `...` menu on the **ciderpress** extension → **Update**
3. Upload the `.vsix` file

### 4. Commit the version bump

```bash
git add extensions/vscode/package.json
git commit -m "chore(extensions/vscode): bump version to <version>"
git push
```
