---
'@ciderpress/ui': patch
---

Hero eyebrow renders, and vertical tabs stop wedging the CTA mid-panel

The hero eyebrow never appeared. The sync engine reads `hero.label` from
config and emits it to frontmatter as `eyebrow`, but the theme read
`label` back, which the frontmatter never carries. The value was always
`undefined`, so the chip silently rendered nothing.

Blank copy now collapses to `undefined` rather than an empty node. An
empty-but-defined node slips past the "omit this element" checks and
paints a styled shell with no content in it, which showed up as a stray
pill above the headline. This applies to the tagline too, which had the
same latent bug.

On a `tabs` block with `orientation: 'vertical'`, the panel CTA rendered
between the body copy and the visual. Vertical stacks copy above visual,
so a CTA closing the copy column lands mid-panel. It now renders after
the visual on that axis. Horizontal is unchanged: its columns sit side by
side, where closing the copy column is already correct.
