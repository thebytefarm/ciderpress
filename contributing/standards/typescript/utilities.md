# Utilities (`massaman/*`)

## Overview

Check [es-toolkit](https://es-toolkit.sh) before writing any utility function. It likely already exists with better edge-case handling, tree-shaking, and type safety. In this project, import es-toolkit through `massaman/*` subpaths — `massaman` is the umbrella package the codebase uses for both `es-toolkit` and `ts-pattern`. Subpath mapping:

| Concern         | Import path           |
| --------------- | --------------------- |
| Predicates      | `massaman/predicate`  |
| Object utils    | `massaman/object`     |
| Array utils     | `massaman/array`      |
| String utils    | `massaman/string`     |
| Math utils      | `massaman/math`       |
| Function utils  | `massaman/function`   |
| Pattern match   | `massaman/match`      |
| Control flow    | `massaman/control`    |
| Type conversion | `massaman/conversion` |

These rules cover which utilities to reach for and when to write your own instead. Examples below use the project import form.

## Rules

### Use Type Guards for Runtime Checks

Functions for runtime type checking. Prefer these over manual `typeof` chains.

| Function        | Description             | Example                |
| --------------- | ----------------------- | ---------------------- |
| `isNil`         | Check null or undefined | `isNil(value)`         |
| `isNull`        | Check null only         | `isNull(value)`        |
| `isUndefined`   | Check undefined only    | `isUndefined(value)`   |
| `isString`      | Check string            | `isString(value)`      |
| `isNumber`      | Check number (not NaN)  | `isNumber(value)`      |
| `isBoolean`     | Check boolean           | `isBoolean(value)`     |
| `isPlainObject` | Check plain object      | `isPlainObject(value)` |
| `isArray`       | Check array             | `isArray(value)`       |
| `isFunction`    | Check function          | `isFunction(value)`    |

#### Correct

```ts
import { isNotNil, isPlainObject, isString } from 'massaman/predicate'

// Filter out nil values
if (isNotNil(value)) {
  // value is not null or undefined
}

// Validate payload structure
if (isPlainObject(payload) && isString(payload.action)) {
  // payload is a plain object with string action
}
```

### Use Object Utilities for Immutable Transforms

Functions for picking, omitting, and transforming object properties without mutation.

| Function    | Description          | Example                 |
| ----------- | -------------------- | ----------------------- |
| `pick`      | Select properties    | `pick(obj, ['a', 'b'])` |
| `omit`      | Exclude properties   | `omit(obj, ['secret'])` |
| `omitBy`    | Exclude by predicate | `omitBy(obj, isNil)`    |
| `pickBy`    | Select by predicate  | `pickBy(obj, isString)` |
| `mapValues` | Transform values     | `mapValues(obj, fn)`    |
| `mapKeys`   | Transform keys       | `mapKeys(obj, fn)`      |
| `merge`     | Deep merge objects   | `merge(target, source)` |
| `clone`     | Shallow clone        | `clone(obj)`            |
| `cloneDeep` | Deep clone           | `cloneDeep(obj)`        |

#### Correct

```ts
import { omitBy, pick, omit } from 'massaman/object'
import { isNil } from 'massaman/predicate'

// Select specific fields for display
const summary = pick(config, ['name', 'root', 'scripts'])

// Remove internal fields before serializing
const safeConfig = omit(config, ['_resolved', '_path'])

// Remove nil values before writing config
const cleanConfig = omitBy(rawConfig, isNil)
```

### Use Collection Utilities for Arrays

Functions for grouping, deduplicating, and batching arrays.

| Function       | Description               | Example                         |
| -------------- | ------------------------- | ------------------------------- |
| `groupBy`      | Group by key/function     | `groupBy(scripts, 'workspace')` |
| `keyBy`        | Create lookup by key      | `keyBy(scripts, 'name')`        |
| `chunk`        | Split into chunks         | `chunk(items, 10)`              |
| `uniq`         | Remove duplicates         | `uniq(array)`                   |
| `uniqBy`       | Remove duplicates by key  | `uniqBy(scripts, 'name')`       |
| `difference`   | Items in first not second | `difference(a, b)`              |
| `intersection` | Items in both             | `intersection(a, b)`            |
| `compact`      | Remove falsy values       | `compact(array)`                |
| `flatten`      | Flatten one level         | `flatten(nested)`               |
| `flattenDeep`  | Flatten all levels        | `flattenDeep(nested)`           |

#### Correct

```ts
import { chunk, groupBy, keyBy, uniqBy } from 'massaman/array'

// Group scripts by workspace
const scriptsByWorkspace = groupBy(scripts, 'workspace')
// { root: [...], packages/lib: [...] }

// Create name lookup
const scriptsByName = keyBy(scripts, 'name')
// { build: script1, lint: script2 }

// Process workspaces in batches
const batches = chunk(workspaces, 10)
await batches.reduce((chain, batch) => chain.then(() => processBatch(batch)), Promise.resolve())

// Remove duplicate script names
const uniqueScripts = uniqBy(scripts, 'name')
```

### Use Function Utilities for Scheduling and Caching

Functions for controlling execution timing and caching results.

| Function   | Description          | Example              |
| ---------- | -------------------- | -------------------- |
| `debounce` | Delay until pause    | `debounce(fn, 300)`  |
| `throttle` | Limit call frequency | `throttle(fn, 1000)` |
| `memoize`  | Cache results        | `memoize(fn)`        |
| `once`     | Call only once       | `once(fn)`           |
| `noop`     | No-op function       | `noop`               |
| `identity` | Return input         | `identity`           |

#### Correct

```ts
import { debounce, memoize, throttle } from 'massaman/function'

// Debounce file watcher callback to avoid redundant rebuilds
const onFileChange = debounce((path: string) => {
  rebuildWorkspace(path)
}, 300)

// Throttle log output to at most once per second
const logProgress = throttle((message: string) => {
  process.stdout.write(`\r${message}`)
}, 1000)

// Cache expensive config resolution
const resolveConfig = memoize((root: string) => {
  return loadAndMergeConfig(root)
})
```

### Use String Utilities for Case Conversion

Functions for converting between naming conventions.

| Function     | Description            | Example                |
| ------------ | ---------------------- | ---------------------- |
| `camelCase`  | Convert to camelCase   | `camelCase('foo-bar')` |
| `kebabCase`  | Convert to kebab-case  | `kebabCase('fooBar')`  |
| `snakeCase`  | Convert to snake_case  | `snakeCase('fooBar')`  |
| `capitalize` | Uppercase first letter | `capitalize('hello')`  |
| `trim`       | Remove whitespace      | `trim(' hello ')`      |

#### Correct

```ts
import { camelCase, kebabCase } from 'massaman/string'

// Convert config keys from snake_case
const configKey = 'script_timeout'
const jsKey = camelCase(configKey) // 'scriptTimeout'

// Convert to kebab-case for file names
const moduleName = 'ConfigLoader'
const fileName = kebabCase(moduleName) // 'config-loader'
```

### Avoid `massaman/predicate` for Trivial Operations

For standalone null checks, prefer inline comparison over importing `isNil`. Reserve predicate helpers for composed or higher-order contexts where they add clarity, such as callbacks to `omitBy`, `filter`, or other higher-order functions.

#### Correct

```ts
// Standalone null check - inline is clearer
if (x != null) {
  // ...
}

// Predicate context - isNil is idiomatic here
const cleanConfig = omitBy(rawConfig, isNil)
const validItems = items.filter((item) => !isNil(item.value))

// Complex grouping - use the utility
const grouped = groupBy(scripts, 'workspace')
const batches = chunk(workspaces, 100)
```

#### Incorrect

```ts
import { isNil } from 'massaman/predicate'

// For standalone null checks, prefer inline comparison
if (!isNil(x)) {
  // ...
}
```

## Resources

- [es-toolkit Documentation](https://es-toolkit.sh)
- [es-toolkit GitHub](https://github.com/toss/es-toolkit)

## References

- [Functions](./functions.md) -- Pure function patterns
