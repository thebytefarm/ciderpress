# @ciderpress/cli

## 1.0.0-rc.8

### Minor Changes

- cebd0d2: Make group badges consistent across every surface, and restructure the `badges` config.

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

### Patch Changes

- Updated dependencies [cebd0d2]
  - @ciderpress/config@1.0.0-rc.7
  - @ciderpress/ui@1.0.0-rc.8

## 1.0.0-rc.7

### Minor Changes

- 96779df: Group the interactive `draft` template picker.

  Templates can now belong to a group, shown in the `draft` picker as a `Group/Name` label (e.g. `guides/UI`). A group comes from either a sub-directory under the configured templates dir (`.templates/guides/ui.md` → `guides`) or an explicit `group` frontmatter field, which wins over the directory. Templates at the templates root and all built-ins stay ungrouped and render flat.

  - **`@ciderpress/templates`** — `Template` gains an optional `group`; `buildTemplate` accepts a directory-derived `group` and reads a `group` frontmatter field (frontmatter overrides), with a new `invalid_group` validation error.
  - **`@ciderpress/cli`** — template discovery now recurses into sub-directories, tagging each template with its sub-path group; `draft` with no `type` shows the single grouped picker.

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

- 90f05b5: Add template fill variables and a `{{ }}` marker convention.

  Templates can now declare fillable variables in frontmatter, `draft` resolves them from arguments or prompts, and any unfilled marker passes through as a raw `{{ }}` marker for a human or agent to complete. The validator no longer rejects non-`{{title}}` markers (fixes the case where registered templates using the convention broke `build`/`check`), and a new lint fails when a published doc still contains one.

  - **`@ciderpress/templates`** — `Template` gains an optional `vars: TemplateVar[]` (each `{ id, title?, description? }`); `buildTemplate()` validates `vars` and no longer emits `unknown_placeholder` (replaced by `invalid_vars`); `render()` now tolerates interior whitespace (`{{ title }}` === `{{title}}`) and leaves unmatched markers untouched; new `findMarkers()` export lists remaining markers.
  - **`@ciderpress/cli`** — `ciderpress draft` gains a repeatable `--var id=value`, always substitutes the built-in `title`/`slug`/`date`/`filename` variables, prompts for declared vars on an interactive terminal (skipping leaves the raw marker), and prints a checklist of unfilled markers. `ciderpress check` and `ciderpress build --check` now fail on unfilled `{{ }}` markers in synced docs (fenced/inline code excluded).

### Patch Changes

- 6edf324: Upgrade dependencies to latest across the workspace, and fix Mermaid rendering on Mermaid v11.

  - Catalog: `@rspress/core` ^2.0.16, `@typescript/native-preview` 7.0.0-dev.20260707.2, `type-fest` ^5.8.0, `vitest` ^4.1.10
  - UI: `mermaid` ^11.16.0 (was v10), iconify icon sets
  - CLI: `@clack/prompts` ^1.7.0
  - Config: `tsx` ^4.23.0, `@types/node` ^26.1.0
  - Tooling: `oxlint` ^1.73.0, `oxfmt` ^0.58.0, `turbo` ^2.10.4

  `@rslib/core` is held at `0.23.1`: 0.23.2 regressed the ESM build (emitted `.js` instead of `.mjs` and dropped the bundled type declarations).

  Mermaid is now on **v11** — the previous v10 pin was based on a misdiagnosis. `mermaid.render()` resolves correctly on v11; the blank-diagram symptom was a defect in `MermaidRenderer.tsx`: `config` defaulted to a fresh `{}` each render, re-firing the render effect in a loop that repeatedly rendered into the same element id and clobbered the injected SVG. Fixed by keying the render callback on a serialized config value and using a unique element id per render call. Diagrams now paint on first load without interaction and survive theme toggles.

- 8313290: Fix top-level (depth-0) leaf pages rendering as collapsible sidebar groups with a dead chevron.

  A `pages[]` entry that is a leaf (`include`/`content`, no `pages` children) placed at the top level was written to the root `_meta.json` as a `dir` item regardless of whether it had children, so Rspress rendered it as an empty expandable group. The root meta now gates the `dir`/`file` distinction on whether the entry has children — matching the treatment already applied to nested and root-promoted entries — so a depth-0 leaf renders as a plain link.

