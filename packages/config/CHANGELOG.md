# @ciderpress/config

## 1.0.0-rc.6

### Minor Changes

- 395da42: Add `feedback` config to toggle the "Was this page helpful?" widget.

  The widget is off by default. Set `feedback: true` to enable it with the default question, or `feedback: { question: '...' }` to enable it with custom text.

  - **`@ciderpress/config`** — new `feedback?: boolean | FeedbackConfig` field on `CiderpressConfig`, with an exported `FeedbackConfig` type.
  - **`@ciderpress/ui`** — `SiteBlock` and `CiderpressSiteBlock` gain a `feedback: { enabled, question }` field; `Layout` renders `<Feedback />` only when feedback is enabled.

- c66ef61: Add the `pixel` icon set and give every social link a real glyph

  The [Pixel Icons](https://icon-sets.iconify.design/pixel/) collection is now
  bundled and resolvable by the `pixel:` prefix, both in `IconConfig` values and
  `VALID_ICON_IDS` validation.

  Every `SocialLinkIcon` value now maps to a real `pixel:` brand glyph — `slack`,
  `linkedin`, `gitlab`, `instagram`, and `facebook` previously fell back to a
  generic chain icon.

  The `SocialLinkIcon` enum was trimmed to the platforms with a pixel-art glyph:
  `lark`, `wechat`, `qq`, `juejin`, `zhihu`, `bilibili`, and `weibo` are no longer
  accepted values (use `{ svg: '<svg>...</svg>' }` for those).

- 0d6b434: Add page badges and a named status registry.

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
      {
        id: 'alpha',
        title: 'Alpha',
        description: 'Early and unstable…',
        variant: 'warning',
      },
    ],
  })
  ```

  Badges also render on the child cards of auto-generated section landing pages. A collapsible group that is also a doc hides its sidebar badge by default (to avoid the collapse chevron) — set `sidebar.groupBadges: true` to show it there too.

  Long titles truncate with an ellipsis and reveal the full text on hover — in the sidebar, the breadcrumb, and the "On this page" outline.

  - **`@ciderpress/config`** — `Badge` / `BadgeConfig` / `BadgeVariant` / `BadgeInput` / `BadgeRule` / `Status` types; `Frontmatter.badge` + `Frontmatter.status`; top-level `badges` (glob rules) and `statuses` (registry); a shared badge wire-format (`encodeBadges` / `decodeBadges` / `normalizeBadgeInput`) and status resolver (`DEFAULT_STATUSES` / `resolveStatuses` / `resolveStatusBadges` / `statusToBadge`).
  - **`@ciderpress/cli`** — sync resolves badges + statuses (file frontmatter → `defaults` → glob, first source wins) and emits them as Rspress sidebar `tag`s plus a route→badges map (`.generated/badges.json`). A collapsible group that is also a doc gets no sidebar tag (its badge shows on the page instead).
  - **`@ciderpress/ui`** — a `Tag` override renders badge chips (variant color, custom-color tint, hover tooltip), delegating other tags to Rspress; badges also render beside the breadcrumb via `themeConfig.pageBadges`; sidebar, breadcrumb, and outline entries get single-line ellipsis with a `title` tooltip on overflow.

### Patch Changes

- 6edf324: Upgrade dependencies to latest across the workspace, and fix Mermaid rendering on Mermaid v11.

  - Catalog: `@rspress/core` ^2.0.16, `@typescript/native-preview` 7.0.0-dev.20260707.2, `type-fest` ^5.8.0, `vitest` ^4.1.10
  - UI: `mermaid` ^11.16.0 (was v10), iconify icon sets
  - CLI: `@clack/prompts` ^1.7.0
  - Config: `tsx` ^4.23.0, `@types/node` ^26.1.0
  - Tooling: `oxlint` ^1.73.0, `oxfmt` ^0.58.0, `turbo` ^2.10.4

  `@rslib/core` is held at `0.23.1`: 0.23.2 regressed the ESM build (emitted `.js` instead of `.mjs` and dropped the bundled type declarations).

  Mermaid is now on **v11** — the previous v10 pin was based on a misdiagnosis. `mermaid.render()` resolves correctly on v11; the blank-diagram symptom was a defect in `MermaidRenderer.tsx`: `config` defaulted to a fresh `{}` each render, re-firing the render effect in a loop that repeatedly rendered into the same element id and clobbered the injected SVG. Fixed by keying the render callback on a serialized config value and using a unique element id per render call. Diagrams now paint on first load without interaction and survive theme toggles.

- 8313290: Reject top-level leaf pages with a nested path during config validation.

  A visible leaf page (no `pages`) placed directly in `config.pages` renders as a top-level sidebar link, which resolves to a file at the content root. A nested `path` (e.g. `/getting-started/introduction`) files the page a directory deep, so the generated root `_meta.json` entry pointed at a file that wasn't there — a silent dead link in the sidebar. Config validation now fails with an actionable message telling you to use a single-segment path or nest the page under a section with `pages`.

- Updated dependencies [6edf324]
  - @ciderpress/theme@1.0.0-rc.4

## 1.0.0-rc.5

### Minor Changes

- 6333ea1: Add config-driven document templates.

  Templates can now be authored as plain `.md`/`.mdx` files with `label`/`hint` frontmatter, discovered from directories declared via the new `templates` config field. A custom template whose filename matches a built-in overrides it, and `.mdx` templates scaffold to `.mdx`.

  - **`@ciderpress/config`** — new `templates?: string | string[]` field.
  - **`@ciderpress/templates`** — new `buildTemplate()` validator and `TemplateError` type; `Template` gains an optional `extension` field. Built-in template files renamed from `.liquid` to `.md` (no behavior change).
  - **`@ciderpress/cli`** — new `ciderpress templates list` and `ciderpress templates check` commands; template validation folded into `ciderpress check` and `ciderpress build`; `ciderpress draft` now discovers config templates and preserves the template's extension.

## 1.0.0-rc.4

### Minor Changes

- cb7412b: **Full custom branding.** Every brand surface on a ciderpress site is
  now user-overridable, plus the home page can be reordered and have
  sections suppressed without writing custom MDX.

  ## Topbar icon chip

  `config.icon` now actually renders — a small chip painted by
  `<HeaderIcon />` immediately before `<HeaderLogo />` inside
  `cp-header-logo`. Pair with `logo` for the canonical two-slot identity
  (small mark + wordmark). Accepts the same `IconConfig` union as cards.

  ```ts
  defineConfig({
    // Single slot — most sites pick this.
    logo: '/logo.svg',

    // Two-slot pattern — small mark + wordmark.
    icon: { src: '/mark.svg', alt: 'Acme' },
    logo: '/wordmark.svg',
  })
  ```

  ## Loader

  `config.loader` accepts four forms:

  ```ts
  loader: 'apple'                          // default — ciderpress pixel apple
  loader: 'classic'                        // legacy dots loader
  loader: false                            // no loader at all
  loader: {
    content: '<svg>...</svg>',             // inline SVG markup, OR
    // content: '/loader.svg',             // asset path
    label: 'brewing',
    minDisplayMs: 150,
    maxDisplayMs: 4000,
  }
  ```

  A fallback dismissal timer in the inline head script guarantees
  `data-cp-ready` flips even when the React bundle never hydrates (static
  dist over plain http with no service worker). Cross-field validation
  rejects configs where `maxDisplayMs < minDisplayMs + 200`.

  ## Favicon

  ```ts
  favicon: '/favicon.svg'                  // string shorthand
  favicon: { src: '/favicon', type: 'image/svg+xml' }   // explicit MIME
  ```

  Setting `favicon` disables the runtime favicon retinting that otherwise
  swaps `<link rel="icon">` to a themed pixel-apple data URI. The
  optional `type` field emits a second `<link rel="icon" type="...">` so
  extension-less URLs still resolve to the right MIME.

  ## Icons broadened

  ```ts
  icon: 'devicon:react'                          // Iconify (purple default)
  icon: { id: 'devicon:nextjs', color: 'blue' }  // Iconify, explicit colour
  icon: { src: '/icon.svg', alt: 'maltty' }      // Image — new
  ```

  The image form is honoured on the topbar icon chip, workspace cards,
  section cards, feature cards, and sidebar links.

  ## Home page — section opt-outs and customisation

  ```ts
  home: {
    // Suppress the framework's `pnpm ciderpress dev` terminal demo
    heroDemo: false,

    // Or replace it with an image (dashboard screenshot, product shot, …)
    heroDemo: { src: '/dashboard.svg', alt: 'Acme dashboard' },

    // Or replace it with a structured terminal carrying your own command + output
    heroDemo: {
      windowTitle: '~/code/acme — acme dev',
      command: 'acme dev',
      lines: [
        { kind: 'ok',   text: 'edge runtime ready in us-east-1' },
        { kind: 'info', text: 'watching ./handlers' },
        { kind: 'cmt',  text: 'handlers.ts changed — rebuilt in 8ms' },
        { kind: 'err',  text: 'webhook delivery failed — retrying' },
      ],
    },

    // Suppress the "Acme Docs" sample-config split block
    split: false,

    // Or replace it with your own copy + code preview
    split: {
      eyebrow: 'Configuration',
      title: 'One file. Validated at boot.',
      body: 'Acme services are described in TypeScript; Zod validates on deploy.',
      bullets: ['Typed handlers', 'Schema drift caught early', 'Per-env overrides'],
      cta: { text: 'Read docs', link: '/getting-started/configuration' },
      visual: {
        language: 'ts',
        code: "import { defineConfig } from '@acme/sdk'\n\nexport default defineConfig({ ... })",
      },
    },

    // Override the hardcoded "Features" eyebrow + "Built for the way you ship." title.
    // Same shape applies on `home.workspaces.heading`.
    features: {
      columns: 3,
      heading: {
        eyebrow: 'What you get',
        title: 'Built for the engineers who ship.',
        subtitle: 'Typed SDK, OpenAPI spec, edge runtime — wired together.',
      },
    },
    workspaces: {
      columns: 2,
      heading: { eyebrow: 'Apps & Packages', title: 'Everything in the monorepo.' },
    },
  }
  ```

  ## Home page — section order

  `home.layout` controls render order and visibility. Omit a section
  from the array to suppress it. Default is `['hero', 'trust',
'features', 'split', 'workspaces', 'cta']`.

  ```ts
  home: {
    // Push the conversion above the fold; drop the trust strip
    layout: ['hero', 'cta', 'features', 'workspaces', 'split'],
  }
  ```

  The schema rejects duplicates and unknown ids.

  ## Home page — full custom MDX

  For full control (custom sections, JSX in arbitrary positions), add a
  section that mounts at `/` and write your own MDX. The sync engine
  detects an explicit `index.md` and skips the auto-generated home page.
  All home components are importable from `@ciderpress/ui/theme`.

  ```mdx
  ---
  pageType: home
  ---

  import { Hero, FeatureGrid, FeatureCard, PageRail, CTA } from '@ciderpress/ui/theme'

  <PageRail>
    <Hero title="Acme Corp" actions={[{ theme: 'brand', text: 'Get started', link: '/start' }]} />
    <MyCustomBand />
    <FeatureGrid>
      <FeatureCard title="One" description="..." />
      <FeatureCard title="Two" description="..." />
    </FeatureGrid>
    <CTA title="Ready?" actions={[{ theme: 'brand', text: 'Sign up', link: '/signup' }]} />
  </PageRail>
  ```

  ## Footer brand mark

  The site footer no longer falls back to the ciderpress apple. When
  `site.footer.brandMark` is omitted, the chip renders `<img
