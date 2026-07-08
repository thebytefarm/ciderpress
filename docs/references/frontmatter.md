---
title: Frontmatter Fields
description: Complete reference for all frontmatter fields supported by ciderpress pages.
---

# Frontmatter Fields

ciderpress pages support standard Rspress frontmatter fields. Frontmatter is defined in YAML at the top of markdown files **or** injected via the `defaults` field on a `Page` / `Workspace` (renamed from the legacy `frontmatter` field — same type, different name).

```md
---
title: My Page
description: A short summary of this page.
---

# My Page
```

See the [Content](/concepts/content#frontmatter-and-defaults) concept for injection and inheritance patterns.

## Standard fields

| Field           | Type                                      | Default | Description                                                                                                |
| --------------- | ----------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| `title`         | `string`                                  | —       | Page title (used in sidebar, browser tab, SEO)                                                             |
| `titleTemplate` | `string \| boolean`                       | —       | Title template override (`%s` is page title)                                                               |
| `description`   | `string`                                  | —       | Meta description for SEO and card previews                                                                 |
| `layout`        | `string`                                  | `'doc'` | Page layout mode — `'doc'` / `'page'` / `'home'` ship out of the box (see [Layout values](#layout-values)) |
| `sidebar`       | `boolean`                                 | `true`  | Show or hide the sidebar                                                                                   |
| `aside`         | `boolean \| 'left'`                       | `true`  | Table of contents position                                                                                 |
| `outline`       | `false \| number \| [min, max] \| 'deep'` | —       | Outline heading depth                                                                                      |
| `navbar`        | `boolean`                                 | `true`  | Show or hide the top navigation bar                                                                        |
| `editLink`      | `boolean`                                 | `true`  | Show or hide the "Edit this page" link                                                                     |
| `lastUpdated`   | `boolean`                                 | `true`  | Show or hide the last updated timestamp                                                                    |
| `footer`        | `boolean`                                 | `true`  | Show or hide the page footer                                                                               |
| `pageClass`     | `string`                                  | —       | Custom CSS class added to the page container                                                               |
| `head`          | `[string, Record<string, string>][]`      | —       | Extra elements injected into `<head>` (see below)                                                          |
| `badge`         | `string \| BadgeConfig \| array`          | —       | Ad-hoc page badge(s) shown in the sidebar and breadcrumb (see [Badges](/reference/badges))                 |
| `status`        | `string \| string[]`                      | —       | Named status id(s) from the registry (see [Badges](/reference/badges))                                     |

## Layout values

| Value    | Description                                                      |
| -------- | ---------------------------------------------------------------- |
| `'doc'`  | Standard documentation layout with sidebar and table of contents |
| `'page'` | Full-width page with no sidebar or table of contents             |
| `'home'` | Home page layout with hero section and feature cards             |

## Outline values

| Value        | Description                                         |
| ------------ | --------------------------------------------------- |
| `false`      | Disable the outline entirely                        |
| `number`     | Show headings up to this depth (e.g. `3` for h1–h3) |
| `[min, max]` | Show headings within a depth range (e.g. `[2, 4]`)  |
| `'deep'`     | Show all heading levels                             |

## Aside values

| Value    | Description                                   |
| -------- | --------------------------------------------- |
| `true`   | Show table of contents on the right (default) |
| `'left'` | Show table of contents on the left            |
| `false`  | Hide the table of contents                    |

## Head format

The `head` field accepts an array of tuples. Each tuple is `[tagName, attributes]`:

```yaml
head:
  - - meta
    - name: og:title
      content: My Page
  - - link
    - rel: canonical
      href: https://example.com/my-page
```

Equivalent injected via `Page.defaults` in the config:

```ts
{
  title: 'Architecture',
  path: '/architecture',
  include: 'docs/architecture.md',
  defaults: {
    head: [
      ['meta', { name: 'og:title', content: 'My Page' }],
      ['link', { rel: 'canonical', href: 'https://example.com/my-page' }],
    ],
  },
}
```

## Custom fields

The two surfaces have different rules:

- **YAML frontmatter** in `.md` / `.mdx` source files — arbitrary keys are accepted and passed through to Rspress's page data object. Use these for metadata that theme components or plugins consume.
- **Config-side `defaults`** — validated against a `.strict()` Zod schema. Only the fields documented above are accepted; unknown keys fail at config load time with a clear error.

```yaml
---
title: API Routes
category: reference
difficulty: advanced
---
```

Custom fields are accessible in theme components via the page data object.