- Updated dependencies [6edf324]
- Updated dependencies [96779df]
- Updated dependencies [395da42]
- Updated dependencies [8313290]
- Updated dependencies [c66ef61]
- Updated dependencies [8313290]
- Updated dependencies [4ae912b]
- Updated dependencies [0d6b434]
- Updated dependencies [90f05b5]
- Updated dependencies [51d6979]
  - @ciderpress/config@1.0.0-rc.6
  - @ciderpress/ui@1.0.0-rc.7
  - @ciderpress/theme@1.0.0-rc.4
  - @ciderpress/templates@1.0.0-rc.5

## 1.0.0-rc.6

### Minor Changes

- 6333ea1: Add config-driven document templates.

  Templates can now be authored as plain `.md`/`.mdx` files with `label`/`hint` frontmatter, discovered from directories declared via the new `templates` config field. A custom template whose filename matches a built-in overrides it, and `.mdx` templates scaffold to `.mdx`.

  - **`@ciderpress/config`** — new `templates?: string | string[]` field.
  - **`@ciderpress/templates`** — new `buildTemplate()` validator and `TemplateError` type; `Template` gains an optional `extension` field. Built-in template files renamed from `.liquid` to `.md` (no behavior change).
  - **`@ciderpress/cli`** — new `ciderpress templates list` and `ciderpress templates check` commands; template validation folded into `ciderpress check` and `ciderpress build`; `ciderpress draft` now discovers config templates and preserves the template's extension.

### Patch Changes

- 8a6c5ed: Fix Copy Markdown on OpenAPI pages

  Copying markdown from a generated OpenAPI reference page produced nothing, and
  the pages were missing from `llms.txt`. The generated MDX stored its
  pre-rendered markdown in an `export const markdown`, but Rspress strips ESM
  exports during its static markdown pass — so the value was `undefined` when the
  page rendered to `.md`, producing a zero-byte file. The docs-bar Copy Markdown
  button (which fetches that `.md`) therefore copied nothing.

  The markdown is now inlined directly into the page components so it survives the
  static markdown pass. OpenAPI pages now expose their full markdown to the copy
  button, `.md` endpoints, and `llms.txt`.

  This also removes the redundant in-content copy button that had been added as a
  workaround on OpenAPI pages — the docs-bar button is now the single, working
  copy affordance, consistent with every other page.

- 44492dc: Skip agent instruction files during glob discovery

  Content globs (`docs/**/*.md`, workspace `docs/*.md`, recursive includes, and
  `.planning/`) no longer sweep coding-agent instruction files into the site.
  `CLAUDE.md`, `AGENTS.md`, `AGENT.md`, and `GEMINI.md` are now excluded from glob
  matches.

  Matching is case-sensitive against the uppercase convention only — a lowercase
  `claude.md` is treated as ordinary content. Naming one of these files directly
  with a literal (non-glob) `include` still publishes it, so the deny list only
  affects glob discovery.

- Updated dependencies [6333ea1]
- Updated dependencies [8a6c5ed]
  - @ciderpress/templates@1.0.0-rc.4
  - @ciderpress/config@1.0.0-rc.5
  - @ciderpress/ui@1.0.0-rc.6

## 1.0.0-rc.5

### Patch Changes

- Updated dependencies [aa885e7]
  - @ciderpress/ui@1.0.0-rc.5

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
- Updated dependencies [cb7412b]
- Updated dependencies [cb7412b]
  - @ciderpress/config@1.0.0-rc.4
  - @ciderpress/ui@1.0.0-rc.4
  - @ciderpress/theme@1.0.0-rc.3
  - @ciderpress/templates@1.0.0-rc.3

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

### Patch Changes

- Updated dependencies [f71d7f4]
  - @ciderpress/config@1.0.0-rc.3
  - @ciderpress/ui@1.0.0-rc.3

## 1.0.0-rc.2

### Patch Changes

- e4d81aa: Test/exercise the CI release pipeline.

  No code changes — this changeset only exists to force the changesets bot to open a release PR, validate that the GitHub Actions workflow can publish via npm trusted publishing (no `NPM_TOKEN`, OIDC-only with `id-token: write` + `NPM_CONFIG_PROVENANCE: true`), and confirm provenance attestations land on the resulting `1.0.0-rc.2` releases. Following the local bootstrap publish of `1.0.0-rc.1`, this is the first CI-driven cut.