src="/icon.svg">` — your custom mark or the auto-generated one derived
  from `config.title`.

  ## Security + correctness
  - CSS `</style>` injection blocked in `loader.label` and `loader.content` —
    `<` is hex-escaped (`\3c `) so the byte sequence `</style>` never
    appears in the inline `<style>` tag.
  - `escapeJsxProp` now escapes backslash, blocking trailing-backslash
    escapes in image-form icon `src` / `alt`.
  - Empty `src: ''` rejected at the schema layer.
  - Layouts short-circuit on `import.meta.env.SSG_MD` so the
    Copy-Markdown button no longer pulls topbar logo / search button /
    nav items into every copied page.

  ## Acme example

  The `examples/custom/` directory ships a realistic mid-size product
  docs site (Acme Corp) that exercises every new field — custom logo,
  favicon, dashboard-style hero demo, custom split, reordered sections,
  six feature cards, three workspace items, a three-column footer.
  Verified: zero "ciderpress" strings in the rendered HTML.

  Run `pnpm example:custom`, `pnpm example:custom:build`, or `pnpm
example:custom:serve`.

- cb7412b: **Workspace API mirrors Page, plus a `devServer` config block for reverse proxies.**

  ## Workspace API migration

  The `Workspace` interface now uses the same discovery surface as `Page`. Six legacy fields are replaced with their Page-aligned equivalents:

  | Before (legacy)           | After (Page-aligned)           |
  | ------------------------- | ------------------------------ |
  | `Workspace.items: Page[]` | `Workspace.pages: Page[]`      |
  | `Workspace.sort`          | `Workspace.discover.sort`      |
  | `Workspace.recursive`     | `Workspace.discover.recursive` |
  | `Workspace.exclude`       | `Workspace.discover.ignore`    |
  | `Workspace.entryFile`     | `Workspace.discover.indexFile` |
  | `Workspace.frontmatter`   | `Workspace.defaults`           |

  ```ts
  // Before
  apps: [
    {
      title: 'API',
      path: '/apps/api',
      items: [{ title: 'Overview', path: '/apps/api', include: 'README.md' }],
      sort: 'alpha',
      recursive: true,
      exclude: ['draft-*.md'],
      entryFile: 'overview',
      frontmatter: { aside: false },
    },
  ]

  // After
  apps: [
    {
      title: 'API',
      description: 'REST API',
      path: '/apps/api',
      pages: [{ title: 'Overview', path: '/apps/api', include: 'README.md' }],
      discover: {
        sort: 'alpha',
        recursive: true,
        ignore: ['draft-*.md'],
        indexFile: 'overview',
      },
      defaults: { aside: false },
    },
  ]
  ```

  `WorkspaceGroup.items` is unchanged — it's a different `items` (an array of Workspaces, not an array of Pages). `Workspace.openapi` is unchanged.

  ## `devServer` config block

  New top-level field for reverse-proxy and host/port control:

  ```ts
  devServer?: {
    url?: string      // externally-visible URL → ready message + browser auto-open
    port?: number     // preferred port. Default 6174. CLI --port overrides
    host?: string     // bind interface. Default '127.0.0.1' (was 'localhost')
    open?: boolean    // auto-open the resolved URL when ready. Default false
  }
  ```

  CLI flags `--port`, `--host`, `--url` override config values. The ready message prints both the configured URL and the local bind URL when they differ, so a portless / nginx / Caddy hostname falls back to `http://127.0.0.1:port` if the proxy isn't running.

  ### IPv4 default for `devServer.host`

  Default changed from `'localhost'` to `'127.0.0.1'`. On macOS, Node resolves `localhost` to IPv6 (`[::1]`) first; Rsbuild then binds IPv6-only and any reverse proxy pointed at `127.0.0.1:port` returns 502 Bad Gateway. Binding the IPv4 loopback by default keeps localhost-only security while staying compatible with every proxy. Set `devServer.host: '0.0.0.0'` to expose on every interface (LAN / Docker).

  ## End-to-end docs rewrite

  Every concept doc, framework guide, and the configuration reference now matches the shipped surface — Workspace shape, `devServer`, theme block, sidebar islands, announcement shape, etc. The contributing-guide example walk-through (Stage 1 → Stage 3 in `/framework/scaling`) uses the new `pages` / `nav.island` / `discover.*` vocabulary throughout. New `/guides/using-portless` walkthrough covers the four-step portless flow.

  ## Custom example

  `examples/custom/` ships pre-configured for portless with a stable port (`devServer.port: 7174`), a `portless: "acme"` hostname override, and a `pnpm setup:portless` script that registers the `acme.localhost → 127.0.0.1:7174` alias automatically. Visit `https://acme.localhost` after running `pnpm dev` from the example dir.

