#!/usr/bin/env bash

set -euo pipefail

pr_number="$({
  gh api \
    --header 'Accept: application/vnd.github+json' \
    "repos/${REPOSITORY}/commits/${MERGED_SHA}/pulls" \
    --jq 'map(select(.user.login == "dependabot[bot]")) | first | .number // empty'
})"

if [[ -z "${pr_number}" ]]; then
  exit 0
fi

changed_files=()
changed_files_output="$(
  gh api \
    --header 'Accept: application/vnd.github+json' \
    --paginate \
    "repos/${REPOSITORY}/pulls/${pr_number}/files" \
    --jq '.[].filename'
)"

while IFS= read -r file; do
  changed_files+=("${file}")
done <<< "${changed_files_output}"

if printf '%s\n' "${changed_files[@]}" | grep -Eq '^\.changeset/.+\.md$'; then
  exit 0
fi

readonly -a all_packages=(
  '@ciderpress/cli'
  '@ciderpress/config'
  '@ciderpress/templates'
  '@ciderpress/theme'
  '@ciderpress/ui'
  'ciderpress'
)

affected_packages=()

if printf '%s\n' "${changed_files[@]}" | grep -Fxq 'pnpm-workspace.yaml'; then
  for package_name in "${all_packages[@]}"; do
    affected_packages+=("${package_name}")
  done
else
  for file in "${changed_files[@]}"; do
    case "${file}" in
      packages/cli/package.json) affected_packages+=('@ciderpress/cli') ;;
      packages/config/package.json) affected_packages+=('@ciderpress/config') ;;
      packages/templates/package.json) affected_packages+=('@ciderpress/templates') ;;
      packages/theme/package.json) affected_packages+=('@ciderpress/theme') ;;
      packages/ui/package.json) affected_packages+=('@ciderpress/ui') ;;
      packages/ciderpress/package.json) affected_packages+=('ciderpress') ;;
    esac
  done
fi

if [[ ${#affected_packages[@]} -eq 0 ]]; then
  exit 0
fi

changeset_path=".changeset/dependabot-${pr_number}.md"

{
  printf '%s\n' '---'
  for package_name in "${all_packages[@]}"; do
    if printf '%s\n' "${affected_packages[@]}" | grep -Fxq "${package_name}"; then
      printf "'%s': patch\n" "${package_name}"
    fi
  done
  printf '%s\n\n' '---'
  printf '%s\n' 'Update package dependencies.'
} > "${changeset_path}"

printf 'Generated %s for Dependabot PR #%s.\n' "${changeset_path}" "${pr_number}"