- Updated dependencies [e4d81aa]
  - @ciderpress/config@1.0.0-rc.2
  - @ciderpress/templates@1.0.0-rc.2
  - @ciderpress/theme@1.0.0-rc.2
  - @ciderpress/ui@1.0.0-rc.2

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
  - @ciderpress/config@1.0.0-rc.1
  - @ciderpress/ui@1.0.0-rc.1
  - @ciderpress/theme@1.0.0-rc.1
  - @ciderpress/templates@1.0.0-rc.1

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
  - @ciderpress/config@1.0.0-rc.0
  - @ciderpress/ui@1.0.0-rc.0
  - @ciderpress/theme@1.0.0-rc.0
  - @ciderpress/templates@1.0.0-rc.0

## 0.9.1

### Patch Changes

- 186ee92: Fix crash reporting for screen commands — errors in dev mode TUI now display in-app with crash log path and hotkeys to copy/quit

## 0.9.0

### Minor Changes

- d26e7f6: Add crash reporter and error boundary — every CLI crash now writes a structured JSON log to a temp file and prints a one-liner fatal message pointing to it

## 0.8.5

### Patch Changes

- f26cf74: fix: resolve SWC decorator panic by upgrading rsbuild to 2.0.0-rc.1
- Updated dependencies [ca4f487]
- Updated dependencies [f26cf74]
  - @ciderpress/core@0.11.0
  - @ciderpress/ui@0.9.1

## 0.8.4

### Patch Changes

- c9a2cc8: perf: reduce @ciderpress/ui bundle from 15MB to 767KB by externalizing ts-morph

  fix: close Rspress dev server on quit (no more double ctrl+c / blank screen)

- Updated dependencies [4c04f9d]
- Updated dependencies [c9a2cc8]
  - @ciderpress/ui@0.9.0

## 0.8.3

### Patch Changes

- ffed994: fix(packages/ui,packages/cli,packages/ciderpress): resolve duplicate React instances in consumer repos

  Added `react` and `react-dom` resolve aliases to the Rspress builder config so rspack always uses the consumer's single React copy. Moved `react` from direct dependencies to peer dependencies in `@ciderpress/cli` to prevent pnpm from installing a private copy. Aligned React peer version range in `ciderpress` to `^19.2.5`.

- Updated dependencies [ffed994]
  - @ciderpress/ui@0.8.13

## 0.8.2

### Patch Changes

- 81d5928: Fix OpenAPI sidebar scoping, meta ordering, and sync error surfacing

  - Add root-level OpenAPI entries (e.g. petstore) to root `_meta.json` and `scopes.json` so they get their own standalone sidebar scope
  - Add workspace-level OpenAPI entries to their parent directory's `_meta.json` for proper sidebar discovery
  - Fix `_meta.json` ordering: leaf files appear before collapsible directory sections
  - Remove duplicate Overview highlight for root-level OpenAPI sections
  - Surface sync errors to CLI callers instead of silently swallowing them

- 81d5928: upgrade dependencies to latest
- Updated dependencies [81d5928]
- Updated dependencies [81d5928]
  - @ciderpress/core@0.10.2
  - @ciderpress/ui@0.8.12

## 0.8.1

### Patch Changes

- 7a39840: upgrade dependencies to latest
- Updated dependencies [d25fea5]
- Updated dependencies [7a39840]
  - @ciderpress/ui@0.8.11
  - @ciderpress/core@0.10.1

## 0.8.0

### Minor Changes

- c169109: Sync engine now only processes what changed instead of running a full sync on every pass.
  - **mtime-based page skip**: pages whose source mtime and frontmatter hash match the previous manifest skip the entire read/transform/hash pipeline
  - **Parallel page copy**: all pages are copied concurrently via `Promise.all` instead of sequential reduce
  - **Parallel `copyAll`**: public asset directory copy runs in parallel
  - **Asset generation skip**: banner/logo/icon SVGs skip generation entirely when the asset config hash is unchanged; `shouldGenerate` also compares content to avoid redundant writes
  - **Image copy skip**: destination images are skipped when their mtime is at least as recent as the source
  - **OpenAPI spec caching**: specs are only re-parsed when their file mtime changes; a shared cache persists across dev-mode sync passes and is cleared on config reload
  - **Structural change detection**: `resolvedCount` mismatch between syncs forces a full resync to handle added/removed pages correctly
  - **Build system migration**: switched CLI from rslib to kidd's native build system (tsdown-based), with static command imports, proper dependency externalization, and React/Ink TUI dev screen

