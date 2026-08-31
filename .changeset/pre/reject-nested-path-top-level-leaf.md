---
'@ciderpress/config': patch
---

Reject top-level leaf pages with a nested path during config validation.

A visible leaf page (no `pages`) placed directly in `config.pages` renders as a top-level sidebar link, which resolves to a file at the content root. A nested `path` (e.g. `/getting-started/introduction`) files the page a directory deep, so the generated root `_meta.json` entry pointed at a file that wasn't there — a silent dead link in the sidebar. Config validation now fails with an actionable message telling you to use a single-segment path or nest the page under a section with `pages`.
