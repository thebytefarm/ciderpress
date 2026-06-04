---
paths:
  - 'packages/**/*.{ts,tsx}'
---

# TypeScript Rules

These rules are enforced by OXLint (`.oxlintrc.json`) and must be followed in all code under `packages/`:

## Functional programming

- **No `let`** — use `const` only. No reassignment, no mutation.
- **No loops** (`for`, `while`, `do...while`, `for...in`, `for...of`) — use `map`, `filter`, `reduce`, `flatMap`, etc. Prefer `es-toolkit` utilities.
- **No classes** — use plain objects, closures, and factory functions.
- **No `this`** — never reference `this`.
- **No `throw`** — no throw statements or throw expressions. Return errors as values.
- **No expression statements** — every expression must be used (assigned, returned, or passed). Config files (`.config.ts`) are exempt.
- **Immutable data** — no mutating objects or arrays after creation. Config files are exempt.
- **Prefer tacit (point-free)** — e.g. `arr.filter(isEven)` not `arr.filter((x) => isEven(x))`.
- **Functional parameters** — functions must declare explicit parameters (no `arguments`, no rest-only patterns).

## TypeScript strictness

- **No `any`** — use `unknown`, generics, or proper types.
- **No non-null assertions** (`!`) — use explicit null checks.
- **No optional chaining** (`?.`) — use explicit `if`/`else` or pattern matching.
- **No ternaries** — use `if`/`else` or `match` expressions.
- **ESM only** with `verbatimModuleSyntax` — use `import type` for type-only imports.

## General

- **No `eval`**, `new Function()`, or implied eval.
- **No `var`** — use `const`.
- **No param reassignment** — parameters are immutable.
- **No bitwise operators**, `++`/`--`, `void`, `with`, `continue`, or multi-assign.
- **No circular imports**, self-imports, or duplicate imports.
- **Prefer `node:` protocol** for Node.js builtins (e.g. `import fs from 'node:fs'`).
- **Use `es-toolkit`** over hand-rolling utility functions.

## File Structure

Organize each source file in this order:

1. **Imports** — node builtins > external packages > internal (farthest-to-closest)
2. **Module-level constants** — `const` bindings used throughout the file
3. **Exported declarations** (functions, constants, types, interfaces, components) — the public API, each with full JSDoc
4. **Private helpers** — non-exported functions, each with JSDoc including `@private`

- Every exported function must have full JSDoc (description, `@param`, `@returns`)
- Every private helper must have JSDoc with `@private` tag
- Exported functions appear first so readers see the public API without scrolling
- No banner or divider comments between sections — the `export` keyword and JSDoc are the separators

## Formatting (OXFmt)

- 100-char line width, 2-space indent, no semicolons, single quotes, trailing commas
- Import sorting: builtin > external > internal > parent/sibling/index
