---
'@ciderpress/ui': patch
---

Fix list and footnote rendering in doc content.

- **List markers** — Rspress renders markers `outside`, which right-aligns them to the text edge, so wide decimal markers (`10.`, `99.`) sat in a different column than bullets and drifted into the body-text margin. Replace them with a fixed-width marker gutter (sized for two digits) shared by `ol` and `ul`, with `ol` numbering driven by the `list-item` counter. Markers now share one column, decimal points align, and list text starts at the same offset regardless of marker width. The marker is absolutely positioned so it works for both tight and loose (block `<p>`) list items.
- **Task lists** — GFM leaves a `disc` bullet on `- [ ]` items, so they rendered as `• ☐ item`. Hide the bullet and seat the checkbox in the same marker gutter as ordered/unordered lists, so task text lines up with every other list.
- **Footnotes** — the GFM footnote section rendered with a full-size heading and body-size, full-brightness text with no separation from the content. Add a top-border separator, a small muted label, and compact muted definition text.
