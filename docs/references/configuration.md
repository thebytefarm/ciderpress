---
title: Configuration
description: Complete reference for ciderpress.config.ts — every top-level key, every shape, every primitive.
---

# Configuration

All configuration lives in `ciderpress.config.ts` at your repo root. Use `defineConfig` for type safety and autocompletion.

```ts
import { defineConfig } from 'ciderpress'

export default defineConfig({
  title: 'My Docs',
  description: 'Project documentation',
  pages: [{ title: 'Introduction', path: '/intro', include: 'docs/intro/*.md' }],
})
```

Configuration is loaded via [c12](https://github.com/unjs/c12). Supported file formats: `.ts`, `.mts`, `.js`, `.mjs`, `.json`, `.jsonc`, `.yml`, `.yaml`.

`pages` is the only required field. Every other top-level key is optional — minimal config produces a clean site with zero framework branding.

## Site identity

Top-level scalar fields that identify the site itself.

| Field         | Type     | Required | Description                                                                             |
| ------------- | -------- | -------- | --------------------------------------------------------------------------------------- |
| `title`       | `string` | yes      | Site title shown in browser tab, topbar, and (when copyright is auto) the footer notice |
| `description` | `string` | no       | Meta description and home page hero headline                                            |
| `base`        | `string` | no       | Base URL the site is deployed under (e.g. `'/'`, `'/docs/'`)                            |
| `version`     | `string` | no       | Version label rendered next to the brand in the topbar (e.g. `'v1.0'`). Omit to hide    |

```ts
defineConfig({
  title: 'Acme',
  description: 'Documentation for the Acme platform',
  base: '/',
  version: 'v1.0',
  pages: [
    /* ... */
  ],
})
```

## `brand`

Brand chrome — icon, wordmark, hero background, favicon, and the inline FOUC loader. Defaults to invisible: omit any field to render nothing in that slot.

```ts
brand: {
  icon:    IconConfig,
  logo:    string | LogoFn,
  banner:  string | BannerFn,
  favicon: ImageSource,
  loader:  'apple' | 'classic' | false | LoaderConfig,
}
```

| Field     | Type                                            | Description                                                                          |
| --------- | ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| `icon`    | `IconConfig`                                    | Small chip rendered before the wordmark in the topbar. See [IconConfig](#iconconfig) |
| `logo`    | `string \| LogoFn`                              | Wordmark in the topbar — image path or `({ theme }) => LogoImage \| ReactNode`       |
| `banner`  | `string \| BannerFn`                            | Hero background — image path or function returning an `ImageSource` or React node    |
| `favicon` | `ImageSource`                                   | Browser-tab icon. See [ImageSource](#imagesource)                                    |
| `loader`  | `'apple' \| 'classic' \| false \| LoaderConfig` | Inline FOUC loader. `false` disables it; pass `LoaderConfig` for a custom component  |

### BannerFn

```ts
type BannerFn = (params: { theme: LogoContext }) => ImageSource | React.ReactNode
```

The function receives the active theme context and returns either an image source or a React node. Use the React-node variant for SVG-defined hero art that needs to respond to theme tokens.

```ts
brand: {
  banner: ({ theme }) => ({
    src: theme.variant === 'dark' ? '/banner-dark.svg' : '/banner-light.svg',
    alt: 'Acme banner',
  }),
}
```

### LoaderConfig

```ts
type LoaderConfig =
  | {
      content: string
      label?: string
      minDisplayMs?: number
      maxDisplayMs?: number
    }
  | {
      component: ComponentType
      label?: string
      minDisplayMs?: number
      maxDisplayMs?: number
    }
```

| Variant     | Description                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------- |
| `content`   | Static SVG/img string rendered as the loader backdrop                                           |
| `component` | Custom React component. Renders post-hydration; the pre-hydration fallback is the backdrop only |

`label` is read by screen readers. `minDisplayMs` and `maxDisplayMs` clamp visible duration so the loader doesn't flash or hang.

## `theme`

Theming uses a **single array** of theme entries. The first entry is the default unless one is explicitly marked. Both the named-theme picker and the light/dark variant toggle are independent — `themeSwitcher` and `variantSwitcher`.

```ts
theme: {
  themes:           ThemeEntry[],
  defaultVariant?:  'light' | 'dark' | 'system',
  themeSwitcher?:   boolean,
  variantSwitcher?: boolean,
  overrides?:       Partial<ThemeColors>,
}
```

| Field             | Type                            | Default                                                           | Description                                                                                         |
| ----------------- | ------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `themes`          | `ThemeEntry[]`                  | `['mulled']` (when `theme` is omitted)                            | Mix of built-in theme names and custom `Theme` objects. First entry is default unless one is marked |
| `defaultVariant`  | `'light' \| 'dark' \| 'system'` | active theme's own `defaultVariant` (`'dark'` for every built-in) | Initial light/dark variant. `'system'` defers to the active theme's declared default                |
| `themeSwitcher`   | `boolean`                       | `true` when `themes.length > 1`                                   | Show the named-theme picker in the topbar                                                           |
| `variantSwitcher` | `boolean`                       | `true`                                                            | Show the light/dark toggle in the topbar (auto-hidden when the active theme has only one variant)   |
| `overrides`       | `Partial<ThemeColors>`          | —                                                                 | Override individual color tokens across every theme in `themes`                                     |

### ThemeEntry

```ts
type ThemeEntry =
  | BuiltInThemeName
  | ThemeInput
  | { name: BuiltInThemeName; default?: boolean }
  | (ThemeInput & { default?: boolean })
```

Built-in names and full custom theme definitions share the same array. Either form accepts a `default: true` marker to override the "first entry wins" rule.

```ts
theme: {
  themes: [
    'honeycrisp',
    {
      name: 'acme',
      default: true,
      colors: {
        brand: '#ff5a1f',
        text:  '#1a1a1a',
      },
    },
  ],
  defaultVariant:  'dark',
  themeSwitcher:   true,
  variantSwitcher: true,
}
```

## `pages`

The information architecture tree. Required. Each entry is a `Page` — the same shape used for leaf documents, sidebar groups, and glob-discovered sections.

Renamed from `sections` (Page replaces the old `Section` interface). Children live on `Page.pages` (renamed from `items`).

### Page

```ts
interface Page {
  // ---- Identity ----
  title: TitleConfig
  description?: string
  path?: string
  icon?: IconConfig

  // ---- Source (declare exactly one) ----
  include?: string | string[]
  content?: string | (() => string | Promise<string>)
  pages?: Page[]

  // ---- Navigation behavior ----
  nav?: {
    hidden?: boolean
    collapsible?: boolean
    island?: boolean
    root?: boolean
  }

  // ---- Landing page ----
  landing?: boolean

  // ---- Card behavior ----
  card?: CardConfig

  // ---- Default page metadata ----
  defaults?: Frontmatter

  // ---- Glob-discovery options ----
  discover?: {
    sort?: SortStrategy
    recursive?: boolean
    ignore?: string[]
    indexFile?: string
  }

  // ---- Per-page integration ----
  openapi?: OpenAPISpec
}
```

#### Identity

| Field         | Type          | Required | Description                                                                          |
| ------------- | ------------- | -------- | ------------------------------------------------------------------------------------ |
| `title`       | `TitleConfig` | yes      | Static string or derivation rule for auto-discovered children                        |
| `description` | `string`      | no       | One-line description for this page's auto-generated landing card and OG meta         |
| `path`        | `string`      | no       | URL path this page mounts at (e.g. `/guides`). Omit for a sidebar-only grouping node |
| `icon`        | `IconConfig`  | no       | Icon rendered on the page's card and (when configured) in the sidebar                |

#### Source — declare exactly one

| Field     | Type                                          | Description                                           |
| --------- | --------------------------------------------- | ----------------------------------------------------- |
| `include` | `string \| string[]`                          | File path or glob string(s); children auto-discovered |
| `content` | `string \| (() => string \| Promise<string>)` | Inline Markdown/MDX string, or async generator        |
| `pages`   | `Page[]`                                      | Explicit child nodes (renamed from `items`)           |

#### `nav.*` — navigation behavior

Grouped together so per-page chrome flags don't sprawl across the top level of `Page`.

| Field             | Type      | Default | Description                                                                                                       |
| ----------------- | --------- | ------- | ----------------------------------------------------------------------------------------------------------------- |
| `nav.hidden`      | `boolean` | `false` | Hide this page (and children) from the sidebar entirely                                                           |
| `nav.collapsible` | `boolean` | `true`  | Render as a collapsible group in the sidebar                                                                      |
| `nav.island`      | `boolean` | `false` | Render as a sidebar island — children appear only when the user is inside this branch (renamed from `standalone`) |
| `nav.root`        | `boolean` | `false` | Mark as a sidebar root — only one root active at a time; the topbar treats it as the active workspace             |

#### Landing + card

| Field     | Type         | Default                        | Description                                                                    |
| --------- | ------------ | ------------------------------ | ------------------------------------------------------------------------------ |
| `landing` | `boolean`    | `true` for pages with children | Render an auto-generated landing page at this `path` listing children as cards |
| `card`    | `CardConfig` | —                              | How this page appears as a card on its parent's landing                        |

##### CardConfig

```ts
interface CardConfig {
  icon?: IconConfig
  scope?: string
  description?: string
  tags?: string[]
  badge?: { src: string; alt: string }
}
```

| Field         | Type                           | Description                                                                                 |
| ------------- | ------------------------------ | ------------------------------------------------------------------------------------------- |
| `icon`        | `IconConfig`                   | Card icon. Defaults to a rotating color based on position in the parent's landing card grid |
| `scope`       | `string`                       | Scope kicker rendered above the title (e.g. `'apps/'`, `'packages/'`)                       |
| `description` | `string`                       | One-line description rendered under the card title (overrides the page's own `description`) |
| `tags`        | `string[]`                     | Tag chips rendered below the description                                                    |
| `badge`       | `{ src: string; alt: string }` | Logo badge rendered in the card's top-right corner                                          |

Card content resolves from this priority order (highest first): `card.description` → source file frontmatter `description` → `Page.description`.

#### `defaults` — default page metadata

Renamed from `frontmatter`. Same `Frontmatter` type — values here are merged into every child page's frontmatter; per-file YAML wins on conflict.

```ts
{
  title: 'API Reference',
  defaults: { aside: 'left', editLink: false },
  pages: [
    { title: 'Auth',  path: '/api/auth',  include: 'docs/api/auth.md' },
    { title: 'Users', path: '/api/users', include: 'docs/api/users.md' },
  ],
}
```

#### `discover.*` — glob-discovery options

Only applies when `include` is a glob. Renamed from the flat `Section.{sort,recursive,exclude,entryFile}` fields.

| Field                | Type           | Default      | Description                                                                                                |
| -------------------- | -------------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| `discover.sort`      | `SortStrategy` | `'default'`  | Sort strategy for discovered children. See [SortStrategy](#sortstrategy)                                   |
| `discover.recursive` | `boolean`      | `true`       | Recurse into subdirectories                                                                                |
| `discover.ignore`    | `string[]`     | —            | Glob patterns ignored during discovery (renamed from `exclude` — gitignore vocab)                          |
| `discover.indexFile` | `string`       | `'overview'` | Filename treated as the page's own content instead of generating a landing page (renamed from `entryFile`) |

#### `openapi`

Per-page OpenAPI spec integration. Generates API operation pages under the page's `path`. See [OpenAPISpec](#openapispec) for the shape.

### Examples

**Leaf page from a single file:**

```ts
{
  title:   'Architecture',
  path:    '/architecture',
  include: 'docs/architecture.md',
}
```

**Group with explicit children:**

```ts
{
  title: 'Guides',
  path:  '/guides',
  pages: [
    { title: 'Quick Start', path: '/guides/quick-start', include: 'docs/guides/quick-start.md' },
    { title: 'Deployment',  path: '/guides/deployment',  include: 'docs/guides/deployment.md' },
  ],
}
```

**Glob-discovered section with discovery options:**

```ts
{
  title:       'Reference',
  path:        '/reference',
  description: 'API and CLI reference.',
  include:     'docs/reference/**/*.md',
  discover: {
    sort:      'alpha',
    recursive: true,
    ignore:    ['**/draft-*.md'],
    indexFile: 'overview',
  },
}
```

## `apps`, `packages`, `workspaces`

Top-level workspace surfaces. Kept flat — `apps` and `packages` are the common cases; `workspaces` is for arbitrary custom groups like "Integrations" or "Plugins".

```ts
apps:       Workspace[],
packages:   Workspace[],
workspaces: WorkspaceGroup[],
```

All three drive the home page card grid (via `home.showcase`), the auto-generated landing card on their parent, and the workspace introduction page.

### Workspace

```ts
interface Workspace {
  title: TitleConfig
  description: string
  path: string
  icon?: IconConfig
  tags?: string[]
  badge?: { src: string; alt: string }
  include?: string | string[]
  pages?: Page[]
  defaults?: Frontmatter
  discover?: {
    sort?: SortStrategy
    recursive?: boolean
    ignore?: string[]
    indexFile?: string
  }
  openapi?: OpenAPISpec
}
```

| Field         | Type                           | Required | Description                                                                             |
| ------------- | ------------------------------ | -------- | --------------------------------------------------------------------------------------- |
| `title`       | `TitleConfig`                  | yes      | Display name. Accepts the full `TitleConfig` (was plain `string`)                       |
| `description` | `string`                       | yes      | Short description for cards and the workspace landing page                              |
| `path`        | `string`                       | yes      | URL prefix for this workspace's documentation                                           |
| `icon`        | `IconConfig`                   | no       | Icon for the home card and sidebar header                                               |
| `tags`        | `string[]`                     | no       | Tech tags — case-insensitive, mapped to icons via the tech registry                     |
| `badge`       | `{ src: string; alt: string }` | no       | Logo badge rendered in the card's top-right corner                                      |
| `include`     | `string \| string[]`           | no       | Source file path(s) or glob pattern(s) for content discovery                            |
| `pages`       | `Page[]`                       | no       | Explicit child pages (mirrors `Page.pages`)                                             |
| `defaults`    | `Frontmatter`                  | no       | Default frontmatter injected into every discovered child page (mirrors `Page.defaults`) |
| `discover`    | (see Page)                     | no       | Glob-discovery options. Same shape as `Page.discover`                                   |
| `openapi`     | `OpenAPISpec`                  | no       | OpenAPI spec integration for this workspace                                             |

### WorkspaceGroup

```ts
interface WorkspaceGroup {
  title: string
  description?: string
  icon: IconConfig
  items: Workspace[]
  link?: string
}
```

| Field         | Type          | Required | Description                                                   |
| ------------- | ------------- | -------- | ------------------------------------------------------------- |
| `title`       | `string`      | yes      | Group display name                                            |
| `description` | `string`      | no       | Short description                                             |
| `icon`        | `IconConfig`  | yes      | Group icon. Accepts the full `IconConfig` (was `IconId` only) |
| `items`       | `Workspace[]` | yes      | Workspaces in the group (at least one)                        |
| `link`        | `string`      | no       | URL prefix override (defaults to `/${slugify(title)}`)        |

```ts
workspaces: [
  {
    title: 'Integrations',
    icon: { id: 'pixelarticons:integration', color: 'orange' },
    items: [{ title: 'Stripe', description: 'Payment processing', path: '/integrations/stripe' }],
  },
]
```

### OpenAPISpec

Per-page or per-workspace OpenAPI integration. The same shape lives on `Page.openapi` and `Workspace.openapi` — declare it once at the mount point you want the API operation pages to live under.

```ts
interface OpenAPISpec {
  spec: string
  path: string
  title?: string
  sidebarLayout?: 'method-path' | 'title'
}
```

| Field           | Type                       | Required | Description                                                                                                                            |
| --------------- | -------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `spec`          | `string`                   | yes      | Path to the OpenAPI document (`.json`, `.yaml`, or `.yml`), relative to the repo root                                                  |
| `path`          | `string`                   | yes      | URL path the API operation pages mount under (must start with `/`)                                                                     |
| `title`         | `string`                   | no       | Sidebar group title (default `'API Reference'`)                                                                                        |
| `sidebarLayout` | `'method-path' \| 'title'` | no       | How operations appear in the sidebar — `method-path` shows `GET /users`; `title` shows the operation summary (default `'method-path'`) |

When declared on a `Workspace`, `path` must be nested under the workspace's own `path` — that's checked at validate time. See the [OpenAPI reference](/reference/openapi) for a full walkthrough.

## `socials`

Root-level array of social links. Single source of truth — both `topbar.socials` and `footer.socials` reference this list via `true`.

```ts
socials: SocialLink[]
```

### SocialLink

```ts
interface SocialLink {
  icon: SocialLinkIcon | { svg: string }
  url: string
  label?: string
}
```

| Field   | Type                                | Required | Description                                    |
| ------- | ----------------------------------- | -------- | ---------------------------------------------- |
| `icon`  | `SocialLinkIcon \| { svg: string }` | yes      | Built-in icon name or custom SVG               |
| `url`   | `string`                            | yes      | Target URL                                     |
| `label` | `string`                            | no       | Accessible label (screen readers, hover title) |

The Rspress `mode`/`content` discriminator is no longer exposed — every link is a URL link.

Built-in `SocialLinkIcon` values:

```ts
import type { SocialLinkIcon } from '@ciderpress/config'

// 'discord' | 'facebook' | 'github' | 'instagram' | 'linkedin' | 'slack'
// | 'x' | 'youtube' | 'gitlab' | 'X' | 'bluesky' | 'npm'
```

Any icon outside this set must be supplied as `{ svg: '<svg>...</svg>' }`.

### Boolean reference pattern

`topbar.socials` and `footer.socials` accept either `true` (reuse root `socials`) or `SocialLink[]` (override with a specific list for that surface).

```ts
socials: [
  { icon: 'github',  url: 'https://github.com/acme'  },
  { icon: 'discord', url: 'https://discord.gg/acme'  },
],
topbar: { socials: true },                                  // mirror root list
footer: { socials: [{ icon: 'github', url: '...' }] },      // footer-specific
```

## `topbar`

Top navigation bar — nav items, primary CTA, social row, announcement banner.

```ts
topbar: {
  nav:           'auto' | NavItem[],
  cta?:          ButtonConfig,
  socials?:      true | SocialLink[],
  announcement?: AnnouncementConfig,
}
```

| Field          | Type                   | Description                                                       |
| -------------- | ---------------------- | ----------------------------------------------------------------- |
| `nav`          | `'auto' \| NavItem[]`  | Navigation items — see [auto rule](#nav-auto-rule)                |
| `cta`          | `ButtonConfig`         | Primary CTA button (also mirrored into the mobile nav)            |
| `socials`      | `true \| SocialLink[]` | `true` reuses root `socials`; array overrides for the topbar only |
| `announcement` | `AnnouncementConfig`   | Announcement banner rendered above the topbar                     |

### `nav: 'auto'` rule

> Auto-nav emits **one top-level entry per root `pages` entry that has a `path`**. Children are not flattened into dropdowns. Roots with `nav.hidden: true` are skipped. Workspaces declared via top-level `apps` / `packages` / `workspaces` are **not** included — they show on the home grid only. For dropdowns or workspace items in the topbar, use the explicit `NavItem[]` form.

### NavItem

```ts
interface NavItem {
  title: string
  link?: string
  items?: NavItem[]
  activeMatch?: string
}
```

| Field         | Type        | Required | Description                                                            |
| ------------- | ----------- | -------- | ---------------------------------------------------------------------- |
| `title`       | `string`    | yes      | Display text                                                           |
| `link`        | `string`    | leaf     | Target URL — required on leaf items, omitted when `items` is provided  |
| `items`       | `NavItem[]` | no       | Dropdown children — when present, this entry renders as a menu         |
| `activeMatch` | `string`    | no       | Regex pattern matched against the current URL for active-state styling |

### AnnouncementConfig

```ts
interface AnnouncementConfig {
  id?: string
  lead?: string
  message: string
  cta?: { href: string; label: string }
  persistent?: boolean
}
```

| Field        | Type                              | Description                                                        |
| ------------ | --------------------------------- | ------------------------------------------------------------------ |
| `id`         | `string`                          | Stable id — when present, dismissal persists in `localStorage`     |
| `lead`       | `string`                          | Highlighted lead phrase rendered before the message (e.g. `"NEW"`) |
| `message`    | `string`                          | Body text                                                          |
| `cta`        | `{ href: string, label: string }` | Optional CTA appended after the message                            |
| `persistent` | `boolean`                         | When `true`, hides the dismiss button                              |

## `sidebar`

Persistent sidebar chrome — links pinned above and below the nav tree, plus the optional promo card.

```ts
sidebar: {
  top?:    SidebarLink[],
  bottom?: SidebarLink[],
  promo?:  SidebarPromo,
}
```

| Field         | Type            | Description                                                                                             |
| ------------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| `top`         | `SidebarLink[]` | Links rendered above the sidebar nav tree (renamed from `above`)                                        |
| `bottom`      | `SidebarLink[]` | Links rendered below the sidebar nav tree (renamed from `below`)                                        |
| `promo`       | `SidebarPromo`  | Promo card pinned to the bottom of the docs sidebar                                                     |
| `groupBadges` | `boolean`       | Show badges on collapsible group items that are also docs. Defaults to `false` (see [Badges](/reference/badges#where-badges-render)) |

### SidebarLink

Sidebar links use [`ButtonConfig`](#buttonconfig) directly — no separate type. The same `text`/`href`/`variant`/`shape`/`icon` vocabulary as every other button surface.

```ts
sidebar: {
  top: [
    { text: 'Home',   href: '/',                       icon: 'pixelarticons:home',   variant: 'ghost' },
  ],
  bottom: [
    { text: 'GitHub', href: 'https://github.com/acme', icon: 'pixelarticons:github', variant: 'secondary' },
  ],
}
```

### SidebarPromo

```ts
interface SidebarPromo {
  title: string
  body: string
  cta: ButtonConfig
}
```

| Field   | Type           | Description    |
| ------- | -------------- | -------------- |
| `title` | `string`       | Promo headline |
| `body`  | `string`       | Body copy      |
| `cta`   | `ButtonConfig` | CTA button     |

## `badges`

Glob rules that apply a badge — or a named [status](#statuses) — to every page whose route path matches, without touching each file. Badges render in both the sidebar and the breadcrumb. A page's own frontmatter or `defaults` badge/status wins over a rule. See the [Badges](/reference/badges) reference for the full model.

```ts
badges: [
  { match: '/api/experimental/**', status: 'alpha' },
  { match: ['/v2/**', '/beta/**'], badge: { text: 'v2', variant: 'info' } },
]
```

| Field    | Type                     | Description                                             |
| -------- | ------------------------ | ------------------------------------------------------ |
| `match`  | `string \| string[]`     | Glob pattern(s) matched against the route path         |
| `badge`  | `string \| BadgeConfig \| array` | Ad-hoc badge(s) applied to matching pages      |
| `status` | `string \| string[]`     | Named status id(s) applied to matching pages           |

Declare at least one of `badge` or `status`. `match` supports `*`, `**`, and `?`.

## `statuses`

The named status registry — the semantic layer over badges. A status is a reusable, documented preset referenced by `id` from a page's `status` field. Entries merge over the [built-in defaults](/reference/badges#built-in-statuses) by `id` (matching ids override, new ids extend).

```ts
statuses: [
  { id: 'alpha', title: 'Alpha', description: 'Early and unstable — expect changes.', variant: 'warning' },
  { id: 'design-partner', title: 'Design Partner', description: 'Available to design partners only.', color: '#7c3aed' },
]
```

| Field         | Type           | Required | Description                                    |
| ------------- | -------------- | -------- | ---------------------------------------------- |
| `id`          | `string`       | yes      | Reference handle used by `status: <id>`        |
| `title`       | `string`       | yes      | Chip label                                     |
| `description` | `string`       | yes      | Hover tooltip                                  |
| `variant`     | `BadgeVariant` | no       | Theme-aware color; ignored when `color` is set |
| `color`       | `string`       | no       | Raw color — overrides `variant`                |

## `footer`

Unified footer config — the old top-level `footer` and `site.footer` are now one block.

```ts
footer: {
  message?:   string,
  copyright?: true | string | CopyrightConfig,
  columns?:   FooterColumn[],
  tagline?:   string,
  brandMark?: string,
  socials?:   true | SocialLink[],
}
```

| Field       | Type                                | Description                                                                               |
| ----------- | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `message`   | `string`                            | Footer message text                                                                       |
| `copyright` | `true \| string \| CopyrightConfig` | `true` auto-generates from title + current year; string is verbatim; object is structured |
| `columns`   | `FooterColumn[]`                    | Link columns rendered in the footer grid                                                  |
| `tagline`   | `string`                            | Small tagline rendered on the right side of the bottom strip                              |
| `brandMark` | `string`                            | Brand mark character rendered in the footer's brand block (default `'Z'`)                 |
| `socials`   | `true \| SocialLink[]`              | `true` reuses root `socials`; array overrides for the footer only                         |

### Smart copyright

`copyright: true` produces `Copyright © <currentYear> <title>.` using the top-level `title` and the year at build time. Pass a `string` to override verbatim, or a `CopyrightConfig` for structured company / DBA / year-range output.

### CopyrightConfig

```ts
interface CopyrightConfig {
  company?: string
  dba?: string
  year?: number | { from: number }
}
```

| Field     | Type                         | Description                                             |
| --------- | ---------------------------- | ------------------------------------------------------- |
| `company` | `string`                     | Legal company name (e.g. `'Acme Inc.'`)                 |
| `dba`     | `string`                     | "Doing business as" name                                |
| `year`    | `number \| { from: number }` | Single year, or a range from `from` to the current year |

```ts
footer: {
  copyright: { company: 'Acme Inc.', dba: 'Acme', year: { from: 2021 } },
  // → "Copyright © 2021–2026 Acme Inc. (Acme)"
}
```

### FooterColumn

```ts
interface FooterColumn {
  heading: string
  links: Array<{ text: string; href: string }>
}
```

| Field     | Type                               | Description    |
| --------- | ---------------------------------- | -------------- |
| `heading` | `string`                           | Column heading |
| `links`   | `{ text: string, href: string }[]` | Column links   |

> **Security note** — every `href` in `footer.*`, `sidebar.*`, and `topbar.*` is validated through a safe-URL helper that rejects `javascript:`, `data:`, `vbscript:`, and `file:` schemes. Relative paths, fragment anchors, `http://`, `https://`, `mailto:`, and `tel:` are allowed.

## `editLink` and `reportLink`

Per-page chrome — the "Edit on GitHub" and "Report an issue" links rendered under every doc page. Flattened to the top level to match the industry pattern (VitePress, Nextra). Set either to `false` to disable that action site-wide.

```ts
editLink?:   false | EditLinkConfig,
reportLink?: false | ReportLinkConfig,
```

### EditLinkConfig

```ts
interface EditLinkConfig {
  repo?: string
  branch?: string
  directory?: string
  label?: string
  url?: (page: ResolvedPage) => string
  onResolve?: (page: ResolvedPage) => void
}
```

| Field       | Type                             | Description                                                           |
| ----------- | -------------------------------- | --------------------------------------------------------------------- |
| `repo`      | `string`                         | `"org/repo"` shorthand or full URL — feeds the auto-URL builder       |
| `branch`    | `string`                         | Branch to link against (default `"main"`)                             |
| `directory` | `string`                         | Subdirectory inside the repo containing the docs (default: repo root) |
| `label`     | `string`                         | Visible label (default `"Edit this page on GitHub"`)                  |
| `url`       | `(page: ResolvedPage) => string` | Custom URL builder — overrides the auto-URL                           |
| `onResolve` | `(page: ResolvedPage) => void`   | Analytics / telemetry hook fired when the link is resolved            |

```ts
editLink: {
  repo:      'acme/docs',
  branch:    'main',
  directory: 'docs',
  onResolve: (page) => track('edit-link.resolved', { path: page.path }),
},
```

### ReportLinkConfig

Identical shape to `EditLinkConfig`. `repo` may be either `"org/repo"` shorthand or a full issues URL; default label is `"Report an issue"`.

```ts
reportLink: { repo: 'acme/docs' },
// or disable site-wide:
reportLink: false,
```

## `feedback`

Controls the "Was this page helpful?" yes/no widget rendered at the bottom of every doc page. Off by default.

```ts
feedback?: boolean | { question?: string }
```

| Value               | Effect                                   |
| ------------------- | ---------------------------------------- |
| omitted / `false`   | Widget does not render                   |
| `true`              | Widget renders with the default question |
| `{ question: '…' }` | Widget renders with a custom question    |

```ts
// enable with the default question
feedback: true,
// enable with a custom question
feedback: { question: 'Did this help?' },
```

## `home`

Home page layout — hero, proof strip, features grid, showcase grid, split section, final CTA, and the render-order layout list.

```ts
home: {
  hero:       HomeHeroConfig,
  proof?:     HomeProofConfig,
  features?:  HomeFeaturesConfig,
  showcase?:  HomeShowcaseConfig,
  split?:     false | HomeSplitConfig,
  cta?:       HomeCtaConfig,
  layout?:    HomeLayoutEntry[],
}
```

| Field      | Type                       | Description                                                                                    |
| ---------- | -------------------------- | ---------------------------------------------------------------------------------------------- |
| `hero`     | `HomeHeroConfig`           | Headline, tagline, actions, and the optional demo visual                                       |
| `proof`    | `HomeProofConfig`          | "Used by …" strip (renamed from `trust`)                                                       |
| `features` | `HomeFeaturesConfig`       | Feature cards grid                                                                             |
| `showcase` | `HomeShowcaseConfig`       | Generalized card grid — defaults to apps + packages + workspaces, accepts arbitrary page paths |
| `split`    | `false \| HomeSplitConfig` | Split section. `false` disables                                                                |
| `cta`      | `HomeCtaConfig`            | Final CTA band                                                                                 |
| `layout`   | `HomeLayoutEntry[]`        | Render order. Accepts section id strings, objects, or React components                         |

### HomeHeroConfig

```ts
interface HomeHeroConfig {
  label?: string
  tagline?: string
  actions?: ButtonConfig[]
  demo?: false | HomeHeroDemoConfig
}
```

| Field     | Type                          | Description                                          |
| --------- | ----------------------------- | ---------------------------------------------------- |
| `label`   | `string`                      | Small label above the title (renamed from `eyebrow`) |
| `tagline` | `string`                      | Marketing line under the title                       |
| `actions` | `ButtonConfig[]`              | CTA buttons (typically up to 2)                      |
| `demo`    | `false \| HomeHeroDemoConfig` | Visual next to the hero copy. `false` hides it       |

#### HomeHeroDemoConfig

A discriminated union covering both demo forms:

```ts
type HomeHeroDemoConfig = HomeHeroDemoImage | HomeHeroDemoTerminal

interface HomeHeroDemoImage {
  src: string
  alt?: string
  width?: number | string
  height?: number | string
}

interface HomeHeroDemoTerminal {
  command: string
  lines: { kind: 'ok' | 'info' | 'cmt' | 'err'; text: string }[]
  windowTitle?: string
}
```

The image form paints an `<img>` into the demo container; the terminal form keeps the framework's terminal chrome and renders the supplied command + output lines.

### HomeProofConfig

```ts
interface HomeProofConfig {
  lead?: string
  names?: string[]
}
```

| Field   | Type       | Description                                           |
| ------- | ---------- | ----------------------------------------------------- |
| `lead`  | `string`   | Lead phrase (e.g. `"used by"`, `"powering teams at"`) |
| `names` | `string[]` | List of names (renders nothing when empty)            |

Renamed from `home.trust` / `HomeTrustConfig` — plain English over design jargon.

### HomeFeaturesConfig

```ts
interface HomeFeaturesConfig {
  items?: Feature[]
  columns?: 1 | 2 | 3 | 4
  truncate?: TruncateConfig
  heading?: HomeSectionHeading
}
```

| Field      | Type                 | Description                                                                                                                             |
| ---------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `items`    | `Feature[]`          | Feature cards (replaces the old top-level `features` array). Optional — omit to customise grid layout / heading without supplying cards |
| `columns`  | `1 \| 2 \| 3 \| 4`   | Grid column count                                                                                                                       |
| `truncate` | `TruncateConfig`     | Max visible lines before clipping with ellipsis                                                                                         |
| `heading`  | `HomeSectionHeading` | Optional section heading (label + title) above the grid                                                                                 |

Each `Feature`:

```ts
interface Feature {
  title: string
  description: string
  link?: string
  icon?: IconConfig
}
```

### HomeShowcaseConfig

Generalized card grid — the second home block. Replaces `home.workspaces`. Default source is the combined apps + packages + workspaces list; you can also point it at an arbitrary list of page paths.

```ts
interface HomeShowcaseConfig {
  columns?: 1 | 2 | 3 | 4
  truncate?: TruncateConfig
  heading?: HomeSectionHeading
  source?: 'workspaces' | string[]
}
```

| Field      | Type                       | Description                                                                                    |
| ---------- | -------------------------- | ---------------------------------------------------------------------------------------------- |
| `columns`  | `1 \| 2 \| 3 \| 4`         | Grid column count                                                                              |
| `truncate` | `TruncateConfig`           | Line clamps for the card title/description                                                     |
| `heading`  | `HomeSectionHeading`       | Optional heading above the grid                                                                |
| `source`   | `'workspaces' \| string[]` | Omit / `'workspaces'` → apps + packages + workspaces. Array of page paths → arbitrary card set |

```ts
home: {
  showcase: {
    columns: 3,
    source:  ['/products/cli', '/products/api', '/products/web'],
  },
}
```

### HomeSplitConfig

A two-column split section (code/visual on one side, copy on the other). Pass `false` at the parent (`home.split: false`) to omit the section entirely.

```ts
interface HomeSplitConfig {
  title: string
  label?: string
  body?: string
  bullets?: string[]
  cta?: ButtonConfig
  visual?: HomeSplitVisual
}
```

| Field     | Type              | Required | Description                                                   |
| --------- | ----------------- | -------- | ------------------------------------------------------------- |
| `title`   | `string`          | yes      | Section title                                                 |
| `label`   | `string`          | no       | Small label rendered above the title (renamed from `eyebrow`) |
| `body`    | `string`          | no       | Body copy rendered under the title                            |
| `bullets` | `string[]`        | no       | Checkmark list rendered under the body                        |
| `cta`     | `ButtonConfig`    | no       | CTA button rendered at the bottom of the copy column          |
| `visual`  | `HomeSplitVisual` | no       | Visual rendered in the opposite column                        |

#### HomeSplitVisual

```ts
interface HomeSplitVisual {
  code: string
  language?: string
}
```

| Field      | Type     | Required | Description                                                  |
| ---------- | -------- | -------- | ------------------------------------------------------------ |
| `code`     | `string` | yes      | Code snippet rendered as a syntax-highlighted preview        |
| `language` | `string` | no       | Language identifier for syntax highlighting (default `'ts'`) |

### HomeCtaConfig

```ts
interface HomeCtaConfig {
  title?: string
  subtitle?: string
  actions?: ButtonConfig[]
}
```

| Field      | Type             | Description                     |
| ---------- | ---------------- | ------------------------------- |
| `title`    | `string`         | CTA headline                    |
| `subtitle` | `string`         | Supporting text                 |
| `actions`  | `ButtonConfig[]` | CTA buttons (typically up to 2) |

### HomeLayoutEntry

```ts
type HomeLayoutEntry =
  | HomeSectionId
  | { sectionId: HomeSectionId }
  | { component: ComponentType<{ paths: Paths }> }
  | { component: string }
```

| Form                           | Description                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `HomeSectionId` (string)       | Shorthand — render the built-in section                                         |
| `{ sectionId }`                | Object form; reserved space for future per-entry options (`hidden`, `props`, …) |
| `{ component: ComponentType }` | Inline JSX (TSX configs)                                                        |
| `{ component: string }`        | Path to a component file (TS / JSON configs)                                    |

### Shared home types

These small shapes are reused across multiple home blocks (`features`, `showcase`):

```ts
interface TruncateConfig {
  title?: number
  description?: number
}

interface HomeSectionHeading {
  label?: string
  title?: string
  subtitle?: string
}
```

`TruncateConfig` values are maximum visible lines before CSS `line-clamp` clips with an ellipsis. `HomeSectionHeading.label` is the small uppercase kicker rendered above the title.

### HomeSectionId

```ts
type HomeSectionId = 'hero' | 'proof' | 'features' | 'showcase' | 'split' | 'cta'
```

Renamed from the old `'hero' | 'trust' | 'features' | 'split' | 'workspaces' | 'cta'`.

```ts
home: {
  layout: [
    'hero',
    'proof',
    { component: () => <CustomTimeline /> },
    'features',
    'cta',
  ],
}
```

## `discover`

Top-level cross-cutting discovery options. Only field is `ignore` — global glob patterns excluded from every page's auto-discovery.

```ts
discover?: {
  ignore?: string[],
}
```

| Field             | Type       | Description                                                          |
| ----------------- | ---------- | -------------------------------------------------------------------- |
| `discover.ignore` | `string[]` | Glob patterns excluded from every page's discovery (gitignore vocab) |

```ts
discover: {
  ignore: ['**/draft-*.md', '**/internal/**', '**/_*.md'],
}
```

Per-page `discover.ignore` is appended to this list — globals always apply.

## `templates`

Directory or directories holding custom document templates used by [`ciderpress draft`](/reference/cli). Each is a `.md`/`.mdx` file with `label`/`hint` frontmatter; the filename is the template type. Paths are relative to the repo root.

```ts
templates?: string | string[]
```

| Field       | Type                 | Description                                                      |
| ----------- | -------------------- | ---------------------------------------------------------------- |
| `templates` | `string \| string[]` | Directory (or directories) of custom `.md`/`.mdx` template files |

```ts
templates: ['docs/.templates', 'shared/templates'],
```

A custom template whose filename matches a built-in (e.g. `guide.md`) overrides it. `.mdx` templates scaffold to `.mdx` files. Templates are validated by [`ciderpress templates check`](/reference/cli) and as part of `check`/`build`. See [Templates](/framework/templates) for the authoring format and the SDK.

## `devServer`

Dev-server configuration — controls how `ciderpress dev` binds and how the dev URL is presented in the terminal and browser auto-open. All fields are optional.

```ts
devServer?: {
  url?:  string,
  port?: number,
  host?: string,
  open?: boolean,
}
```

| Field  | Type      | Default                  | Description                                                                                                                                                                                                                           |
| ------ | --------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`  | `string`  | `http://${host}:${port}` | Externally-visible URL. Replaces the default `http://${host}:${port}` in the "ready: …" terminal message and the browser auto-open target. The dev server still binds locally — this is a display + auto-open hint                    |
| `port` | `number`  | `6174`                   | Preferred port. ciderpress falls forward through a 5-port range when the preferred port is occupied. CLI `--port` overrides                                                                                                           |
| `host` | `string`  | `'127.0.0.1'`            | Bind interface — explicit IPv4 loopback so reverse proxies (portless, nginx, Caddy) pointed at `127.0.0.1` can reach the dev server. Set `'0.0.0.0'` to expose on every network interface (LAN / Docker / VM). CLI `--host` overrides |
| `open` | `boolean` | `false`                  | Auto-open the resolved URL in the default browser when the dev server becomes ready                                                                                                                                                   |

CLI precedence: `--port` / `--host` / `--url` > `devServer.{port,host,url}` > built-in defaults.

### Example — behind portless.sh

```ts
devServer: {
  url: 'https://docs.acme.localhost',
  open: true,
}
```

The dev server still binds `localhost:6174`; portless reverse-proxies the HTTPS hostname to that port. See the [portless guide](/guides/using-portless) for setup.

### Example — exposing to LAN / Docker

```ts
devServer: {
  host: '0.0.0.0',
  port: 6174,
}
```

## Shared primitives

Types reused across multiple top-level keys. Same shape, same meaning, everywhere.

### IconConfig

```ts
type IconConfig = IconId | { id: IconId; color?: IconColor } | { src: string; alt?: string }
```

Uniform across every position — `brand.icon`, `Page.icon`, `Workspace.icon`, `WorkspaceGroup.icon`, `Feature.icon`, `ButtonConfig.icon`. Either a plain Iconify identifier (`'pixelarticons:book-open'`), an Iconify id with explicit color, or an arbitrary image source.

### TitleConfig

```ts
type TitleConfig =
  | string
  | {
      from: 'auto' | 'filename' | 'heading' | 'frontmatter'
      transform?: (text: string, slug: string) => string
    }
```

Uniform across every `title` field that supports derivation — `Page.title` and `Workspace.title`. Plain string for static titles, or a derivation rule for auto-discovered children. The `transform` hook receives the derived title and the filename slug. (`WorkspaceGroup.title` is a plain `string` only.)

| `from`          | Source                                                            |
| --------------- | ----------------------------------------------------------------- |
| `'auto'`        | Fallback chain: frontmatter → first `# heading` → filename        |
| `'filename'`    | Filename converted to title case (`add-route.md` → `"Add Route"`) |
| `'heading'`     | First `# heading` in the file                                     |
| `'frontmatter'` | `title` field in YAML frontmatter                                 |

### ButtonConfig

```ts
interface ButtonConfig {
  text: string
  href: string
  variant?: 'primary' | 'secondary' | 'ghost'
  shape?: 'square' | 'rounded' | 'circle'
  icon?: IconConfig
}
```

Unified button vocabulary. Replaces the three old button shapes (`HeroAction.theme`, `SidebarLink.style`, and the third unnamed variant). Used by `home.hero.actions`, `home.cta.actions`, `topbar.cta`, `sidebar.top` / `sidebar.bottom` / `sidebar.promo.cta`.

| Field     | Type                                  | Description                                        |
| --------- | ------------------------------------- | -------------------------------------------------- |
| `text`    | `string`                              | Button label                                       |
| `href`    | `string`                              | Click target                                       |
| `variant` | `'primary' \| 'secondary' \| 'ghost'` | Visual variant (was `'brand' \| 'alt' \| 'ghost'`) |
| `shape`   | `'square' \| 'rounded' \| 'circle'`   | Button shape                                       |
| `icon`    | `IconConfig`                          | Optional leading icon                              |

### ImageSource

```ts
type ImageSource =
  | string
  | {
      src: string
      alt?: string
      type?: string
      width?: number | string
      height?: number | string
    }
```

Universal image source — string path or a fully described image object. Used by `brand.favicon`, `brand.banner` (string form), `Workspace.badge`, and anywhere else an image is rendered.

### SortStrategy

```ts
type SortStrategy =
  | 'default'
  | 'alpha'
  | 'filename'
  | 'none'
  | ((a: ResolvedPage, b: ResolvedPage) => number)
```

Used by `Page.discover.sort` and `Workspace.discover.sort`.

| Value        | Behavior                                                                                                                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'default'`  | Sections first, then pinned intro files (`introduction`, `intro`, `overview`, `index`, `readme`), then alphabetical by title                                                                               |
| `'alpha'`    | Sections first, then alphabetical by title                                                                                                                                                                 |
| `'filename'` | Sections first, then alphabetical by source filename                                                                                                                                                       |
| `'none'`     | Preserve glob-discovery order                                                                                                                                                                              |
| comparator   | `(a: ResolvedPage, b: ResolvedPage) => number` — sort by your own rule. Each `ResolvedPage` has `title`, `link`, and `frontmatter`. Your comparator owns the full order; sections-first is **not** applied |

`'default'` is the implicit fallback when `discover.sort` is omitted.

### Frontmatter

`Page.defaults` (and `Workspace.defaults`) take a `Frontmatter` value. Same type as before — carries the page metadata fields Rspress understands (`title`, `description`, `aside`, `editLink`, `pageType`, …) plus any custom keys you want injected.

```ts
{
  title: 'API Reference',
  defaults: {
    aside:    'left',
    editLink: false,
    pageType: 'doc',
  },
}
```

Per-file YAML frontmatter wins on conflict with `defaults`. See [Frontmatter Fields](/reference/frontmatter) for the full field schema.

## References

- [Frontmatter](/reference/frontmatter) — per-page metadata schema
- [Icon Colors](/reference/icons/colors) — color values accepted by `IconConfig`
- [Content](/concepts/content) — how `pages` map your existing markdown into the site tree
- [Workspaces](/concepts/workspaces) — when to use `apps`, `packages`, or `workspaces`
- [Themes](/concepts/themes) — built-in theme names and custom theme definitions

## Resources

- [c12](https://github.com/unjs/c12) — the config loader used under the hood
- [Iconify](https://icon-sets.iconify.design) — icon identifier search