### Patch Changes

- c169109: Fix dev TUI banner and quit hotkey

  - Replace broken hand-crafted ASCII banner with `ink-big-text` (cfonts) and `ink-gradient` for properly styled terminal output
  - Fix "q" hotkey not exiting by adding `process.exit(0)` after Ink's `exit()`, which only unmounts React but leaves the dev server and watcher keeping the process alive

- c169109: Fix home page not updating on config changes during dev

  The restart-relevance hash was missing `actions`, `features`, `apps`, `packages`, and `workspaces` — all of which feed into the generated home page hero, feature cards, and workspace cards. Changes to these fields now correctly trigger a dev server restart so the home page reflects the updated config.

- Updated dependencies [c169109]
- Updated dependencies [c169109]
  - @ciderpress/core@0.10.0
  - @ciderpress/ui@0.8.10

## 0.7.0

### Minor Changes

- 7a5954f: Sync engine now only processes what changed instead of running a full sync on every pass.
  - **mtime-based page skip**: pages whose source mtime and frontmatter hash match the previous manifest skip the entire read/transform/hash pipeline
  - **Parallel page copy**: all pages are copied concurrently via `Promise.all` instead of sequential reduce
  - **Parallel `copyAll`**: public asset directory copy runs in parallel
  - **Asset generation skip**: banner/logo/icon SVGs skip generation entirely when the asset config hash is unchanged; `shouldGenerate` also compares content to avoid redundant writes
  - **Image copy skip**: destination images are skipped when their mtime is at least as recent as the source
  - **OpenAPI spec caching**: specs are only re-parsed when their file mtime changes; a shared cache persists across dev-mode sync passes and is cleared on config reload
  - **Structural change detection**: `resolvedCount` mismatch between syncs forces a full resync to handle added/removed pages correctly
  - **Build system migration**: switched CLI from rslib to kidd's native build system (tsdown-based), with static command imports, proper dependency externalization, and React/Ink TUI dev screen

### Patch Changes

- Updated dependencies [7a5954f]
  - @ciderpress/core@0.9.0
  - @ciderpress/ui@0.8.9

## 0.6.0

### Minor Changes

- 3e5f014: feat(packages/cli): consolidate sync and generate commands into build

  The `build` command now runs content sync and asset generation automatically.
  The standalone `sync` and `generate` commands have been removed.

### Patch Changes

- 1e966e1: Fix workspace include resolution for `apps` and `packages` items:

  - Use deep glob pattern (`docs/**/*.md`) as default include when `recursive: true`. Previously the default was always `docs/*.md` regardless of the flag.
  - Add config check warning when an explicit include pattern already starts with the basePath derived from `path`, which causes double-prefixing and silently matches zero files. Surfaces during `ciderpress check` before the build step.

- Updated dependencies [e3b8c86]
- Updated dependencies [1e966e1]
- Updated dependencies [0113fb1]
  - @ciderpress/core@0.8.1
  - @ciderpress/ui@0.8.8

## 0.5.4

### Patch Changes

- f88d0f7: Fix config changes not propagating during dev

  Disable Rspress's persistent build cache on config-reload restarts. The cache's digest only tracks sidebar/nav structure, so changes to title, theme, colors, and other `source.define` values were invisible to it, causing stale output to be served after a restart.

## 0.5.3

### Patch Changes

- b912b2d: Update and add READMEs
- Updated dependencies [9b5099b]
- Updated dependencies [9b5099b]
- Updated dependencies [b912b2d]
  - @ciderpress/core@0.8.0
  - @ciderpress/ui@0.8.7
  - @ciderpress/templates@0.1.2

## 0.5.2

### Patch Changes

- Updated dependencies [9388cce]
  - @ciderpress/core@0.7.5
  - @ciderpress/ui@0.8.6