### Patch Changes

- 5c3e841: Upgrade dependencies to latest across the workspace.

  - Catalog: `@rslib/core` ^0.23.1, `@rspress/core` ^2.0.15, `@typescript/native-preview` 7.0.0-dev.20260628.1, `vitest` ^4.1.9
  - CLI: `@clack/prompts` ^1.6.0, `ink` ^7.1.0, `liquidjs` ^10.27.1
  - UI: `react-aria-components` ^1.19.0, `esbuild` ^0.28.1, iconify icon sets (`material-icon-theme`, `simple-icons`, `vscode-icons`)
  - Tooling: `oxlint` ^1.71.0, `oxfmt` ^0.56.0, `turbo` ^2.10.0, `@microsoft/api-extractor` ^7.58.9, `eslint-plugin-jsdoc` ^63.0.10, `eslint-plugin-security` ^4.0.1, `@types/node` ^26.0.1
  - E2E: `@playwright/test` ^1.61.1, `@argos-ci/playwright` ^7.1.1
  - Benchmarks: `@codspeed/vitest-plugin` ^5.7.1

  `mermaid` stays pinned at ^10.9.6 — v11 uses langium for parsing and breaks Rspress's webpack compilation of global components.

- Updated dependencies [5c3e841]
  - @ciderpress/theme@1.0.0-rc.3

