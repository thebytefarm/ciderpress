---
'@ciderpress/cli': patch
'ciderpress': patch
---

Fix relative Markdown link rewriting when the display text repeats the destination path. Preserve link labels, optional titles, and formatting while rewriting only the destination.
