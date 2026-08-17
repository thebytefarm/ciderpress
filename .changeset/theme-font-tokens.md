---
'@ciderpress/theme': minor
'@ciderpress/ui': minor
---

Custom theme fonts reach every surface, including the homepage hero

A theme's `fonts.family` now drives the whole site. Previously a custom
theme could set `sans` and `mono` and see them apply to documentation
pages while the hero, nav, and feature cards stayed on the built-in
stacks.

Two things caused that. Component CSS hardcoded font stacks (the feature
card title was pinned to `Geist Pixel Square`), and the canonical tokens
were derived *from* the hardcoded compatibility variables rather than the
other way round, so a theme value could never win. The dependency is now
inverted: `--cp-font-family-*` and `--rp-font-family-*` all resolve
through `--cp-ff-sans`, `--cp-ff-mono`, and `--cp-ff-display`.

Rspress ships an unlayered `body { font-family: var(--rp-font-family-base) }`,
and an unlayered rule outranks anything in a cascade layer no matter how
specific. Rather than fight that, themes now set `--rp-font-family-base`,
so Rspress's own rule resolves to the theme's font.

The slots are:

- `sans` base UI and prose: body, nav, sidebar, hero headline
- `mono` code, terminal chrome, eyebrow labels
- `display` optional decorative face, falls back to `sans`

`display` is new and optional. Built-in themes keep their current
appearance: `sans` stays proportional and `mono` owns code.
