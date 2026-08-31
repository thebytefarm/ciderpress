---
'@ciderpress/ui': patch
---

Render the hero eyebrow

`hero.label` never reached the page. The sync engine reads it from config
and emits it to frontmatter as `eyebrow`, but the theme read `label` back,
which the frontmatter never carries. The value was always `undefined`, so
the chip silently rendered nothing.

Blank copy now collapses to `undefined` rather than an empty node. An
empty-but-defined node slips past the "omit this element" checks and
paints a styled shell with no content in it, which surfaced as a stray
pill above the headline. The tagline had the same latent bug.
