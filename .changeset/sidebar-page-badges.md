---
'@ciderpress/config': minor
'@ciderpress/cli': minor
'@ciderpress/ui': minor
---

Add sidebar page badges — labels like `ALPHA` or `WIP` on sidebar items.

Declare a badge in a page's frontmatter, inherit one across a section via `defaults`, or apply one by route with glob rules under `sidebar.badges`. Frontmatter and `defaults` win over glob rules. Long sidebar titles now truncate with an ellipsis and show the full text on hover.

```md
---
title: Streaming API
badge: ALPHA
---
```

```ts
sidebar: {
  badges: [{ match: '/api/experimental/**', badge: { text: 'ALPHA', variant: 'warning' } }],
}
```

- **`@ciderpress/config`** — new `Badge`, `BadgeConfig`, `BadgeVariant`, `BadgeInput`, and `BadgeRule` types; `Frontmatter.badge` and `SidebarConfig.badges` fields; a shared badge wire-format (`encodeBadges` / `decodeBadges` / `normalizeBadgeInput`) so the CLI and theme stay in sync. A badge is a string shorthand or `{ text, variant, color, tooltip }`; variants are `info | success | warning | danger | neutral`.
- **`@ciderpress/cli`** — sync resolves badges (file frontmatter → `defaults` → glob rule, first match wins) and emits them as Rspress sidebar `tag`s on `_meta.json` items.
- **`@ciderpress/ui`** — a `Tag` override renders badge chips with variant color, custom-color tint, and a hover tooltip, delegating any non-ciderpress tag to Rspress's native rendering; sidebar labels get single-line ellipsis with a `title` tooltip on overflow.
