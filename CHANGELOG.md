<!-- @auto-generated — do not edit. Regenerate with: pnpm changelog:generate -->

# Changelog

All notable changes to ciderpress packages, aggregated by release version.

## 1.0.0-rc.3

### Minor Changes

`@ciderpress/cli` `@ciderpress/config` `@ciderpress/ui` `ciderpress`

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

`@ciderpress/cli` `@ciderpress/config` `@ciderpress/templates` `@ciderpress/theme` `@ciderpress/ui` `ciderpress`

- e4d81aa: Test/exercise the CI release pipeline.

  No code changes — this changeset only exists to force the changesets bot to open a release PR, validate that the GitHub Actions workflow can publish via npm trusted publishing (no `NPM_TOKEN`, OIDC-only with `id-token: write` + `NPM_CONFIG_PROVENANCE: true`), and confirm provenance attestations land on the resulting `1.0.0-rc.2` releases. Following the local bootstrap publish of `1.0.0-rc.1`, this is the first CI-driven cut.

## 1.0.0-rc.1

### Major Changes

`@ciderpress/cli` `@ciderpress/config` `@ciderpress/templates` `@ciderpress/theme` `@ciderpress/ui` `ciderpress`

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

`@ciderpress/cli` `@ciderpress/config` `@ciderpress/templates` `@ciderpress/theme` `@ciderpress/ui` `ciderpress`

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

## 0.9.1

### Patch Changes

`@ciderpress/cli`

- 186ee92: Fix crash reporting for screen commands — errors in dev mode TUI now display in-app with crash log path and hotkeys to copy/quit

`@ciderpress/ui`

- f26cf74: fix: resolve SWC decorator panic by upgrading rsbuild to 2.0.0-rc.1

## 0.9.0

### Minor Changes

`@ciderpress/cli`

- d26e7f6: Add crash reporter and error boundary — every CLI crash now writes a structured JSON log to a temp file and prints a one-liner fatal message pointing to it

`@ciderpress/ui`

- 4c04f9d: Add MDX content components for doc-platform parity: Accordion, AccordionGroup, Columns, Column, StatusBadge, Frame, Tooltip, Prompt, and Color. Reorganize theme barrel with public API sections and @internal annotations on framework exports.

### Patch Changes

`@ciderpress/ui`

- c9a2cc8: perf: reduce @ciderpress/ui bundle from 15MB to 767KB by externalizing ts-morph

  fix: close Rspress dev server on quit (no more double ctrl+c / blank screen)