## 1.0.0-rc.3

### Minor Changes

- f71d7f4: **Fix:** the navbar fallback no longer overrides the auto-generated `/logo.svg`
  with the hardcoded `<CiderpressLogo />` wordmark. When `logo` is omitted, the
  nav now shows the SVG written to the public dir by the banner module (derived
  from `title`). Sites that committed their own `public/logo.svg` already won
  this round; sites that didn't were silently getting the ciderpress wordmark.

  The themed wordmark is still available as an opt-in:

  ```ts
  import { CiderpressLogo } from "ciderpress";

  export default defineConfig({
    logo: ({ theme }) => <CiderpressLogo />,
  });
  ```

  **New:** two top-level config fields for overriding auto-generated asset paths.

  - `banner?: string` — hero image used on the home page and workspace landing
    pages. Defaults to `/banner.svg`.
  - `favicon?: string` — favicon path. Defaults to `/icon.svg`. Distinct from
    `icon` (the Iconify id for the inline topbar mark).

  ```ts
  export default defineConfig({
    banner: '/assets/hero.png',
    favicon: '/favicon.ico',
  })
  ```

  Auto-generation and the `<!-- ciderpress-generated -->` marker still carry the
  default case — these fields are only needed to point at a different filename
  or a CDN URL.

## 1.0.0-rc.2

