#!/usr/bin/env bash
#
# Mechanical rename: zpress -> ciderpress across the monorepo.
#
# Run from anywhere in the repo. Idempotent (safe to re-run).
#
# Usage:
#   scripts/rename-to-ciderpress.sh             # apply
#   DRY_RUN=1 scripts/rename-to-ciderpress.sh   # preview without changes

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

DRY_RUN="${DRY_RUN:-0}"

log() { printf '\033[1;36m>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!\033[0m %s\n' "$*"; }
ok() { printf '\033[1;32m=\033[0m %s\n' "$*"; }

run() {
  if [ "$DRY_RUN" = "1" ]; then
    printf '  would: %s\n' "$*"
  else
    eval "$@"
  fi
}

# ----------------------------------------------------------------------
# 0. Content transforms (most-specific first; order matters).
# ----------------------------------------------------------------------
# @zpress/kit       -> ciderpress       (unscoped public wrapper)
# @zpress/X         -> @ciderpress/X    (scoped internals)
# joggrdocs/        -> thebytefarm/     (orphan org URLs)
# __ZPRESS_         -> __CIDERPRESS_    (window globals)
# ZPRESS_           -> CIDERPRESS_      (screaming snake constants)
# Zpress            -> Ciderpress       (PascalCase types)
# zpress            -> ciderpress       (lowercase brand)
# --zp-             -> --cp-            (CSS custom properties)
# zp-               -> cp-              (CSS class prefixes)

# Pattern used to grep target files.
TARGETS='@zpress/|Zpress|ZPRESS_|joggrdocs/|--zp-|zp-'

# ----------------------------------------------------------------------
# 1. Build the file list — tracked files, text-relevant types.
# ----------------------------------------------------------------------
log "Discovering tracked files with zpress references..."

ALL_TRACKED=$(mktemp)
TARGET_FILES=$(mktemp)
trap "rm -f $ALL_TRACKED $TARGET_FILES" EXIT

# All tracked files except binaries and lockfile.
git ls-files \
  | grep -vE '\.(png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot|vsix|tgz|zip|mp4|mov|webm|pdf)$' \
  | grep -vE '^pnpm-lock\.yaml$' \
  > "$ALL_TRACKED"

# Filter to files actually containing a target token.
xargs rg -l "$TARGETS" --no-messages \
  < "$ALL_TRACKED" \
  > "$TARGET_FILES" || true

COUNT=$(wc -l < "$TARGET_FILES" | tr -d ' ')
ok "Found $COUNT files to rewrite."

# ----------------------------------------------------------------------
# 2. Apply content transforms.
# ----------------------------------------------------------------------
log "Applying content transforms..."

if [ "$DRY_RUN" = "1" ]; then
  printf '  (dry run) first 10 files:\n'
  head -10 "$TARGET_FILES" | sed 's/^/    /'
else
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    [ -f "$f" ] || continue
    # Skip symlinks — sed -i '' cannot edit them. Their targets are
    # processed separately if also tracked.
    [ -L "$f" ] && continue
    sed -i '' \
      -e 's|@zpress/kit|ciderpress|g' \
      -e 's|@zpress/|@ciderpress/|g' \
      -e 's|joggrdocs/|thebytefarm/|g' \
      -e 's|__ZPRESS_|__CIDERPRESS_|g' \
      -e 's|ZPRESS_|CIDERPRESS_|g' \
      -e 's|Zpress|Ciderpress|g' \
      -e 's|zpress|ciderpress|g' \
      -e 's|--zp-|--cp-|g' \
      -e 's|zp-|cp-|g' \
      "$f"
  done < "$TARGET_FILES"
fi

# ----------------------------------------------------------------------
# 3. Directory renames (do these BEFORE file renames so paths are stable).
# ----------------------------------------------------------------------
log "Renaming directories..."

DIR_RENAMES=(
  ".zpress|.ciderpress"
  "packages/zpress|packages/ciderpress"
)

