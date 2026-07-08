---
'@ciderpress/templates': minor
'@ciderpress/cli': minor
---

Group the interactive `draft` template picker.

Templates can now belong to a group, shown in the `draft` picker as a `Group/Name` label (e.g. `guides/UI`). A group comes from either a sub-directory under the configured templates dir (`.templates/guides/ui.md` → `guides`) or an explicit `group` frontmatter field, which wins over the directory. Templates at the templates root and all built-ins stay ungrouped and render flat.

- **`@ciderpress/templates`** — `Template` gains an optional `group`; `buildTemplate` accepts a directory-derived `group` and reads a `group` frontmatter field (frontmatter overrides), with a new `invalid_group` validation error.
- **`@ciderpress/cli`** — template discovery now recurses into sub-directories, tagging each template with its sub-path group; `draft` with no `type` shows the single grouped picker.
