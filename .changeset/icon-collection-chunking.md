---
'@ciderpress/ui': patch
'ciderpress': patch
---

Load icon sets more efficiently

Ciderpress no longer ships every bundled icon set to every page. Icons render
exactly as before, but a page now loads only the icon sets it actually uses.

This also fixes deploys to hosts with a per-file size limit — most notably
Cloudflare Pages, where the previous single large icon file was rejected and
blocked the deploy.
