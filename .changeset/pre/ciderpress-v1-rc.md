---
'ciderpress': major
'@ciderpress/cli': major
'@ciderpress/config': major
'@ciderpress/ui': major
'@ciderpress/theme': major
'@ciderpress/templates': major
---

Rename to `ciderpress`. The project moved to the `thebytefarm` org and the kit now lives at the unscoped `ciderpress` package name (replacing `@zpress/kit`).

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
