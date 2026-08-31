---
'ciderpress': major
'@ciderpress/cli': major
'@ciderpress/config': major
'@ciderpress/ui': major
'@ciderpress/theme': major
'@ciderpress/templates': major
---

ciderpress 1.0 — release candidate

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