### Patch Changes

- e4d81aa: Test/exercise the CI release pipeline.

  No code changes — this changeset only exists to force the changesets bot to open a release PR, validate that the GitHub Actions workflow can publish via npm trusted publishing (no `NPM_TOKEN`, OIDC-only with `id-token: write` + `NPM_CONFIG_PROVENANCE: true`), and confirm provenance attestations land on the resulting `1.0.0-rc.2` releases. Following the local bootstrap publish of `1.0.0-rc.1`, this is the first CI-driven cut.

- Updated dependencies [e4d81aa]
  - @ciderpress/theme@1.0.0-rc.2

## 1.0.0-rc.1

### Major Changes

- 0a651df: Rename to `ciderpress`. The project moved to the `thebytefarm` org and the kit now lives at the unscoped `ciderpress` package name (replacing `@zpress/kit`).

  **Consumer migration:**

  - `@zpress/cli` → `@ciderpress/cli`
  - `@zpress/config` → `@ciderpress/config`
  - `@zpress/ui` → `@ciderpress/ui`
  - `@zpress/theme` → `@ciderpress/theme`
  - `@zpress/templates` → `@ciderpress/templates`
  - `@zpress/kit` → `ciderpress` (unscoped)
  - `zpress.config.ts` → `ciderpress.config.ts`
  - Window globals: `__ZPRESS_*__` → `__CIDERPRESS_*__`
  - CSS vars: `--zp-*` → `--cp-*`

  The `@zpress/*` packages are not republished — `@ciderpress/*` starts fresh at this version. Tagline: **press your docs.**

