---
'@ciderpress/ui': patch
'ciderpress': patch
---

Split bundled Iconify collections into per-collection async chunks

`@ciderpress/ui` previously statically imported all nine `@iconify-json`
collections (`logos`, `simple-icons`, `devicon`, `vscode-icons`, `mdi`,
`skill-icons`, `catppuccin`, `material-icon-theme`, `pixelarticons`) into a
single eager ~26MB JS chunk pulled on every route. Because that resolved to one
module, bundler chunk-splitting could not break it apart — and a single file
over a host's per-file cap (Cloudflare Pages rejects files >25MB) failed
deploys outright with no config knob to slim it.

The `Icon` component now registers each collection on demand via a per-prefix
dynamic `import()`, so the site build emits one async chunk per collection
(largest is `logos` at ~7MB, well under the 25MB cap) and a page only downloads
the collections it actually references. No public API change — `<Icon icon="…" />`
is unchanged — and any arbitrary Iconify identifier from the bundled sets still
resolves.
