---
'@ciderpress/cli': minor
'@ciderpress/config': minor
---

Auto-source group card and landing descriptions from an overview page.

An auto-generated group landing now populates each nested group's card
description (and the group's own landing intro) from that group's
overview/root page — `overview.md`, `index.md`, `readme.md`, … — instead
of leaving it blank. Previously only an explicit config `description`
reached a nested group card, so auto-discovered groups rendered
description-less cards even when a root page existed.

Resolution precedence (highest first): `card.description` →
`Page.description` → the group's overview page frontmatter `description` →
that overview's first paragraph.

- **`@ciderpress/config`** — new `discover.descriptionFallback:
  'firstParagraph' | 'none'` field on `Page.discover`, `Workspace.discover`,
  and the top-level `discover`. Defaults to `'firstParagraph'`; set `'none'`
  to require an explicit frontmatter `description` and skip first-paragraph
  inference. A new `DescriptionFallback` type is exported.
- **`@ciderpress/cli`** — group descriptions are resolved once in the sync
  resolve layer and reused for both the parent card and the group's landing.
  Section cards now honor `card.description`, matching workspace cards.
