<div align="center">
  <h1>@ciderpress/oxlint-plugins</h1>
  <p><strong>Repo-owned OXLint rules for Ciderpress.</strong></p>
  <p>Functional TypeScript constraints without ESLint compatibility dependencies.</p>

<a href="https://github.com/thebytefarm/ciderpress/actions/workflows/ci.yml"><img src="https://github.com/thebytefarm/ciderpress/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI" /></a>
<a href="https://github.com/thebytefarm/ciderpress/blob/main/LICENSE"><img src="https://img.shields.io/github/license/thebytefarm/ciderpress" alt="License" /></a>

</div>

## Features

- **OXLint-native runtime** — loads directly through OXLint's JavaScript plugin API.
- **No ESLint dependency chain** — no ESLint, `typescript-eslint`, or compatibility plugins.
- **Composable rules** — import the aggregate plugin or individual rule exports.
- **Prebuilt output** — Rslib bundles are committed so linting never compiles plugin source.

## Install

This is a private workspace package in the Ciderpress monorepo. Install the workspace from the
repository root:

```bash
pnpm install
```

## Usage

### Load the aggregate plugin

Point OXLint at the committed bundle:

```json
{
  "jsPlugins": ["./tools/oxlint-plugins/dist/index.mjs"],
  "rules": {
    "ciderpress/no-classes": "error",
    "ciderpress/no-let": "error"
  }
}
```

### Import individual rules

Each rule has a package subpath export for custom plugin composition:

```js
import noLet from '@ciderpress/oxlint-plugins/no-let'

export default {
  meta: { name: 'custom' },
  rules: { 'no-let': noLet },
}
```

## Rules

| Rule                                    | Enforces                                                   |
| --------------------------------------- | ---------------------------------------------------------- |
| `ciderpress/no-classes`                 | Factory functions and closures instead of classes          |
| `ciderpress/no-dynamic-filesystem-path` | Static or explicitly suppressed filesystem paths           |
| `ciderpress/no-dynamic-regexp`          | Static regular expressions instead of runtime construction |
| `ciderpress/no-let`                     | Immutable bindings with `const`                            |
| `ciderpress/no-loop-statements`         | Immutable collection operations instead of loops           |
| `ciderpress/no-this-expressions`        | Explicit dependencies and state instead of `this`          |
| `ciderpress/no-throw-statements`        | Result values instead of thrown errors                     |

## Development

Each rule lives in its own source module and bundle entry. The default export from `src/index.mjs`
combines them into the `ciderpress` plugin.

Rebuild every entry from the repository root:

```bash
pnpm bundle
```

Commit the resulting `tools/oxlint-plugins/dist/` changes with the source changes. CI and local
linting consume that committed output.

## License

[MIT](../../LICENSE)
