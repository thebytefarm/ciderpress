# Coding Style

High-level constraints that govern all TypeScript in the monorepo. Enforced by OXLint and OXFmt.

## Import paths: `massaman` umbrella

The project imports `match`, `P`, `isPlainObject`, `debounce`, etc. through `massaman/*` subpaths — never directly from `ts-pattern` or `es-toolkit`. `massaman` re-exports both libraries under predictable subpaths:

| Concern          | Import                                                    |
| ---------------- | --------------------------------------------------------- |
| Pattern matching | `import { match, P } from 'massaman/match'`               |
| Predicates       | `import { isString, isNotNil } from 'massaman/predicate'` |
| Conversion       | `import { toError } from 'massaman/conversion'`           |
| Function helpers | `import { debounce, throttle } from 'massaman/function'`  |

Standards examples in this repo show the project import form. Upstream package names (`ts-pattern`, `es-toolkit`) appear only for discoverability.

## Rules

### No `let` — Use `const` Only

All bindings must be `const`. No reassignment, no mutation. Mutable state inside closures (factory internals) is the one accepted exception.

#### Correct

```ts
const timeout = 5000
const scripts = config.scripts.filter(isEnabled)
```

#### Incorrect

```ts
let timeout = 5000
timeout = 10000

let scripts: Script[] = []
scripts.push(newScript)
```

### No Loops

Use `map`, `filter`, `reduce`, `flatMap`, and `massaman/*` utilities instead of `for`, `while`, `do...while`, `for...in`, or `for...of`.

#### Correct

```ts
const names = scripts.map((s) => s.name)
const enabled = scripts.filter((s) => s.enabled)
const total = items.reduce((sum, item) => sum + item.count, 0)
```

#### Incorrect

```ts
const names: string[] = []
for (const script of scripts) {
  names.push(script.name)
}
```

### No Classes

Use plain objects, closures, and factory functions. Classes are permitted only when wrapping an external SDK that requires instantiation.

| Anti-pattern              | Use Instead                |
| ------------------------- | -------------------------- |
| Utility classes           | Module with functions      |
| Static method collections | Module with functions      |
| Data containers           | Plain objects / interfaces |
| Singletons                | Module-level constants     |

#### Correct

```ts
export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
```

#### Incorrect

```ts
class StringUtils {
  static capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1)
  }
}
```

### No `this`

Never reference `this`. Factory closures and plain functions eliminate the need.

### No `throw`

Return errors as values using the `Result` tuple type. No `throw` statements or throw expressions.

#### Correct

```ts
function parseConfig(raw: string): Result<Config, ParseError> {
  if (!raw) {
    return [{ type: 'parse_error', message: 'Empty input' }, null]
  }
  return [null, JSON.parse(raw)]
}
```

#### Incorrect

```ts
function parseConfig(raw: string): Config {
  if (!raw) {
    throw new Error('Empty input')
  }
  return JSON.parse(raw)
}
```

### Immutable Data

Do not mutate objects or arrays after creation. Return new values from every transformation.

#### Correct

```ts
function addScript(scripts: readonly Script[], script: Script): readonly Script[] {
  return [...scripts, script]
}
```

#### Incorrect

```ts
function addScript(scripts: Script[], script: Script) {
  scripts.push(script)
}
```

### No Ternaries

Use `if`/`else` or `match` expressions. Ternaries are banned by the linter.

#### Correct

```ts
if (isVerbose) {
  log.info(details)
} else {
  log.info(summary)
}
```

#### Incorrect

```ts
const message = isVerbose ? details : summary
```

### No Optional Chaining

Use explicit `if`/`else` or pattern matching instead of `?.`.

#### Correct

```ts
if (config.scripts) {
  config.scripts.map(run)
}
```

#### Incorrect

```ts
config.scripts?.map(run)
```

### No `any`

Use `unknown`, generics, or proper types. Narrow with type guards when needed.

#### Correct

```ts
function parse(data: unknown): Result<Config, ParseError> {
  if (!isPlainObject(data)) {
    return [{ type: 'parse_error', message: 'Expected object' }, null]
  }
  return [null, validateConfig(data)]
}
```

#### Incorrect

```ts
function parse(data: any): Config {
  return data
}
```

### Prefer Point-Free Style

When passing a named function to a higher-order function, pass it directly instead of wrapping in an arrow.

#### Correct

```ts
const valid = scripts.filter(isEnabled)
const names = items.map(getName)
```

#### Incorrect

```ts
const valid = scripts.filter((s) => isEnabled(s))
const names = items.map((item) => getName(item))
```

### ESM Only

Use ES module syntax with `verbatimModuleSyntax`. Use `import type` for type-only imports. Prefer the `node:` protocol for Node.js builtins.

#### Correct

