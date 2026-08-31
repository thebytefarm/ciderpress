# @ciderpress/theme

## 1.0.0-rc.6

### Major Changes

- Rename to `ciderpress`. The project moved to the `thebytefarm` org and the kit now lives at the unscoped `ciderpress` package name (replacing `@zpress/kit`).

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

- ciderpress 1.0 — release candidate

  This is a major release that locks the v1 public API. Headline changes:

  **Theme system**

  - Replaced the built-in `base` theme with apple-named built-ins:
    `honeycrisp` (red, dark + light — the canonical brand), `grannysmith`
    (green, dark + light), `midnight` (deep dark blue, dark only), and
    `arcade` (neon green, dark only). The legacy slug `'default'` aliases
    to `'honeycrisp'` via `THEME_ALIASES`.
  - Replaced `theme.colorMode` with `theme.variant` (values: `'dark' | 'light'`).
    The `'toggle'` value is no longer supported — themes that declare both
    variants always show the toggle; themes that declare one hide it.
  - `defineTheme()` input shape changed from `{ name, tokens, modes, defaultMode }`
    to `{ name, variants: { dark?, light? }, defaultVariant? }`. The factory
    validates the envelope before parsing token trees so error messages now
    point at the offending input field.
  - `ciderpress`, `@ciderpress/core`, and `@ciderpress/config` no longer re-export
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
  - Removed unused `js-yaml` and `@types/js-yaml` direct deps from `@ciderpress/core`.

  **Fixes**

  - `safe-url.ts` regex now stores its control-character range as Unicode
    escape sequences (`\u0000`–`\u007F`) instead of raw control bytes. Git
    no longer marks the file as binary; editors render it correctly.
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
          name: 'company-brand',
  -       tokens: brandTokens,
  -       modes: ['dark'],
  -       defaultMode: 'dark',
  +       variants: { dark: brandTokens },
  +       defaultVariant: 'dark',
        }),
      ],
  -   workspaces: [{ title: 'Integrations', ... } as WorkspaceCategory],
  +   workspaces: [{ title: 'Integrations', ... } as WorkspaceGroup],
    })
  ```

### Minor Changes

- Custom theme fonts reach every surface, including the homepage hero

  A theme's `fonts.family` now drives the whole site. Previously a custom
  theme could set `sans` and `mono` and see them apply to documentation
  pages while the hero, nav, and feature cards stayed on the built-in
  stacks.

  Two things caused that. Component CSS hardcoded font stacks (the feature
  card title was pinned to `Geist Pixel Square`), and the canonical tokens
  were derived _from_ the hardcoded compatibility variables rather than the
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

### Patch Changes

- Stop brand accent copy washing out to pink on dark, and fix eyebrow contrast

  `**emphasis**` in display copy resolves to `.cp-accent`, which on dark took
  `--cp-c-brand-lighter` — the palest rung of the brand ramp. It cleared contrast
  by a wide margin (10.43:1 on honeycrisp) but washed the hue out: a light red
  reads as pink rather than as the brand.

  Dark accents now take `--cp-c-brand-light`, the most saturated rung that still
  clears 4.5:1. Every theme gets a more brand-coloured accent — amber `#fcd34d`
  → `#fbbf24`, grannysmith `#bef264` → `#a3e635`, midnight `#bfdbfe` → `#93c5fd`,
  arcade `#99ffcc` → `#66ffbb`. Light variants keep `--cp-c-brand-2` and are
  unchanged.

  Both red themes needed their `light` rung retuned, because red 400 was itself
  the salmon being complained about and red 600 missed the bar:

  - **honeycrisp** `brand.light` `#f87171` (red 400) → `#ef4444` (red 500)
  - **mulled** `brand.light` `#dc2626` (red 600, 4.10:1 — under the bar) →
    `#ef4444` (red 500, 5.26:1)

  Both still sit between `primary` and `lighter`, so the ramp ordering holds, and
  button hover states still lighten their base.

  Separately, the three home eyebrows (`.cp-feature-section-head__eyebrow`,
  `.cp-cta__eyebrow`, `.cp-split__eyebrow`) coloured themselves from
  `--cp-c-brand-1`. That token is a **fill** colour — tuned to sit behind
  `--cp-c-brand-fg`, not to be read as text. At the 11px eyebrow size the 4.5:1
  bar applies and it missed in four theme/variant pairs: 2.38:1 on mulled dark,
  4.10:1 on honeycrisp dark, 3.07:1 on amber light, 3.09:1 on grannysmith light.
  They now follow the same pair as `.cp-accent`.

  Every theme/variant pair now clears 4.5:1, the lowest being 4.83:1 on amber
  light.