for entry in "${DIR_RENAMES[@]}"; do
  from="${entry%%|*}"
  to="${entry##*|}"
  if [ -d "$from" ] && [ ! -d "$to" ]; then
    run "git mv \"$from\" \"$to\""
  elif [ -d "$to" ]; then
    warn "  $to already exists, skipping $from -> $to"
  fi
done

# Clean up any residual untracked files left behind in the old .zpress/ dir
# (build output that wasn't moved by git mv).
if [ -d .zpress ]; then
  run "rm -rf .zpress"
fi

# ----------------------------------------------------------------------
# 4. Tracked file renames.
# ----------------------------------------------------------------------
log "Renaming tracked files..."

FILE_RENAMES=(
  "zpress.config.ts|ciderpress.config.ts"
  "examples/large/zpress.config.ts|examples/large/ciderpress.config.ts"
  "examples/simple/zpress.config.ts|examples/simple/ciderpress.config.ts"
  "examples/kitchen-sink/zpress.config.ts|examples/kitchen-sink/ciderpress.config.ts"
  "packages/ui/src/theme/hooks/use-zpress.ts|packages/ui/src/theme/hooks/use-ciderpress.ts"
  "packages/ui/src/theme/components/shared/zpress-logo.tsx|packages/ui/src/theme/components/shared/ciderpress-logo.tsx"
  "packages/ciderpress/.zpress-dev-headless.mjs|packages/ciderpress/.ciderpress-dev-headless.mjs"
)

for entry in "${FILE_RENAMES[@]}"; do
  from="${entry%%|*}"
  to="${entry##*|}"
  if [ -e "$from" ] && [ ! -e "$to" ]; then
    run "git mv \"$from\" \"$to\""
  fi
done

# ----------------------------------------------------------------------
# 5. Delete gitignored build artifacts (will regenerate on next build).
# ----------------------------------------------------------------------
log "Cleaning gitignored build artifacts..."

DELETE_PATHS=(
  ".bench-fixtures"
  ".snapshots"
  "packages/ui/.rslib"
)

for p in "${DELETE_PATHS[@]}"; do
  if [ -e "$p" ]; then
    run "rm -rf \"$p\""
  fi
done

# Per-example build output.
for d in examples/*/.zpress examples/*/.ciderpress; do
  [ -d "$d" ] && run "rm -rf \"$d\""
done

# Built extension archives.
if [ "$DRY_RUN" = "1" ]; then
  printf '  would: find extensions/vscode -maxdepth 1 -name "*.vsix" -delete\n'
else
  find extensions/vscode -maxdepth 1 -name '*.vsix' -delete 2>/dev/null || true
fi

# ----------------------------------------------------------------------
# 6. Verify — zero remaining references in tracked files.
# ----------------------------------------------------------------------
log "Verifying tracked files for residual references..."

RESIDUAL=$(git ls-files \
  | grep -vE '^pnpm-lock\.yaml$' \
  | xargs rg -l "$TARGETS" --no-messages 2>/dev/null || true)
REMAINING=$(printf '%s' "$RESIDUAL" | grep -c . || true)

if [ "$REMAINING" = "0" ]; then
  ok "Clean. Zero residual references in tracked files."
  ok "(pnpm-lock.yaml excluded — regenerates on next 'pnpm install')"
else
  warn "$REMAINING tracked file(s) still contain references:"
  printf '%s\n' "$RESIDUAL" | sed 's/^/    /'
  warn "Inspect each — these may be intentional historical references (changelogs, migration notes)."
fi

# Also check tracked filenames.
log "Verifying tracked filenames for residual references..."
RESIDUAL_NAMES=$(git ls-files | grep -iE 'zpress' || true)
if [ -z "$RESIDUAL_NAMES" ]; then
  ok "Clean. Zero tracked files/dirs with zpress in path."
else
  warn "Tracked files with 'zpress' still in path:"
  echo "$RESIDUAL_NAMES" | sed 's/^/    /'
fi

ok "Done."
