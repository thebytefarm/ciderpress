---
'@ciderpress/cli': patch
'@ciderpress/ui': patch
'ciderpress': patch
---

Avoid downloading the full MDI icon collection for fixed theme controls. Keep custom icon collection loading unchanged, and skip Markdown parsing when a page has no link destinations to rewrite.
