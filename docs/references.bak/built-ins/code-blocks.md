---
title: Code Blocks
description: Syntax highlighting, line numbers, diffs, and other code block features.
---

# Code Blocks

ciderpress uses Rspress's built-in Shiki integration for compile-time syntax highlighting. All features below work in any `.md` or `.mdx` file with zero configuration.

## Syntax highlighting

Specify a language after the opening fence:

**Code**

````md
```ts
const greeting: string = 'hello'
```
````

**Output**

```ts
const greeting: string = 'hello'
```

## Title

Add a filename or label to any code block:

**Code**

````md
```ts title="src/utils.ts"
export const add = (a: number, b: number): number => a + b
```
````

**Output**

```ts title="src/utils.ts"
export const add = (a: number, b: number): number => a + b
```

## Line numbers

Toggle per-block with the `lineNumbers` meta attribute:

**Code**

````md
```ts lineNumbers
const config = {
  title: 'My Docs',
  description: 'A documentation site',
  theme: { colorMode: 'dark' },
}
```
````

**Output**

```ts lineNumbers
const config = {
  title: 'My Docs',
  description: 'A documentation site',
  theme: { colorMode: 'dark' },
}
```

Disable with `lineNumbers=false` if globally enabled.

## Line highlighting

Highlight specific lines using curly-brace ranges in the meta:

**Code**

````md
```ts {2,4-5}
import { defineConfig } from 'ciderpress'

export default defineConfig({
  title: 'My Docs',
  description: 'Highlighted lines',
  theme: { colorMode: 'dark' },
})
```
````

**Output**

```ts {2,4-5}
import { defineConfig } from 'ciderpress'

export default defineConfig({
  title: 'My Docs',
  description: 'Highlighted lines',
  theme: { colorMode: 'dark' },
})
```

Or use inline notation comments:

**Code**

````md
```ts
import { defineConfig } from 'ciderpress' // [!code highlight]

export default defineConfig({
  title: 'My Docs', // [!code highlight]
})
```
````

**Output**

```ts
import { defineConfig } from 'ciderpress' // [!code highlight]

export default defineConfig({
  title: 'My Docs', // [!code highlight]
})
```

## Diff highlighting

Mark added and removed lines with inline notation:

**Code**

````md
```ts
export default defineConfig({
  title: 'My Docs',
  description: 'Old description', // [!code --]
  description: 'New description', // [!code ++]
})
```
````

**Output**

```ts
export default defineConfig({
  title: 'My Docs',
  description: 'Old description', // [!code --]
  description: 'New description', // [!code ++]
})
```

Or use the `diff` language for classic `+`/`-` prefix syntax:

```diff
- description: 'Old description',
+ description: 'New description',
```

## Error and warning lines

**Code**

````md
```ts
const port = process.env.PORT // [!code warning]
const secret = 'hardcoded' // [!code error]
```
````

**Output**

```ts
const port = process.env.PORT // [!code warning]
const secret = 'hardcoded' // [!code error]
```

## Focus

Dim everything except the focused lines:

**Code**

````md
```ts
import { defineConfig } from 'ciderpress'

export default defineConfig({
  title: 'My Docs', // [!code focus]
  description: 'Only this line is focused', // [!code focus]
  theme: { colorMode: 'dark' },
})
```
````

**Output**

```ts
import { defineConfig } from 'ciderpress'

export default defineConfig({
  title: 'My Docs', // [!code focus]
  description: 'Only this line is focused', // [!code focus]
  theme: { colorMode: 'dark' },
})
```

## Code wrapping

Wrap long lines instead of horizontal scrolling:

**Code**

````md
```ts wrapCode
const message =
  'This is a very long string that would normally cause horizontal scrolling but instead wraps to the next line because wrapCode is enabled on this code block'
```
````

**Output**

```ts wrapCode
const message =
  'This is a very long string that would normally cause horizontal scrolling but instead wraps to the next line because wrapCode is enabled on this code block'
```

## File embedding

Pull content from a file at build time:

````md
```tsx file="./relative-file.tsx"

```
````

Use `<root>` to reference the project root:

````md
```tsx file="<root>/src/components/Button.tsx"

```
````

## Combining options

All meta attributes can be combined:

**Code**

````md
```ts lineNumbers title="ciderpress.config.ts" {3-4}
import { defineConfig } from 'ciderpress'

export default defineConfig({
  title: 'My Docs',
  description: 'Combined: title, line numbers, and highlighting',
})
```
````

**Output**

```ts lineNumbers title="ciderpress.config.ts" {3-4}
import { defineConfig } from 'ciderpress'

export default defineConfig({
  title: 'My Docs',
  description: 'Combined: title, line numbers, and highlighting',
})
```

## Tabs

Wrap code blocks in switchable tabs using Rspress's built-in components. Requires an `.mdx` file:

````mdx
import { Tab, Tabs } from 'rspress/theme'

<Tabs>
<Tab label="ESM">

```ts title="index.mjs"
import { foo } from './foo.js'
```

</Tab>
<Tab label="CJS">

```ts title="index.cjs"
const { foo } = require('./foo')
```

</Tab>
</Tabs>
````

| Prop           | Component | Description                                           |
| -------------- | --------- | ----------------------------------------------------- |
| `groupId`      | `Tabs`    | Sync selection across multiple tab groups on the page |
| `defaultValue` | `Tabs`    | Pre-select a tab by its `value`                       |
| `tabPosition`  | `Tabs`    | `'left'` or `'center'`                                |
| `label`        | `Tab`     | Display text (required)                               |
| `value`        | `Tab`     | Identifier for `defaultValue` matching                |

## Package manager tabs

Auto-generate install commands for npm, yarn, pnpm, bun, and deno. Requires an `.mdx` file:

```mdx
import { PackageManagerTabs } from 'rspress/theme'

<PackageManagerTabs command="install ciderpress" />
```

Or provide custom per-manager commands:

```mdx
<PackageManagerTabs
  command={{
    npm: 'npm create rspress@latest',
    yarn: 'yarn create rspress',
    pnpm: 'pnpm create rspress@latest',
    bun: 'bun create rspress@latest',
  }}
/>
```

## TypeScript twoslash

Render inline type tooltips and compiler diagnostics directly in code blocks. The `twoslash` meta attribute activates the [TypeScript Twoslash](https://www.typescriptlang.org/dev/twoslash/) integration, which runs the TypeScript compiler over your code and injects the results as annotations. This works out of the box with no additional configuration.

````md
```ts twoslash
const str = 'hello'
//    ^?
```
````

The `^?` comment triggers a type query, rendering the inferred type (`const str: "hello"`) as an inline tooltip below the variable.