## 0.5.1

### Patch Changes

- Updated dependencies [4179cee]
  - @ciderpress/core@0.7.4
  - @ciderpress/ui@0.8.5

## 0.5.0

### Minor Changes

- 56862d1: Add `--ref` option to `ciderpress diff` for comparing between commits, enabling use as a Vercel `ignoreCommand`

### Patch Changes

- Updated dependencies [56862d1]
  - @ciderpress/ui@0.8.4

## 0.4.3

### Patch Changes

- Updated dependencies [71af7e9]
  - @ciderpress/core@0.7.3
  - @ciderpress/ui@0.8.3

## 0.4.2

### Patch Changes

- Updated dependencies [3f36be0]
  - @ciderpress/core@0.7.2
  - @ciderpress/ui@0.8.2

## 0.4.1

### Patch Changes

- b090c88: diff command now watches top-level root directories so asset and image changes are detected
- Updated dependencies [03f1229]
  - @ciderpress/ui@0.8.1

## 0.4.0

### Minor Changes

- 1f6b8c1: Add `ciderpress diff` command to show changed files in configured source directories

### Patch Changes

- 03b0726: Wait for port release before restarting dev server to prevent EADDRINUSE errors
- 179ae48: Add sidebar button variants (style/shape), site footer with social links toggle, client-side navigation via Link, typed IconId, and ESM compatibility patches for rspress plugins
- Updated dependencies [d8cf9b2]
- Updated dependencies [8a125b8]
- Updated dependencies [179ae48]
  - @ciderpress/ui@0.8.0
  - @ciderpress/core@0.7.1

## 0.3.4

### Patch Changes

- 7d074af: Fix dev server crash on config-triggered restart failure. Previously, if the Rspress dev server failed to start after a config change, the entire process would exit. Now the watcher stays alive and logs a message so the user can fix the config and save again to retry.
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

- Updated dependencies [77796f1]
- Updated dependencies [429846c]
- Updated dependencies [3e7a28a]
  - @ciderpress/core@0.7.0
  - @ciderpress/ui@0.7.0
  - @ciderpress/templates@0.1.1

## 0.3.3

### Patch Changes

- Updated dependencies [77e872e]
  - @ciderpress/ui@0.6.1

## 0.3.2

### Patch Changes

- 1b3b8e3: Add vitest test infrastructure and 122 unit tests across all packages
- Updated dependencies [1b3b8e3]
- Updated dependencies [c57ab70]
  - @ciderpress/core@0.6.2
  - @ciderpress/ui@0.6.0

## 0.3.1

### Patch Changes

- Updated dependencies [6df5ab7]
  - @ciderpress/core@0.6.1
  - @ciderpress/ui@0.5.1

## 0.3.0

### Minor Changes

