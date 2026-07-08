---
'@ciderpress/cli': patch
---

Fix top-level (depth-0) leaf pages rendering as collapsible sidebar groups with a dead chevron.

A `pages[]` entry that is a leaf (`include`/`content`, no `pages` children) placed at the top level was written to the root `_meta.json` as a `dir` item regardless of whether it had children, so Rspress rendered it as an empty expandable group. The root meta now gates the `dir`/`file` distinction on whether the entry has children — matching the treatment already applied to nested and root-promoted entries — so a depth-0 leaf renders as a plain link.
