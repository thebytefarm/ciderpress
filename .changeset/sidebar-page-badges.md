---
'@ciderpress/config': minor
'@ciderpress/cli': minor
'@ciderpress/ui': minor
---

Add page badges and a named status registry.

Badges are labels like `ALPHA` or `WIP` that render in **both** the sidebar and the breadcrumb. Declare one ad-hoc in a page's frontmatter (`badge`), reference a named status (`status`), inherit across a section via `defaults`, or apply by route with top-level `badges` glob rules. Frontmatter and `defaults` win over glob rules.

**Statuses** are the semantic layer over badges: a named, documented preset (`title` + `description` + color) you define once and reference by `id`. Ciderpress ships built-in defaults (`alpha`, `beta`, `wip`, `experimental`, `new`, `stable`, `deprecated`, `internal`, `planned`); your `statuses` entries merge over them by `id`. A status's `description` becomes the chip's hover tooltip.

```md
---
title: Streaming API
status: alpha # named status → Alpha chip + its description tooltip
badge: v2 # ad-hoc badge, coexists
---
```

```ts
defineConfig({
  // route-based rules (global — badges show in sidebar + breadcrumb)
  badges: [{ match: '/api/experimental/**', status: 'alpha' }],
  // override or extend the built-in status registry
  statuses: [
    { id: 'alpha', title: 'Alpha', description: 'Early and unstable…', variant: 'warning' },
  ],
})
```

Badges also render on the child cards of auto-generated section landing pages. A collapsible group that is also a doc hides its sidebar badge by default (to avoid the collapse chevron) — set `sidebar.groupBadges: true` to show it there too.

Long titles truncate with an ellipsis and reveal the full text on hover — in the sidebar, the breadcrumb, and the "On this page" outline.

- **`@ciderpress/config`** — `Badge` / `BadgeConfig` / `BadgeVariant` / `BadgeInput` / `BadgeRule` / `Status` types; `Frontmatter.badge` + `Frontmatter.status`; top-level `badges` (glob rules) and `statuses` (registry); a shared badge wire-format (`encodeBadges` / `decodeBadges` / `normalizeBadgeInput`) and status resolver (`DEFAULT_STATUSES` / `resolveStatuses` / `resolveStatusBadges` / `statusToBadge`).
- **`@ciderpress/cli`** — sync resolves badges + statuses (file frontmatter → `defaults` → glob, first source wins) and emits them as Rspress sidebar `tag`s plus a route→badges map (`.generated/badges.json`). A collapsible group that is also a doc gets no sidebar tag (its badge shows on the page instead).
- **`@ciderpress/ui`** — a `Tag` override renders badge chips (variant color, custom-color tint, hover tooltip), delegating other tags to Rspress; badges also render beside the breadcrumb via `themeConfig.pageBadges`; sidebar, breadcrumb, and outline entries get single-line ellipsis with a `title` tooltip on overflow.
