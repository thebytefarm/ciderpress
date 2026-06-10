#!/usr/bin/env bash
# publish-initial.sh
#
# Local equivalent of the CI release flow for ciderpress: consumes pending
# changesets, bumps versions, builds, publishes every publishable package
# with the dist-tag inferred from .changeset/pre.json, and creates git tags.
#
# Use this once to bootstrap the first publish of `ciderpress` and
# `@ciderpress/*` before npm trusted publishing is configured. After this
# succeeds, configure trusted publishers and let CI handle subsequent releases.
#
# Usage:
#   ./scripts/publish-initial.sh              # do it
#   ./scripts/publish-initial.sh --dry-run    # show resulting versions, revert
#   ./scripts/publish-initial.sh --push       # also push branch + tags at the end
#   ./scripts/publish-initial.sh --latest     # also point npm dist-tag `latest` at each published version
#
# Flags compose: `--latest --push` is fine.
#
# Requires: `npm login` first. Clean git tree.

set -euo pipefail

DRY_RUN=false
PUSH=false
LATEST=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --push)    PUSH=true ;;
    --latest)  LATEST=true ;;
    -h|--help)
      sed -n '2,21p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

# ---- helpers ---------------------------------------------------------------

step() { printf "\n==> %s\n" "$*"; }
fail() { printf "\nERROR: %s\n" "$*" >&2; exit 1; }

pkg_field() {
  node -e "process.stdout.write(String(require('./$1').$2 ?? ''))"
}

publishable_packages() {
  local pj private has_pc
  for d in packages/*/; do
    pj="${d}package.json"
    [[ -f "$pj" ]] || continue
    private=$(pkg_field "$pj" "private")
    has_pc=$(node -e "process.stdout.write(String(!!require('./${pj}').publishConfig))")
    [[ "$private" == "true" ]] && continue
    [[ "$has_pc" != "true" ]] && continue
    pkg_field "$pj" "name"
    echo
  done
}

set_provenance() {
  local desired="$1" # "true" or "false"
  local pj
  for d in packages/*/; do
    pj="${d}package.json"
    [[ -f "$pj" ]] || continue
    node -e "
      const fs = require('fs');
      const p = JSON.parse(fs.readFileSync('${pj}','utf8'));
      if (p.publishConfig && 'provenance' in p.publishConfig) {
        p.publishConfig.provenance = ${desired};
        fs.writeFileSync('${pj}', JSON.stringify(p, null, 2) + '\n');
      }
    "
  done
}

restore_on_exit() {
  set_provenance true
}

# ---- preflight -------------------------------------------------------------

step "Preflight"

if ! npm whoami &>/dev/null; then
  fail "Not logged in to npm. Run: npm login"
fi
echo "    npm user:    $(npm whoami)"

if [[ -n "$(git status --porcelain)" ]]; then
  fail "Git tree is not clean. Commit or stash changes first."
fi
echo "    git tree:    clean"

current_branch=$(git rev-parse --abbrev-ref HEAD)
echo "    git branch:  ${current_branch}"

pending=$(ls .changeset/*.md 2>/dev/null | grep -v README || true)
if [[ -z "$pending" ]]; then
  echo ""
  echo "    No pending changesets — nothing to release."
  exit 0
fi

step "Pending changesets"
echo "$pending" | sed 's|^\.changeset/|    |'

step "Publishable packages"
publishable_packages | sed 's/^/    /'

if [[ -f .changeset/pre.json ]]; then
  pre_mode=$(node -p "require('./.changeset/pre.json').mode")
  pre_tag=$(node -p "require('./.changeset/pre.json').tag")
  echo ""
  echo "    pre mode:    ${pre_mode}"
  echo "    dist-tag:    ${pre_tag}"
fi

# ---- dry run ---------------------------------------------------------------

if [[ "$DRY_RUN" == "true" ]]; then
  step "Dry run: applying changeset version to inspect resulting versions"
  pnpm changeset version >/dev/null

  echo ""
  echo "    Resulting versions:"
  for d in packages/*/; do
    pj="${d}package.json"
    [[ -f "$pj" ]] || continue
    name=$(pkg_field "$pj" "name")
    version=$(pkg_field "$pj" "version")
    private=$(pkg_field "$pj" "private")
    [[ "$private" == "true" ]] && continue
    printf "      %-32s %s\n" "$name" "$version"
  done

  step "Reverting (dry run)"
  git checkout -- .changeset packages/*/package.json packages/*/CHANGELOG.md 2>/dev/null || true
  git clean -fd .changeset packages/*/ 2>/dev/null || true
  echo "    Done. Re-run without --dry-run to publish."
  exit 0
fi

# ---- the real run ----------------------------------------------------------

step "Consuming changesets and bumping versions"
pnpm changeset version

step "Building all packages"
pnpm run prerelease

step "Disabling publishConfig.provenance for local publish (no OIDC)"
set_provenance false
trap restore_on_exit EXIT

step "Publishing"
# changeset publish honors .changeset/pre.json (dist-tag) and creates
# per-package git tags by default.
pnpm changeset publish

step "Restoring publishConfig.provenance for CI"
set_provenance true
trap - EXIT

if [[ "$LATEST" == "true" ]]; then
  step "Pointing dist-tag 'latest' at the freshly published versions"
  for d in packages/*/; do
    pj="${d}package.json"
    [[ -f "$pj" ]] || continue
    private=$(pkg_field "$pj" "private")
    has_pc=$(node -e "process.stdout.write(String(!!require('./${pj}').publishConfig))")
    [[ "$private" == "true" ]] && continue
    [[ "$has_pc" != "true" ]] && continue
    name=$(pkg_field "$pj" "name")
    version=$(pkg_field "$pj" "version")
    echo "    npm dist-tag add ${name}@${version} latest"
    npm dist-tag add "${name}@${version}" latest
  done
fi

step "Committing version bump"
git add -A
git commit -m "chore(repo): version packages (rc)" \
           -m "Local bootstrap release via scripts/publish-initial.sh"

step "Created git tags"
git tag --points-at HEAD | sed 's/^/    /' || true

if [[ "$PUSH" == "true" ]]; then
  step "Pushing branch and tags"
  git push origin "$current_branch"
  git push origin --tags
else
  step "Skipping push (pass --push to push)"
  echo "    To finish:"
  echo "      git push origin ${current_branch}"
  echo "      git push origin --tags"
fi

step "Done"
echo ""
echo "Next steps:"
echo "  1. Configure trusted publishers on npm so CI can use provenance:"
publishable_packages | while read -r name; do
  [[ -z "$name" ]] && continue
  echo "       https://www.npmjs.com/package/${name}/access"
done
echo "  2. Close the open changesets release PR — it has been superseded."
echo "  3. Future releases: merge the changesets bot PR, CI will publish."
