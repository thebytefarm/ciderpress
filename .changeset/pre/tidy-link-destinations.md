---
'@ciderpress/cli': patch
'ciderpress': patch
---

Fix relative Markdown link rewriting when the display text repeats the destination path or contains link-like inline code. Preserve code spans, link labels, optional titles, and formatting while rewriting only the destination.
