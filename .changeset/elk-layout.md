---
'@ciderpress/ui': minor
---

Register the ELK layout loaders for Mermaid. Diagrams that opt in with `layout: elk` now render instead of silently blanking. The ELK engine (and its worker) loads lazily in the browser only when a diagram requests it, so build output and edge/Cloudflare builds are unaffected.
