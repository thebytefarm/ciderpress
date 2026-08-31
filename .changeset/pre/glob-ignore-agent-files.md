---
'@ciderpress/cli': patch
'ciderpress': patch
---

Skip agent instruction files during glob discovery

Content globs (`docs/**/*.md`, workspace `docs/*.md`, recursive includes, and
`.planning/`) no longer sweep coding-agent instruction files into the site.
`CLAUDE.md`, `AGENTS.md`, `AGENT.md`, and `GEMINI.md` are now excluded from glob
matches.

Matching is case-sensitive against the uppercase convention only — a lowercase
`claude.md` is treated as ordinary content. Naming one of these files directly
with a literal (non-glob) `include` still publishes it, so the deny list only
affects glob discovery.
