---
'@ciderpress/templates': minor
'@ciderpress/config': minor
'@ciderpress/cli': minor
---

Add config-driven document templates.

Templates can now be authored as plain `.md`/`.mdx` files with `label`/`hint` frontmatter, discovered from directories declared via the new `templates` config field. A custom template whose filename matches a built-in overrides it, and `.mdx` templates scaffold to `.mdx`.

- **`@ciderpress/config`** — new `templates?: string | string[]` field.
- **`@ciderpress/templates`** — new `buildTemplate()` validator and `TemplateError` type; `Template` gains an optional `extension` field. Built-in template files renamed from `.liquid` to `.md` (no behavior change).
- **`@ciderpress/cli`** — new `ciderpress templates list` and `ciderpress templates check` commands; template validation folded into `ciderpress check` and `ciderpress build`; `ciderpress draft` now discovers config templates and preserves the template's extension.