- Upgrade dependencies to latest across the workspace.

  - Catalog: `@rslib/core` ^0.23.1, `@rspress/core` ^2.0.15, `@typescript/native-preview` 7.0.0-dev.20260628.1, `vitest` ^4.1.9
  - CLI: `@clack/prompts` ^1.6.0, `ink` ^7.1.0, `liquidjs` ^10.27.1
  - UI: `react-aria-components` ^1.19.0, `esbuild` ^0.28.1, iconify icon sets (`material-icon-theme`, `simple-icons`, `vscode-icons`)
  - Tooling: `oxlint` ^1.71.0, `oxfmt` ^0.56.0, `turbo` ^2.10.0, `@microsoft/api-extractor` ^7.58.9, `eslint-plugin-jsdoc` ^63.0.10, `eslint-plugin-security` ^4.0.1, `@types/node` ^26.0.1
  - E2E: `@playwright/test` ^1.61.1, `@argos-ci/playwright` ^7.1.1
  - Benchmarks: `@codspeed/vitest-plugin` ^5.7.1

  `mermaid` stays pinned at ^10.9.6 — v11 uses langium for parsing and breaks Rspress's webpack compilation of global components.

- Upgrade dependencies to latest across the workspace, and fix Mermaid rendering on Mermaid v11.

  - Catalog: `@rspress/core` ^2.0.16, `@typescript/native-preview` 7.0.0-dev.20260707.2, `type-fest` ^5.8.0, `vitest` ^4.1.10
  - UI: `mermaid` ^11.16.0 (was v10), iconify icon sets
  - CLI: `@clack/prompts` ^1.7.0
  - Config: `tsx` ^4.23.0, `@types/node` ^26.1.0
  - Tooling: `oxlint` ^1.73.0, `oxfmt` ^0.58.0, `turbo` ^2.10.4

  `@rslib/core` is held at `0.23.1`: 0.23.2 regressed the ESM build (emitted `.js` instead of `.mjs` and dropped the bundled type declarations).

  Mermaid is now on **v11** — the previous v10 pin was based on a misdiagnosis. `mermaid.render()` resolves correctly on v11; the blank-diagram symptom was a defect in `MermaidRenderer.tsx`: `config` defaulted to a fresh `{}` each render, re-firing the render effect in a loop that repeatedly rendered into the same element id and clobbered the injected SVG. Fixed by keying the render callback on a serialized config value and using a unique element id per render call. Diagrams now paint on first load without interaction and survive theme toggles.

- Test/exercise the CI release pipeline.

  No code changes — this changeset only exists to force the changesets bot to open a release PR, validate that the GitHub Actions workflow can publish via npm trusted publishing (no `NPM_TOKEN`, OIDC-only with `id-token: write` + `NPM_CONFIG_PROVENANCE: true`), and confirm provenance attestations land on the resulting `1.0.0-rc.2` releases. Following the local bootstrap publish of `1.0.0-rc.1`, this is the first CI-driven cut.

- d8da2eb: Upgrade runtime and build dependencies to their latest compatible releases.

  This includes TypeScript 7, Rslib 0.23.2, React 19.2.8, and the current workspace
  toolchain. Improve compatibility with current TypeScript, React, and Rspress releases.

- Upgrade dependencies to latest across the workspace.

  - Catalog: `@rslib/core` ^0.21.5, `@rspress/core` ^2.0.12, `@typescript/native-preview` 7.0.0-dev.20260519.1, `vitest` ^4.1.7, `zod` ^4.4.3
  - CLI: `@clack/prompts` ^1.4.0, `@kidd-cli/core` ^0.24.0, `ink` ^7.0.3, `jiti` ^2.7.0, `liquidjs` ^10.27.0
  - UI: `katex` ^0.16.47, `openapi-sampler` ^1.7.3, `ts-morph` ^28.0.0, iconify icon sets, React 19.2.6
  - Config: `c12` 4.0.0-beta.5, `tsx` ^4.22.3
  - Tooling: `oxlint` ^1.66.0, `oxfmt` ^0.51.0, `turbo` ^2.9.14, `@types/node` ^25.9.1, `@types/react` ^19.2.15

  `mermaid` stays pinned at ^10.9.5 — v11 uses langium for parsing and breaks Rspress's webpack compilation of global components.

