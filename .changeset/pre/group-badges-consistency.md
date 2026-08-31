---
'@ciderpress/config': minor
'@ciderpress/cli': minor
---

Make group badges consistent across every surface, and restructure the `badges` config.

A collapsible group that is also a doc (a nav row that both toggles children and links to a page) previously hid its badge in the **sidebar** but still rendered it in the breadcrumb and section cards — so a group badge showed in some places but not others, unlike a normal page. Suppression is now uniform: when a group's badge is hidden, it's hidden on the sidebar, breadcrumb, and cards together; when enabled, it surfaces everywhere at once.

The toggle that controls this also moved. Because it now governs every surface (not just the sidebar), it is no longer `sidebar.groupBadges`. The top-level `badges` config is now an object: glob rules live under `rules`, and the new `group` flag controls collapsible-doc group badges.

```ts
// before
defineConfig({
  badges: [{ match: '/api/**', status: 'beta' }],
  sidebar: { groupBadges: true },
})

// after
defineConfig({
  badges: {
    rules: [{ match: '/api/**', status: 'beta' }],
    group: true,
  },
})
```

**Breaking:**

- `badges` is now `{ rules?: BadgeRule[]; group?: boolean }` instead of `BadgeRule[]`. Wrap existing rule arrays in `{ rules: [...] }`.
- `sidebar.groupBadges` is removed — use `badges.group` instead.
- New `BadgesConfig` type exported from `@ciderpress/config`.

Named statuses are unchanged — keep defining them under the top-level `statuses` array.
