---
'@ciderpress/templates': minor
'@ciderpress/cli': minor
---

Add template fill variables and a `{{ }}` marker convention.

Templates can now declare fillable variables in frontmatter, `draft` resolves them from arguments or prompts, and any unfilled marker passes through as a raw `{{ }}` marker for a human or agent to complete. The validator no longer rejects non-`{{title}}` markers (fixes the case where registered templates using the convention broke `build`/`check`), and a new lint fails when a published doc still contains one.

- **`@ciderpress/templates`** — `Template` gains an optional `vars: TemplateVar[]` (each `{ id, title?, description? }`); `buildTemplate()` validates `vars` and no longer emits `unknown_placeholder` (replaced by `invalid_vars`); `render()` now tolerates interior whitespace (`{{ title }}` === `{{title}}`) and leaves unmatched markers untouched; new `findMarkers()` export lists remaining markers.
- **`@ciderpress/cli`** — `ciderpress draft` gains a repeatable `--var id=value`, always substitutes the built-in `title`/`slug`/`date`/`filename` variables, prompts for declared vars on an interactive terminal (skipping leaves the raw marker), and prints a checklist of unfilled markers. `ciderpress check` and `ciderpress build --check` now fail on unfilled `{{ }}` markers in synced docs (fenced/inline code excluded).