### Patch Changes

- Updated dependencies [0a651df]
  - @ciderpress/theme@1.0.0-rc.1

## 1.0.0-rc.0

### Major Changes

- ciderpress 1.0 — release candidate

  This is a major release that locks the v1 public API. Headline changes:

  **Theme system**

  - Renamed the built-in `base` theme to `honeycrisp` (apple red, the canonical
    brand theme) and added `grannysmith` (apple green) as a second apple-themed
    default. Both ship with `dark` and `light` variants; the sun/moon toggle
    swaps between them. The legacy slug `'default'` aliases to `'honeycrisp'`
    via `THEME_ALIASES` for backward compatibility. The full built-in roster is
    now `honeycrisp`, `grannysmith`, `midnight`, and `arcade`.
  - Replaced `theme.colorMode` with `theme.variant` (values: `'dark' | 'light'`).
    The `'toggle'` value is no longer supported — themes that declare both
    variants always show the toggle; themes that declare one hide it.
  - `defineTheme()` input shape changed from `{ name, tokens, modes, defaultMode }`
    to `{ name, variants: { dark?, light? }, defaultVariant? }`. The factory
    validates the envelope before parsing token trees so error messages now
    point at the offending input field.
  - `ciderpress` and `@ciderpress/config` no longer re-export
    `ColorMode`, `ThemeMode`, `COLOR_MODES`, or `resolveDefaultColorMode`.
    Use `ThemeVariant`, `THEME_VARIANTS`, and `resolveDefaultVariant` from
    `@ciderpress/theme`. The deprecated aliases remain in `@ciderpress/theme` itself
    for one-version migration safety.

  **Config surface**

  - `Frontmatter` is now strict — unknown keys are rejected at config load
    and produce a typed compile-time error. On-disk markdown frontmatter is
    unaffected (gray-matter never typed it as `Frontmatter`).
  - Renamed `WorkspaceCategory` → `WorkspaceGroup`. The `config.workspaces`
    field name is unchanged.
  - Every field on `CiderpressConfig` and its sub-types now has solid JSDoc that
    propagates to IDE hover docs.
  - Tightened the CLI `--color-mode` schema from `string` to `enum('dark', 'light')`.

  **Dependency hygiene**

  - Removed `gray-matter` (last released 2021, drags in the abandoned
    `js-yaml@3` line with known prototype-pollution CVEs). Replaced with a
    ~25-line `parse` / `stringify` helper built on `yaml` (eemeli/yaml).
  - Removed unused `js-yaml` and `@types/js-yaml` direct deps from `@ciderpress/cli`.

  **Fixes**

  - `safe-url.ts` regex is now stored with `�- ` escape
    sequences instead of raw control bytes. Git no longer marks the file as
    binary; editors render it correctly.
  - Deleted orphaned `packages/ui/src/head/js/color-mode-{dark,light}.js`.
  - Hardened variant resolution across the head IIFE, theme provider, and
    theme switcher with cross-reference comments and a re-entrancy guard
    on the MutationObserver snap-back.

  **Migration**

  ```diff
  - import { ColorMode, ThemeMode, COLOR_MODES } from 'ciderpress'
  + import { ThemeVariant, THEME_VARIANTS } from 'ciderpress'

    defineConfig({
      theme: {
  -     colorMode: 'dark',
  +     variant: 'dark',
  -     name: 'base',
  +     name: 'honeycrisp',
      },
      themes: [
        defineTheme({
          name: 'sunset',
  -       tokens: sunsetTokens,
  -       modes: ['dark'],
  -       defaultMode: 'dark',
  +       variants: { dark: sunsetTokens },
  +       defaultVariant: 'dark',
        }),
      ],
  -   workspaces: [{ title: 'Integrations', ... } as WorkspaceCategory],
  +   workspaces: [{ title: 'Integrations', ... } as WorkspaceGroup],
    })
  ```

### Patch Changes

