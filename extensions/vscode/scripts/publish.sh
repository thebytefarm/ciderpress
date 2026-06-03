#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$EXT_DIR"

# ── Pre-flight checks ──────────────────────────────────────────────

if ! command -v pnpm &>/dev/null; then
  echo "error: pnpm is not installed" >&2
  exit 1
fi

# ── Prompt for PAT if not set ──────────────────────────────────────

if [ -z "${VSCE_PAT:-}" ]; then
  echo "No VSCE_PAT found in environment."
  echo ""
  echo "Create a Personal Access Token at:"
  echo "  https://dev.azure.com/bytefarm/_usersSettings/tokens"
  echo "  Scope: Marketplace > Manage"
  echo ""
  read -rsp "Paste your PAT: " VSCE_PAT
  echo ""
  export VSCE_PAT
fi

# ── Typecheck & build ──────────────────────────────────────────────

echo "==> Typechecking..."
pnpm typecheck

echo "==> Building..."
pnpm build

# ── Package (dry-run to verify) ────────────────────────────────────

echo "==> Packaging..."
pnpm package

VSIX_FILE=$(ls -1 *.vsix 2>/dev/null | head -1)

if [ -z "$VSIX_FILE" ]; then
  echo "error: no .vsix file found after packaging" >&2
  exit 1
fi

echo "==> Packaged: $VSIX_FILE"

# ── Publish ────────────────────────────────────────────────────────

echo "==> Publishing to VS Code Marketplace..."
npx @vscode/vsce publish --pat "$VSCE_PAT" --no-git-tag-version

echo "==> Cleaning up..."
rm -f "$VSIX_FILE"

echo "==> Done! Extension published."