- Post-rc.0 fixes ahead of the next pre-release tag.

  **@ciderpress/ui**

  - Restored the theme-aware `<CiderpressLogo />` SVG in the navbar. Root cause:
    webpack's CJS-flavored resolver couldn't load `ciderpress` / `@ciderpress/ui`
    because their `.` exports only declared `import` — the client bundle was
    crashing entirely, so the `NavLogo` portal never hydrated. Aliased both
    via `import.meta.resolve` in `createRspressConfig`.
  - Single-variant themes now hide the appearance toggle. The CSS rule was
    inside `@layer ciderpress.overrides` and was losing to Rspress's unlayered
    defaults; hoisted it out of the layer.
  - Feature card grids inside MDX doc pages no longer pick up the home-page
    section's 32px horizontal padding, so cards align with body prose.
  - New: `pageType: 'blank'` frontmatter now suppresses the site footer
    (Rspress already skipped the navbar). Blank pages are fully chromeless —
    use for marketing landings inside a docs deployment.

  **Repo**

  - Deleted `@ciderpress/core` and redistributed its sync engine into
    `@ciderpress/cli/lib` and its config loader into `@ciderpress/config/loader`.
    The package is no longer published. Imports must move accordingly:
    - `import { loadConfig } from '@ciderpress/core'` → `from '@ciderpress/config/loader'`
    - sync engine internals are no longer a public surface.
  - Swapped `ts-pattern` + `es-toolkit` direct usage for `massaman/match` and
    `massaman/*` subpaths across all packages.

## 1.0.0-rc.5

### Minor Changes

- 583fecc: Custom theme fonts reach every surface, including the homepage hero

  A theme's `fonts.family` now drives the whole site. Previously a custom
  theme could set `sans` and `mono` and see them apply to documentation
  pages while the hero, nav, and feature cards stayed on the built-in
  stacks.

  Two things caused that. Component CSS hardcoded font stacks (the feature
  card title was pinned to `Geist Pixel Square`), and the canonical tokens
  were derived _from_ the hardcoded compatibility variables rather than the
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

### Patch Changes

- 583fecc: Stop brand accent copy washing out to pink on dark, and fix eyebrow contrast

  `**emphasis**` in display copy resolves to `.cp-accent`, which on dark took
  `--cp-c-brand-lighter` — the palest rung of the brand ramp. It cleared contrast
  by a wide margin (10.43:1 on honeycrisp) but washed the hue out: a light red
  reads as pink rather than as the brand.

  Dark accents now take `--cp-c-brand-light`, the most saturated rung that still
  clears 4.5:1. Every theme gets a more brand-coloured accent — amber `#fcd34d`
  → `#fbbf24`, grannysmith `#bef264` → `#a3e635`, midnight `#bfdbfe` → `#93c5fd`,
  arcade `#99ffcc` → `#66ffbb`. Light variants keep `--cp-c-brand-2` and are
  unchanged.

  Both red themes needed their `light` rung retuned, because red 400 was itself
  the salmon being complained about and red 600 missed the bar:

  - **honeycrisp** `brand.light` `#f87171` (red 400) → `#ef4444` (red 500)
  - **mulled** `brand.light` `#dc2626` (red 600, 4.10:1 — under the bar) →
    `#ef4444` (red 500, 5.26:1)

  Both still sit between `primary` and `lighter`, so the ramp ordering holds, and
  button hover states still lighten their base.

  Separately, the three home eyebrows (`.cp-feature-section-head__eyebrow`,
  `.cp-cta__eyebrow`, `.cp-split__eyebrow`) coloured themselves from
  `--cp-c-brand-1`. That token is a **fill** colour — tuned to sit behind
  `--cp-c-brand-fg`, not to be read as text. At the 11px eyebrow size the 4.5:1
  bar applies and it missed in four theme/variant pairs: 2.38:1 on mulled dark,
  4.10:1 on honeycrisp dark, 3.07:1 on amber light, 3.09:1 on grannysmith light.
  They now follow the same pair as `.cp-accent`.

  Every theme/variant pair now clears 4.5:1, the lowest being 4.83:1 on amber
  light.