- 1361d59: # Comprehensive Config API Refactor

  Major breaking changes to the ciderpress configuration API for better consistency and clarity.

  ## Breaking Changes

  ### Type System Refactor

  **BREAKING**: The type hierarchy has been restructured with a new base type:

  - **New `Entry` base type**: Introduced with common fields (`title`, `icon`, `description`) that all config types now extend
  - **Old `Entry` type renamed to `Section`**: The previous `Entry` type (representing a section/page node) is now called `Section` for clearer semantics. **No backward compatibility alias** - the name `Entry` is now used for the new base type.
  - **`WorkspaceItem` → `Workspace`**: Renamed for consistency (backward compatible alias maintained)
  - **`WorkspaceGroup` → `WorkspaceCategory`**: More descriptive name (backward compatible alias maintained)

  All config types now extend the new `Entry` base:

  ```ts
  // All types now extend Entry
  interface Entry {
    readonly title: string | TitleConfig
    readonly icon?: IconConfig
    readonly description?: string
  }

  interface Section extends Entry {
    /* ... */
  }
  interface Workspace extends Entry {
    /* ... */
  }
  interface WorkspaceCategory extends Entry {
    /* ... */
  }
  interface Feature extends Entry {
    /* ... */
  }
  ```

  ### Workspace Field Changes

  **`path` → `prefix`**: Renamed for consistency with `Section.prefix`

  ```ts
  // Before
  apps: [
    {
      title: 'API',
      path: '/apps/api',
    },
  ]

  // After
  apps: [
    {
      title: 'API',
      prefix: '/apps/api',
    },
  ]
  ```

  **`name` → `title`** on `WorkspaceCategory`: All types now use `title` consistently

  ```ts
  // Before
  workspaces: [
    {
      name: 'Integrations',
      items: [/* ... */],
    },
  ]

  // After
  workspaces: [
    {
      title: 'Integrations',
      items: [/* ... */],
    },
  ]
  ```

  ### Discovery Configuration

  Workspace items now use a `discovery` field to configure content auto-discovery, eliminating duplication with Section fields:

  ```ts
  // Before
  apps: [
    {
      title: 'API',
      path: '/apps/api',
      from: 'docs/*.md',
      titleFrom: 'frontmatter',
      sort: 'alpha',
      recursive: false,
    },
  ]

  // After
  apps: [
    {
      title: 'API',
      prefix: '/apps/api',
      discovery: {
        from: 'docs/*.md',
        title: { from: 'auto' },
        sort: 'alpha',
        recursive: false,
      },
    },
  ]
  ```

  **Note**: The `from` field in `discovery` is relative to the workspace's base path (derived from `prefix`). For example, `prefix: "/apps/api"` + `discovery.from: "docs/*.md"` resolves to `apps/api/docs/*.md` (repo-root relative).

  ### Title Derivation Default Changed

  **Default `titleFrom` changed from `'filename'` to `'auto'`**

  The `'auto'` strategy uses a smart fallback chain:

  1. Try frontmatter `title` field
  2. Fall back to first `# heading`
  3. Fall back to filename (kebab-to-title)

  This is more intuitive and matches user expectations. If you relied on `'filename'` behavior, explicitly set `titleFrom: 'filename'`.

  ### New TitleConfig Type

  You can now use an object for the `title` field to configure derivation and transformation:

  ```ts
  // Simple string (unchanged)
  title: 'Guides'

  // New: Title configuration object
  title: {
    from: 'auto',  // or 'filename' | 'heading' | 'frontmatter'
    transform: (text, slug) => text.toUpperCase()
  }
  ```

  This is available on all types that extend `Entry`.

  ## New Features

  ### Discovery Configuration Type

  The new `Discovery` type (with `RecursiveDiscoveryConfig` and `FlatDiscoveryConfig` variants) provides proper typing for content discovery configuration:

  ```ts
  interface Discovery {
    from?: string | GlobPattern
    title?: TitleConfig
    sort?: 'alpha' | 'filename' | ((a, b) => number)
    exclude?: GlobPattern[]
    frontmatter?: Frontmatter
    recursive?: boolean
    indexFile?: string // Only when recursive: true
  }
  ```

  ### Enhanced Icon Documentation

  Icon colors are now fully documented in types with the 8-color palette rotation:

  - purple (default)
  - blue
  - green
  - amber
  - cyan
  - red
  - pink
  - slate

  ## Migration Guide

  ### Automated Find/Replace
  1. **Update workspace field names**:

     ```
     Find:    path: '/
     Replace: prefix: '/
     ```

  2. **Update workspace group names**:

     ```
     Find:    name: '
     Replace: title: '
     ```

  3. **Update type imports** (if using types directly):

     ```ts
     // Before
     import type { Entry, WorkspaceItem, WorkspaceGroup } from '@ciderpress/core'

     // After
     import type { Section, Workspace, WorkspaceCategory } from '@ciderpress/core'
     ```

  ### Manual Updates
  1. **Migrate workspace discovery configuration** (optional but recommended):

     ```ts
     // Before
     apps: [
       {
         title: 'API',
         path: '/apps/api',
         from: 'docs/*.md',
         titleFrom: 'frontmatter',
         sort: 'alpha',
       },
     ]

     // After
     apps: [
       {
         title: 'API',
         prefix: '/apps/api',
         discovery: {
           from: 'docs/*.md',
           title: { from: 'auto' }, // Better default!
           sort: 'alpha',
         },
       },
     ]
     ```

  2. **Verify title derivation behavior**: If you have sections with `titleFrom: 'filename'` and markdown files with frontmatter or headings, the default `'auto'` mode will now use those instead of the filename. To preserve old behavior, explicitly set `titleFrom: 'filename'`.

  ### Backward Compatibility
  - Old type names (`Entry`, `WorkspaceItem`, `WorkspaceGroup`) are re-exported as aliases
  - Old field names on `Section` (`titleFrom`, `titleTransform`) still work alongside the new `TitleConfig` approach
  - No immediate action required, but migrating to new API is recommended

  ## Documentation

  See updated guides:

  - Workspaces - New `prefix` and `discovery` fields
  - Auto-Discovery - New `'auto'` titleFrom mode and `TitleConfig`
  - Configuration Reference - Full field reference

