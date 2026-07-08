---
'ciderpress': patch
'@ciderpress/cli': patch
'@ciderpress/config': patch
'@ciderpress/ui': patch
'@ciderpress/theme': patch
'@ciderpress/templates': patch
---

Upgrade dependencies to latest across the workspace, and fix Mermaid rendering on Mermaid v11.

- Catalog: `@rspress/core` ^2.0.16, `@typescript/native-preview` 7.0.0-dev.20260707.2, `type-fest` ^5.8.0, `vitest` ^4.1.10
- UI: `mermaid` ^11.16.0 (was v10), iconify icon sets
- CLI: `@clack/prompts` ^1.7.0
- Config: `tsx` ^4.23.0, `@types/node` ^26.1.0
- Tooling: `oxlint` ^1.73.0, `oxfmt` ^0.58.0, `turbo` ^2.10.4

`@rslib/core` is held at `0.23.1`: 0.23.2 regressed the ESM build (emitted `.js` instead of `.mjs` and dropped the bundled type declarations).

Mermaid is now on **v11** — the previous v10 pin was based on a misdiagnosis. `mermaid.render()` resolves correctly on v11; the blank-diagram symptom was a defect in `MermaidRenderer.tsx`: `config` defaulted to a fresh `{}` each render, re-firing the render effect in a loop that repeatedly rendered into the same element id and clobbered the injected SVG. Fixed by keying the render callback on a serialized config value and using a unique element id per render call. Diagrams now paint on first load without interaction and survive theme toggles.
