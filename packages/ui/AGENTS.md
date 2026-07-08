# @ciderpress/ui — Agent Instructions

## Raw-Copied Components (Rspress Global Components)

Some files in this package are **not bundled by Rslib**. They are copied as raw
`.tsx` source into `dist/` and compiled at runtime by **Rspress's internal
webpack**. These files have different rules than the rest of the codebase.

### Which files?

Any file listed under `output.copy` in `rslib.config.ts` that is a `.tsx`
component. Currently:

- `src/plugins/mermaid/MermaidRenderer.tsx`

### Constraints

Because Rspress's webpack compiles these files independently, they can **only
import packages that Rspress's webpack can resolve**:

| Allowed              | Forbidden                                       |
| -------------------- | ----------------------------------------------- |
| `react`, `react-dom` | `ts-pattern`                                    |
| `mermaid`            | `es-toolkit`                                    |
| Relative CSS imports | Any `@ciderpress/*` workspace package           |
| Other Rspress deps   | Any dependency not in Rspress's resolve context |

### Style rules relaxed

The standard codebase rules (no ternaries, use `ts-pattern` `match()`, etc.) do
**not** apply inside these files. Use plain ternaries, `if`/`else`, and vanilla
JS — whatever works without extra dependencies.

### How to tell if a file is raw-copied

1. Check `rslib.config.ts` → `output.copy` for the file path
2. Look for the banner comment at the top of the file referencing this document
3. If the file exists in both `src/` and `dist/` as identical `.tsx`, it is
   raw-copied

### Mermaid version

**`mermaid` runs on v11.** The earlier "must stay on v10" constraint was based on
a misdiagnosis and no longer applies:

1. **Langium** — no longer relevant. As of 11.16 mermaid's parser uses chevrotain
   (`@mermaid-js/parser` → `@chevrotain/types`); langium is not in the tree.
2. **Lazy-loaded diagram types** — real, but harmless here. `mermaid.render()`
   resolves correctly with a valid SVG; it does not throw. The blank-diagram
   symptom that looked like a v11 bug was actually a React defect in
   `MermaidRenderer.tsx`: `config` defaulted to a fresh `{}` each render, so
   keying `renderMermaid` on it re-fired the render effect in a loop, and each
   `mermaid.render()` into the same element id clobbered the SVG just injected.
   Fixed by keying on a serialized config value and using a unique element id per
   render call. Verified with Playwright: diagrams paint on first load, no
   interaction, and survive theme toggles.

### Adding new raw-copied components

When adding a new global component for Rspress:

1. Add the copy rule to `rslib.config.ts` → `output.copy`
2. Add the banner comment to the top of the source file
3. Only import from packages available in Rspress's webpack context
4. Update the file list in this document