```ts
import type { Config } from './types'
import { readFile } from 'node:fs/promises'
import { loadConfig } from './lib/config'
```

#### Incorrect

```ts
const fs = require('fs')
import { Config } from './types' // should use import type
import { readFile } from 'fs' // should use node: protocol
```

### No IIFEs

Do not use immediately invoked function expressions. Extract the logic into a named function and call it explicitly. This applies to both sync and async IIFEs.

#### Correct

```ts
/**
 * @private
 */
async function execute(options: Options): Promise<void> {
  // ...
}

function start(options: Options): void {
  void execute(options)
}
```

#### Incorrect

```ts
function start(options: Options): void {
  void (async () => {
    // ...
  })()
}
```

### Import Ordering

Organize imports into three groups separated by blank lines, sorted alphabetically within each group. Use top-level `import type` statements — do not use inline type specifiers.

1. **Node builtins** — `node:` protocol imports
2. **External packages** — third-party dependencies
3. **Internal imports** — project-relative paths, ordered farthest-to-closest (`../` before `./`), then alphabetically within the same depth

#### Correct

```ts
import { readdir } from 'node:fs/promises'
import { basename, resolve } from 'node:path'

import { match } from 'massaman/match'
import { isPlainObject } from 'massaman/predicate'

import type { Command } from '../types.js'
import { createLogger } from '../lib/logger.js'
import { registerCommandArgs } from './args.js'
import type { ResolvedRef } from './register.js'
```

#### Incorrect

```ts
import { match } from 'massaman/match'
import { readdir } from 'node:fs/promises' // node: should be first
import { registerCommandArgs } from './args.js'
import type { Command } from '../types.js' // ../ should come before ./
import { isPlainObject } from 'massaman/predicate'
import { createLogger, type Logger } from '../lib/logger.js' // no inline type specifiers
```

### File Structure

Organize each source file in this order:

1. **Imports** — ordered per import rules above
2. **Module-level constants** — `const` bindings used throughout the file
3. **Exported declarations** — the public API, each with full JSDoc
4. **Private helpers** — each with `@private` JSDoc tag; no divider comments between sections

The `export` keyword and JSDoc are the separators — never add banner or divider comments. Exported functions appear first so readers see the public API without scrolling. Function declarations are hoisted, so calling order does not matter.

#### Correct

```ts
import type { Config, ConfigError, ConfigResult } from '@ciderpress/config'

const DEFAULT_NAME = 'untitled'

/**
 * Load and validate a configuration file.
 *
 * @param path - Absolute path to the config file.
 * @returns A `ConfigResult` tuple — `[error, null]` on failure or `[null, config]` on success.
 */
export function loadConfig(path: string): ConfigResult<Config> {
  const [readError, raw] = readRawConfig(path)
  if (readError) return [readError, null]

  const [validateError, validated] = validateConfig(raw)
  if (validateError) return [validateError, null]

  return [null, validated]
}

/**
 * Read the raw config file from disk.
 *
 * @private
 * @param path - Absolute path to read.
 * @returns A `ConfigResult` tuple wrapping the raw config string.
 */
function readRawConfig(path: string): ConfigResult<string> {
  // ...
}

/**
 * Validate a raw config string against the schema.
 *
 * @private
 * @param raw - Unvalidated config string.
 * @returns A `ConfigResult` tuple wrapping the validated `Config`.
 */
function validateConfig(raw: string): ConfigResult<Config> {
  // ...
}
```

#### Incorrect

```ts
// Private helper defined before exports — reader must scroll to find the API
function readRawConfig(path: string): ConfigResult<string> {
  /* ... */
}
function validateConfig(raw: string): ConfigResult<Config> {
  /* ... */
}

export function loadConfig(path: string): ConfigResult<Config> {
  // ...
}
```

### Disabling Lint Rules

Use `// oxlint-disable-next-line <rule> -- <reason>` to opt a single line out of a rule. Always include the `-- <reason>` justification — bare disables are rejected on review.

Acceptable cases:

- Stateful factory internals where `ciderpress/no-let` blocks a closure-held mutable binding.
- Boundary code that must call into an external API with a banned shape (e.g., a `process.exit` wrapper, raw event emitters).
- Generated code where rewriting the rule violation isn't practical.

#### Correct

```ts
// oxlint-disable-next-line ciderpress/no-let -- mutable config reloaded on file changes
let config = initialConfig
```

#### Incorrect

```ts
// oxlint-disable-next-line ciderpress/no-let
let config = initialConfig
```

## References

- [Design Patterns](./design-patterns.md) -- Factories, pipelines, composition
- [Errors](./errors.md) -- Result type for error handling
- [State](./state.md) -- Immutable state management
- [Functions](./functions.md) -- Pure functions and composition