### Patch Changes

- 3cf8dc0: Improve dev command config reloading and file watching

  - **Auto-restart dev server on config changes**: Dev server now automatically restarts when config changes are detected, using Rspress ServerInstance.close() API
  - **Cache-busting for config reloads**: Use jiti with moduleCache disabled via c12's custom import option to ensure config changes are picked up immediately
  - **Fix watcher for non-existent paths**: Normalize watch paths to nearest existing ancestor before adding to chokidar, ensuring sections can be detected even if their directories don't exist yet
  - **Dynamic watch path updates**: Watcher now adds/removes paths when config sections change
  - **Fix type signature**: OnConfigReload type now correctly includes newConfig parameter

- Updated dependencies [2055c1a]
- Updated dependencies [3cf8dc0]
- Updated dependencies [1361d59]
- Updated dependencies [941550c]
  - @ciderpress/core@0.6.0
  - @ciderpress/ui@0.5.0

## 0.2.2

### Patch Changes

- Updated dependencies [2f01fa4]
  - @ciderpress/ui@0.4.1

## 0.2.1

### Patch Changes

- Updated dependencies [7255aa3]
  - @ciderpress/core@0.5.0
  - @ciderpress/ui@0.4.0

## 0.2.0

### Minor Changes

- 83cc277: Add `ciderpress check` command for config validation and deadlink detection

  Introduces a standalone `check` command that validates the ciderpress config and
  detects broken internal links by running a silent Rspress build. The `build`
  command now includes checks by default (`--check` flag, opt out with
  `--no-check`). Config validation is moved from `defineConfig` (which was
  calling `process.exit`) into `loadConfig`, returning structured `Result` tuples
  so the CLI can present friendly error messages.

### Patch Changes

- Updated dependencies [83cc277]
- Updated dependencies [d1e2b76]
  - @ciderpress/core@0.4.0
  - @ciderpress/ui@0.3.1

## 0.1.4

### Patch Changes

- Updated dependencies [aea7b38]
- Updated dependencies [d1b4ad5]
- Updated dependencies [37c2ec6]
  - @ciderpress/ui@0.3.0
  - @ciderpress/core@0.3.0

## 0.1.3

### Patch Changes

- Updated dependencies [f4d5388]
  - @ciderpress/ui@0.2.2

## 0.1.2

### Patch Changes

- 2e43a80: Add README files to all packages and update license copyright to Joggr, Inc.
- 2e43a80: Fix type exports and dependency declarations

  - Generate bundled `.d.ts` declaration files via Rslib `dts.bundle` (previously no declaration files were emitted)
  - Point `exports.types` to generated `dist/*.d.ts` instead of raw source files
  - Move `react`, `react-dom`, and `@rspress/core` to `peerDependencies` in `@ciderpress/ui`
  - Surface `react`, `react-dom`, and `@rspress/core` as `peerDependencies` in `ciderpress`
  - Centralize shared dependency versions via pnpm catalog
  - Bump `@kidd-cli/core` to `^0.4.0` in `@ciderpress/cli`

- Updated dependencies [2e43a80]
- Updated dependencies [2e43a80]
  - @ciderpress/core@0.2.1
  - @ciderpress/ui@0.2.1

## 0.1.1

### Patch Changes

- Updated dependencies [77adac6]
  - @ciderpress/core@0.2.0
  - @ciderpress/ui@0.2.0

## 0.1.0

### Minor Changes

- 04d2e2b: Initial release

  CLI commands (dev, build, serve, sync, clean, setup, dump, generate) powered by yargs and @clack/prompts, with chokidar-based file watcher for live reload during development.