## 1.0.0-rc.4

### Patch Changes

- 6edf324: Upgrade dependencies to latest across the workspace, and fix Mermaid rendering on Mermaid v11.

  - Catalog: `@rspress/core` ^2.0.16, `@typescript/native-preview` 7.0.0-dev.20260707.2, `type-fest` ^5.8.0, `vitest` ^4.1.10
  - UI: `mermaid` ^11.16.0 (was v10), iconify icon sets
  - CLI: `@clack/prompts` ^1.7.0
  - Config: `tsx` ^4.23.0, `@types/node` ^26.1.0
  - Tooling: `oxlint` ^1.73.0, `oxfmt` ^0.58.0, `turbo` ^2.10.4

  `@rslib/core` is held at `0.23.1`: 0.23.2 regressed the ESM build (emitted `.js` instead of `.mjs` and dropped the bundled type declarations).

  Mermaid is now on **v11** — the previous v10 pin was based on a misdiagnosis. `mermaid.render()` resolves correctly on v11; the blank-diagram symptom was a defect in `MermaidRenderer.tsx`: `config` defaulted to a fresh `{}` each render, re-firing the render effect in a loop that repeatedly rendered into the same element id and clobbered the injected SVG. Fixed by keying the render callback on a serialized config value and using a unique element id per render call. Diagrams now paint on first load without interaction and survive theme toggles.

## 1.0.0-rc.3

### Patch Changes

- 5c3e841: Upgrade dependencies to latest across the workspace.

  - Catalog: `@rslib/core` ^0.23.1, `@rspress/core` ^2.0.15, `@typescript/native-preview` 7.0.0-dev.20260628.1, `vitest` ^4.1.9
  - CLI: `@clack/prompts` ^1.6.0, `ink` ^7.1.0, `liquidjs` ^10.27.1
  - UI: `react-aria-components` ^1.19.0, `esbuild` ^0.28.1, iconify icon sets (`material-icon-theme`, `simple-icons`, `vscode-icons`)
  - Tooling: `oxlint` ^1.71.0, `oxfmt` ^0.56.0, `turbo` ^2.10.0, `@microsoft/api-extractor` ^7.58.9, `eslint-plugin-jsdoc` ^63.0.10, `eslint-plugin-security` ^4.0.1, `@types/node` ^26.0.1
  - E2E: `@playwright/test` ^1.61.1, `@argos-ci/playwright` ^7.1.1
  - Benchmarks: `@codspeed/vitest-plugin` ^5.7.1

  `mermaid` stays pinned at ^10.9.6 — v11 uses langium for parsing and breaks Rspress's webpack compilation of global components.

## 1.0.0-rc.2

### Patch Changes

- e4d81aa: Test/exercise the CI release pipeline.

  No code changes — this changeset only exists to force the changesets bot to open a release PR, validate that the GitHub Actions workflow can publish via npm trusted publishing (no `NPM_TOKEN`, OIDC-only with `id-token: write` + `NPM_CONFIG_PROVENANCE: true`), and confirm provenance attestations land on the resulting `1.0.0-rc.2` releases. Following the local bootstrap publish of `1.0.0-rc.1`, this is the first CI-driven cut.

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

## 0.3.2

### Patch Changes

- b912b2d: Update and add READMEs

## 0.3.1

### Patch Changes

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

## 0.3.0

### Minor Changes

- c57ab70: Add per-theme `modes` support to declare supported color modes (dark, light, or both) and hide the appearance toggle for single-mode themes like arcade and midnight

### Patch Changes

- 1b3b8e3: Add vitest test infrastructure and 122 unit tests across all packages

## 0.2.1

### Patch Changes

- 6df5ab7: fix(packages/core): map nav items with `text` instead of `title` for Rspress compatibility
  fix(packages/ui): inject critical CSS via Rsbuild `html.tags` so loading screen works in dev mode
  fix(packages/ui): re-enable `data-cp-ready` dismiss flag in ThemeProvider
  fix(packages/ui): replace pong/invaders loaders with simple dots loader
  fix(packages/theme): remove `arcade-fx` as standalone theme (effects already apply with arcade)

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