- Updated dependencies
  - @ciderpress/theme@1.0.0-rc.0

## 0.5.2

### Patch Changes

- f26cf74: fix: resolve SWC decorator panic by upgrading rsbuild to 2.0.0-rc.1

## 0.5.1

### Patch Changes

- 1e966e1: Fix workspace include resolution for `apps` and `packages` items:
  - Use deep glob pattern (`docs/**/*.md`) as default include when `recursive: true`. Previously the default was always `docs/*.md` regardless of the flag.
  - Add config check warning when an explicit include pattern already starts with the basePath derived from `path`, which causes double-prefixing and silently matches zero files. Surfaces during `ciderpress check` before the build step.

## 0.5.0

### Minor Changes

- 9b5099b: Restore `apps` and `packages` as first-class root config fields

  Re-adds `apps` and `packages` to `CiderpressConfig` alongside the existing generic `workspaces` field. The home page renders groups in fixed order: Apps, Packages, then custom workspace categories. Each group gets its own heading, auto-generated description, and scope prefix on cards.

  Also adds `collectAllWorkspaceItems()` utility to merge all three sources consistently across the sync engine, validation, landing page injection, and OpenAPI collection.

### Patch Changes

- b912b2d: Update and add READMEs
- Updated dependencies [b912b2d]
  - @ciderpress/theme@0.3.2

## 0.4.0

### Minor Changes

- 179ae48: Add sidebar button variants (style/shape), site footer with social links toggle, client-side navigation via Link, typed IconId, and ESM compatibility patches for rspress plugins

### Patch Changes

- 62248ba: Align `icon` fields on `Section`, `CardConfig`, and `Workspace` with the `IconConfig` union type and remove stale `iconColor` properties

## 0.3.0

### Minor Changes

- 429846c: Add OpenAPI documentation support with auto-generated API reference pages from OpenAPI specs, interactive UI components (schema viewer, code examples in 6 languages, collapsible responses), workspace-scoped sidebar merging, and Copy Markdown functionality.

### Patch Changes

- 77796f1: Auto-generate section landing pages with SectionCard grids for all section groups with children. Fix sidebar group names, duplicate entries, and missing pages for auto-derived links. Redesign SectionCard with compact icon+title row and optional description. Remove all `&&` chains from scripts in favor of turbo task dependencies and pnpm lifecycle hooks.
- 3e7a28a: Enforce consistent file structure conventions across all packages and upgrade dependencies to latest versions.

  ### File Structure

  Apply a standardized file layout pattern to every source file in the monorepo:

  - **Exports first**: All exported functions, constants, and types appear at the top of each file immediately after imports.
  - **Private separator**: Non-exported (private) helper functions are placed below a `// --- Private ---` section separator comment.
  - **Complete JSDoc**: Every function now has full JSDoc documentation including `@param` and `@returns` tags. Non-exported helpers include the `@private` tag.
  - **Spacing cleanup**: Removed inconsistent double blank lines between declarations across all packages.

  ### Test Colocation

  Moved all test files from `packages/*/test/` directories to sit alongside their source files in `packages/*/src/`:

  - `packages/cli/test/` → `packages/cli/src/lib/`
  - `packages/config/test/` → `packages/config/src/`
  - `packages/core/test/` → `packages/core/src/` (including `sync/` and `sync/sidebar/` subdirectories)
  - `packages/templates/test/` → `packages/templates/src/`
  - `packages/theme/test/` → `packages/theme/src/`
  - `packages/ui/test/` → `packages/ui/src/`

  ### Standards

  Updated `.claude/rules/typescript.md` to codify the file structure conventions so all future code follows the same pattern.

  ### Dependency Upgrades
  - `oxlint` 1.55.0 → 1.56.0
  - `oxfmt` 0.40.0 → 0.41.0
  - `@kidd-cli/core` 0.4.0 → 0.7.0
  - `c12` 4.0.0-beta.3 → 4.0.0-beta.4
  - `laufen` 1.1.0 → 1.2.1
  - `@iconify-json/material-icon-theme` 1.2.55 → 1.2.56
  - `@iconify-json/simple-icons` 1.2.73 → 1.2.74

