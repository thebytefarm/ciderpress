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

| Field           | Type                                           | Default | Description                                                                                                |
| --------------- | ---------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| `title`         | `string`                                       | —       | Page title (used in sidebar, browser tab, SEO)                                                             |
| `titleTemplate` | `string \| boolean`                            | —       | Title template override (`%s` is page title)                                                               |
| `description`   | `string`                                       | —       | Meta description for SEO and card previews                                                                 |
| `layout`        | `string`                                       | `'doc'` | Page layout mode — `'doc'` / `'page'` / `'home'` ship out of the box (see [Layout values](#layout-values)) |
| `sidebar`       | `boolean`                                      | `true`  | Show or hide the sidebar                                                                                   |
| `aside`         | `boolean \| 'left'`                            | `true`  | Table of contents position                                                                                 |
| `outline`       | `false \| number \| [min, max] \| 'deep'`      | —       | Outline heading depth                                                                                      |
| `navbar`        | `boolean \| { width?: 'container' \| 'full' }` | `true`  | Show or hide the top navigation bar, or configure its width (see [Navbar width](#navbar-width))            |
| `editLink`      | `boolean`                                      | `true`  | Show or hide the "Edit this page" link                                                                     |
| `lastUpdated`   | `boolean`                                      | `true`  | Show or hide the last updated timestamp                                                                    |
| `footer`        | `boolean`                                      | `true`  | Show or hide the page footer                                                                               |
| `pageClass`     | `string`                                       | —       | Custom CSS class added to the page container                                                               |
| `head`          | `[string, Record<string, string>][]`           | —       | Extra elements injected into `<head>` (see below)                                                          |
| `seo`           | `PageSeoConfig`                                | —       | Canonical, crawler, Open Graph, and Twitter overrides (see below)                                          |
| `badge`         | `string \| BadgeConfig \| array`               | —       | Ad-hoc page badge(s) shown in the sidebar and breadcrumb (see [Badges](/reference/badges))                 |
| `status`        | `string \| string[]`                           | —       | Named status id(s) from the registry (see [Badges](/reference/badges))                                     |

## Layout values

| Value    | Description                                                      |
| -------- | ---------------------------------------------------------------- |
| `'doc'`  | Standard documentation layout with sidebar and table of contents |
| `'page'` | Full-width page with no sidebar or table of contents             |
| `'home'` | Home page layout with hero section and feature cards             |

## Navbar width

Set `navbar.width` in page frontmatter independently of the page layout:

```yaml
---
pageType: custom
navbar:
  width: container
---
```

- `container` aligns the navigation with the home page frame and its theme-defined max width.
- `full` spans the viewport like documentation navigation.
- Omit `width` to keep existing behavior: home pages use `container`; other page types use `full`.

`navbar: false` hides the navigation. `navbar: true` or an object shows it. No `enabled` property is needed.

The same option works in config-side `Page.defaults` and `Workspace.defaults`:

```ts
{
  title: 'Features',
  path: '/features',
  include: 'docs/features.mdx',
  defaults: { navbar: { width: 'container' } },
}
```

Per-file frontmatter replaces the config-default `navbar` value; it is not deep-merged. For example, `navbar: true` restores the page type's default width even when config defaults set a width. The `width` option changes only navigation width, not the page layout, sidebar, or footer.

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

## SEO

All page-specific search and social overrides are nested under `seo`:

```yaml
---
title: Configuration
description: Complete reference for configuring Ciderpress.
seo:
  title: Ciderpress Configuration Reference
  canonical: https://ciderpress.dev/reference/configuration
  socialImage: /social/configuration.png
  robots:
    index: true
    follow: true
  openGraph:
    type: article
  twitter:
    card: summary_large_image
    creator: '@ciderpress'
---
```

| Field         | Type                           | Default                 | Description                                   |
| ------------- | ------------------------------ | ----------------------- | --------------------------------------------- |
| `title`       | `string`                       | page `title`            | Search and social title override              |
| `description` | `string`                       | page `description`      | Search and social description override        |
| `canonical`   | `string \| false`              | `seo.origin` plus route | Absolute canonical URL, or `false` to omit    |
| `socialImage` | `string`                       | site default            | Open Graph and Twitter image override         |
| `robots`      | `RobotsConfig`                 | site default            | Per-page `index` and `follow` directives      |
| `openGraph`   | `PageOpenGraphConfig \| false` | site default            | Open Graph title, description, type, or image |
| `twitter`     | `PageTwitterConfig \| false`   | site default            | Twitter title, description, card, or creator  |

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
