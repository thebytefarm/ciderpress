---
'@ciderpress/cli': patch
'@ciderpress/ui': patch
'ciderpress': patch
---

Fix Copy Markdown on OpenAPI pages

Copying markdown from a generated OpenAPI reference page produced nothing, and
the pages were missing from `llms.txt`. The generated MDX stored its
pre-rendered markdown in an `export const markdown`, but Rspress strips ESM
exports during its static markdown pass — so the value was `undefined` when the
page rendered to `.md`, producing a zero-byte file. The docs-bar Copy Markdown
button (which fetches that `.md`) therefore copied nothing.

The markdown is now inlined directly into the page components so it survives the
static markdown pass. OpenAPI pages now expose their full markdown to the copy
button, `.md` endpoints, and `llms.txt`.

This also removes the redundant in-content copy button that had been added as a
workaround on OpenAPI pages — the docs-bar button is now the single, working
copy affordance, consistent with every other page.