- Updated dependencies [3e7a28a]
  - @ciderpress/theme@0.3.1

## 0.2.2

### Patch Changes

- 1b3b8e3: Add vitest test infrastructure and 122 unit tests across all packages
- Updated dependencies [1b3b8e3]
- Updated dependencies [c57ab70]
  - @ciderpress/theme@0.3.0

## 0.2.1

### Patch Changes

- 6df5ab7: fix(packages/core): map nav items with `text` instead of `title` for Rspress compatibility
  fix(packages/ui): inject critical CSS via Rsbuild `html.tags` so loading screen works in dev mode
  fix(packages/ui): re-enable `data-cp-ready` dismiss flag in ThemeProvider
  fix(packages/ui): replace pong/invaders loaders with simple dots loader
  fix(packages/theme): remove `arcade-fx` as standalone theme (effects already apply with arcade)
- Updated dependencies [6df5ab7]
  - @ciderpress/theme@0.2.1

## 0.2.0

### Minor Changes

- 2055c1a: **New Packages: @ciderpress/theme and @ciderpress/config**

  This release introduces two new packages that refactor configuration and theme management:

  **@ciderpress/theme** - Theme definitions and utilities

  - Type-safe theme definitions with `LiteralUnion` pattern for autocomplete + extensibility
  - Built-in themes: `base`, `midnight`, `arcade`, `arcade-fx`
  - Icon color types with autocomplete support
  - Zod schemas for theme validation
  - Utility functions: `resolveDefaultColorMode`, `isBuiltInTheme`, `isBuiltInIconColor`

  **@ciderpress/config** - Configuration loading and validation

  - Multi-format config support: `.ts`, `.js`, `.json`, `.jsonc`, `.yml`, `.yaml`
  - Type-safe `defineConfig` helper
  - `loadConfig` function with Result-based error handling
  - Zod schemas for complete config validation
  - JSON Schema generation for IDE autocomplete (`@ciderpress/config/schema`)
  - Re-exports theme utilities for convenience

  **@ciderpress/core** - Internal refactoring

  - Removed direct `c12` dependency
  - Now re-exports config and theme utilities from `@ciderpress/config`
  - Public API remains backwards compatible
  - Added new exports: `ICON_COLORS`, `ConfigErrorType`, `LoadConfigOptions`

  **@ciderpress/ui** - Dependency updates

  - Removed `@ciderpress/core` dependency for config types
  - Now uses `@ciderpress/config` and `@ciderpress/theme` directly
  - Added support for custom themes with fallback to 'toggle' color mode
  - Fixed: Added `arcade-fx` theme to theme switcher

  **Migration Guide**

  For most users, this is a drop-in replacement with no migration needed. All existing imports from `@ciderpress/core` continue to work.

  If you were importing from internal paths, update as follows:

  ```ts
  // Before
  import type { ThemeConfig } from '@ciderpress/core/theme'

  // After
  import type { ThemeConfig } from '@ciderpress/config'
  // or
  import type { ThemeConfig } from '@ciderpress/core' // still works via re-export
  ```

  **JSON/YAML Config Support**

  You can now use JSON or YAML config files with IDE autocomplete:

  ```json
  {
    "$schema": "https://raw.githubusercontent.com/thebytefarm/ciderpress/main/packages/config/schemas/schema.json",
    "title": "My Docs",
    "sections": [{ "text": "Guide", "from": "docs" }]
  }
  ```

  ```yaml
  # yaml-language-server: $schema=https://raw.githubusercontent.com/thebytefarm/ciderpress/main/packages/config/schemas/schema.json

  title: My Docs
  sections:
    - text: Guide
      from: docs
  ```

  **Custom Themes**

  The `ThemeName` type now supports custom theme names with autocomplete for built-ins:

  ```ts
  import { defineConfig } from '@ciderpress/config'

  export default defineConfig({
    theme: {
      name: 'my-custom-theme', // ✓ TypeScript accepts this
      colorMode: 'dark',
    },
  })
  ```

### Patch Changes

- Updated dependencies [2055c1a]
  - @ciderpress/theme@0.2.0
