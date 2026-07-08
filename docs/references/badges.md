---
title: Badges & Statuses
description: Label pages with badges like ALPHA or WIP — ad-hoc via `badge`, named via the `status` registry — rendered in the sidebar and breadcrumb.
status: new
---

# Badges & Statuses

Badges are small labels — `ALPHA`, `WIP`, `Deprecated` — attached to a page. They render in **both** the sidebar (next to the page's nav item) and the breadcrumb (right of the trail). Attach one two ways:

- **`badge`** — an ad-hoc label defined inline on the page.
- **`status`** — a reference to a named, documented preset in the [status registry](#status).

```md
---
title: Streaming API
status: alpha        # named status → Alpha chip + its description tooltip
badge: v2            # ad-hoc badge, renders alongside
---
```

> This is the page-level badge. It is distinct from the inline [`<Badge>`](/reference/built-ins/badge) component you drop into markdown content.

## `badge`

An ad-hoc badge. Accepts a string shorthand, a full object, or an array of either.

```md
---
badge: ALPHA                                   # shorthand → neutral chip
---
```

```md
---
badge:
  - { text: WIP, variant: warning, tooltip: Work in progress }
  - v2
---
```

| Field     | Type           | Default     | Description                                              |
| --------- | -------------- | ----------- | -------------------------------------------------------- |
| `text`    | `string`       | —           | Chip label                                               |
| `variant` | `BadgeVariant` | `'neutral'` | Theme-aware color; ignored when `color` is set           |
| `color`   | `string`       | —           | Raw color (hex/rgb/hsl) — overrides `variant`            |
| `tooltip` | `string`       | `text`      | Hover tooltip text                                       |

`BadgeVariant` is one of `info`, `success`, `warning`, `danger`, `neutral`.

## `status`

A status is a **named badge preset** — define the label, meaning, and color once; reference it by `id` everywhere. Reference one (or several) with the `status` field:

```md
---
status: beta
---
```

```md
---
status: [beta, internal]
---
```

The status's `title` becomes the chip text, its `color`/`variant` the color, and its `description` the hover tooltip.

### Built-in statuses

Shipped by default, with theme-aware variants:

| id             | Label        | Variant   | Meaning (tooltip)                                             |
| -------------- | ------------ | --------- | ------------------------------------------------------------ |
| `alpha`        | Alpha        | `warning` | Early and unstable — APIs may change or break without notice. |
| `beta`         | Beta         | `info`    | Feature-complete but still stabilizing; minor changes possible. |
| `wip`          | WIP          | `warning` | Work in progress — incomplete and subject to change.         |
| `experimental` | Experimental | `warning` | Experimental — may change or be removed at any time.         |
| `new`          | New          | `success` | Recently added.                                              |
| `stable`       | Stable       | `success` | Stable and safe for production use.                          |
| `deprecated`   | Deprecated   | `danger`  | Deprecated — scheduled for removal; migrate away.            |
| `internal`     | Internal     | `neutral` | Internal — not part of the public API.                       |
| `planned`      | Planned      | `neutral` | Planned — not yet available.                                 |

### Custom statuses

Define or override statuses in the top-level `statuses` config. Entries merge over the built-ins **by `id`** — a matching `id` overrides, a new `id` extends.

```ts
defineConfig({
  statuses: [
    // override a built-in
    { id: 'alpha', title: 'Alpha', description: 'Early access — expect changes.', variant: 'warning' },
    // add your own (raw color)
    { id: 'design-partner', title: 'Design Partner', description: 'Available to design partners only.', color: '#7c3aed' },
  ],
})
```

| Field         | Type           | Required | Description                                    |
| ------------- | -------------- | -------- | ---------------------------------------------- |
| `id`          | `string`       | yes      | Reference handle used by `status: <id>`        |
| `title`       | `string`       | yes      | Chip label                                     |
| `description` | `string`       | yes      | Hover tooltip (and future status legend)       |
| `variant`     | `BadgeVariant` | no       | Theme-aware color; ignored when `color` is set |
| `color`       | `string`       | no       | Raw color — overrides `variant`                |

## Glob rules

Apply a badge or status to many pages by route without touching each file. Rules live in the top-level `badges` config; each rule needs a `match` and at least one of `badge` or `status`.

```ts
defineConfig({
  badges: [
    { match: '/api/experimental/**', status: 'alpha' },
    { match: ['/v2/**', '/beta/**'], badge: { text: 'v2', variant: 'info' } },
  ],
})
```

`match` supports `*` (one path segment), `**` (any depth), and `?` (one character).

## Precedence

A page's badge comes from the first of these that resolves — sources do not merge across tiers:

1. the page's own frontmatter (`badge` / `status`),
2. an inherited `defaults` badge/status on a parent `Page` or `Workspace`,
3. a matching glob rule.

Within a single source, `status` and `badge` both render.

## Where badges render

| Surface        | Behavior                                                                 |
| -------------- | ------------------------------------------------------------------------ |
| Sidebar item   | Chip after the page label. Long labels truncate with an ellipsis.        |
| Breadcrumb     | Chip right of the trail on the page.                                     |
| Collapsible group that is also a doc | No sidebar chip (it would collide with the collapse toggle) — the badge shows on the page's breadcrumb instead. |

## References

- [Configuration](/reference/configuration) — the `badges` and `statuses` config keys
- [Frontmatter Fields](/reference/frontmatter) — the `badge` and `status` page fields
- [`<Badge>` component](/reference/built-ins/badge) — the inline badge for markdown content
