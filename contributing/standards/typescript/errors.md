# Error Handling

The project uses two different `Result` shapes — know which one you are touching.

| Shape                 | Source                                                | Form                                                      |
| --------------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| Project-native        | `@ciderpress/config` (`packages/config/src/types.ts`) | Tuple: `readonly [E, null] \| readonly [null, T]`         |
| `attemptAsync` helper | `massaman/control`                                    | Object: `Ok<T> \| Err` with `ok`, `value`, `error` fields |

Public-facing functions return the tuple form. The object form only appears at the boundary where `massaman`'s `attemptAsync` is called.

## Rules

### Use the Result Type

Define success and failure as a tuple where the first element is the error (or `null`) and the second is the value (or `null`). Destructure the tuple to check which case occurred.

```ts
type Result<T, E = Error> = readonly [E, null] | readonly [null, T]
```

Construct success and failure tuples directly:

```ts
// Success
const success: Result<Config, ParseError> = [null, config]

// Failure
const failure: Result<Config, ParseError> = [
  { _tag: 'ParseError', type: 'parse_error', message: 'Invalid JSON' },
  null,
]
```

### Return Results for Expected Failures

Use `Result<T, E>` for operations that can fail in expected ways such as parsing, validation, file I/O, and external calls. Define a specific error interface for each domain.

#### Correct

```ts
import type { Result } from '@ciderpress/config'

interface ParseError {
  readonly _tag: 'ParseError'
  readonly type: 'parse_error' | 'validation_error'
  readonly message: string
}

function parseConfig(json: string): Result<Config, ParseError> {
  try {
    const data = JSON.parse(json)
    return [null, data]
  } catch {
    return [{ _tag: 'ParseError', type: 'parse_error', message: 'Invalid JSON' }, null]
  }
}

// Usage — destructure the tuple
const [parseError, config] = parseConfig(input)

if (parseError) {
  logger.error({ error: parseError }, 'Failed to parse config')
  return
}

// config is typed as Config
processConfig(config)
```

#### Incorrect

```ts
// Throwing instead of returning a Result
function parseConfig(json: string): Config {
  if (!json) {
    throw new Error('Empty input') // Don't throw
  }
  return JSON.parse(json)
}
```

### Wrap Async Operations with `attemptAsync`

Import `attemptAsync` from `massaman/control` to convert promise rejections into a `Result`. Note: the helper returns an `Ok<T> | Err` **object** (with `ok`, `value`, `error` fields), not the project-native tuple.

```ts
// massaman/control
interface Ok<T> {
  readonly ok: true
  readonly value: T
  readonly error: null
}
interface Err {
  readonly ok: false
  readonly value: null
  readonly error: Error
}
type Result<T> = Ok<T> | Err
```

When bridging between massaman's object Result and the project's tuple Result, destructure with `.ok`, `.value`, `.error` from massaman, then return `[null, value]` or `[error, null]` from your function.

#### Correct

```ts
import { attemptAsync } from 'massaman/control'
import type { Result } from '@ciderpress/config'

async function readContents(path: string): Promise<Result<string, ReadError>> {
  const readResult = await attemptAsync(() => readFile(path, 'utf8'))

  if (!readResult.ok) {
    return [{ _tag: 'ReadError', message: readResult.error.message }, null]
  }

  return [null, readResult.value]
}
```

### Define Domain-Specific Results

Create type aliases for consistency within a domain. This keeps function signatures short and error types discoverable.

#### Correct

```ts
// types.ts
interface ConfigError {
  readonly _tag: 'ConfigError'
  readonly type: 'invalid_toml' | 'missing_field' | 'unknown_workspace'
  readonly message: string
  readonly details?: unknown
}

export type ConfigResult<T> = Result<T, ConfigError>

// implementation
function loadConfig(path: string): ConfigResult<CiderpressConfig> {
  // returns [ConfigError, null] on failure or [null, CiderpressConfig] on success
}
```

### Chain Results with Early Returns

Use early returns to chain multiple Result-producing steps. Each step bails out on the first error.

#### Correct

```ts
async function runScript(name: string, workspace: string): Promise<Result<RunOutput, ScriptError>> {
  // Step 1: Load config
  const [configError, config] = loadConfig(workspace)
  if (configError) return [configError, null]

  // Step 2: Resolve script
  const [resolveError, script] = resolveScript(config, name)
  if (resolveError) return [resolveError, null]

  // Step 3: Execute
  const [execError, output] = await execute(script)
  if (execError) return [execError, null]

  return [null, output]
}
```

### Handle Multiple Error Types

Use destructuring and early returns to handle different error types. For exhaustive handling of multiple error variants, combine with `match` from `massaman/match`.

#### Correct

```ts
import { match } from 'massaman/match'

const [error, config] = loadConfig(path)

if (error) {
  match(error.type)
    .with('invalid_toml', () => {
      logger.warn('Invalid TOML in config file')
    })
    .with('missing_field', () => {
      logger.warn('Missing required field')
    })
    .with('unknown_workspace', () => {
      logger.warn('Unknown workspace')
    })
    .exhaustive()
  return
}

applyConfig(config)
```

### Never Throw in Result-Returning Functions

A function that declares `Result` as its return type must never throw. All failure paths must return an error tuple.

#### Correct

```ts
function parse(json: string): Result<Data, ParseError> {
  if (!json) {
    return [{ type: 'parse_error', message: 'Empty input' }, null]
  }

  try {
    return [null, JSON.parse(json)]
  } catch {
    return [{ type: 'parse_error', message: 'Invalid JSON' }, null]
  }
}
```

#### Incorrect

```ts
function parse(json: string): Result<Data, ParseError> {
  if (!json) {
    throw new Error('Empty input') // Don't throw!
  }
  return [null, JSON.parse(json)]
}
```

### Always Check Results Before Accessing Values

Never access the value element without first confirming the error element is `null`. Destructure the tuple and check the error before using the value.

#### Correct

```ts
const [error, config] = parseConfig(input)
if (!error) {
  processConfig(config)
}
```

#### Incorrect

```ts
const [, config] = parseConfig(input)
processConfig(config) // config might be null — error was not checked
```

## References

- [Types](./types.md) -- Discriminated union patterns
- [Conditionals](./conditionals.md) -- `massaman/match` for error handling
