# Documentation Formatting Standards

## Overview

Standards for code examples, tables, code blocks, and markdown formatting. Consistent formatting makes documentation scannable and reduces cognitive load. These rules apply to all markdown files in the repository.

## Rules

### Keep Code Examples Minimal

Show only the critical parts. Omit imports, boilerplate, and obvious code.

#### Correct

This example is focused on the API.

```ts
const config = await loadConfig('/project')
const entries = resolveEntries(config)
```

#### Incorrect

This example is too noisy and the reader is distracted by the boilerplate and obvious code.

```ts
import { loadConfig } from '@ciderpress/config'
import { resolveEntries } from '@ciderpress/cli/lib/sync/resolve'
import { createPaths } from '@ciderpress/cli/lib/paths'
import { log } from '@clack/prompts'

async function main() {
  const config = await loadConfig('/project')
  const entries = resolveEntries(config)
  const paths = createPaths(process.cwd())

  for (const entry of entries) {
    const result = await syncEntry(entry, paths)
    log.info(`Synced: ${result.text}`)
  }
}

main()
```

### Use Full Examples for Copy-Paste Templates

When the reader should copy the entire block, show everything including imports and full structure.

#### Correct

```ts
// Full file template - reader copies this
import { defineConfig } from 'ciderpress/config'

export default defineConfig({
  title: 'My Project',
  tagline: 'Documentation for my project',
  sections: [
    { text: 'Getting Started', link: '/getting-started', from: 'docs/getting-started.md' },
    { text: 'Guides', prefix: '/guides', from: 'docs/guides/*.md' },
  ],
})
```

### Follow Code Example Rules

- No inline comments unless explaining non-obvious logic
- No `// ...` or placeholder code
- Use real values, not `foo`/`bar`/`example`
- Show imports only when they are the point of the example

### Use Tables for Structured Information

Use tables when presenting structured data with consistent columns.

#### Correct

| Item   | Description |
| ------ | ----------- |
| First  | Description |
| Second | Description |

### Specify Language in Code Blocks

Always specify the language for syntax highlighting.

#### Correct

```ts
const example = 'typescript'
```

```bash
pnpm build
```

#### Incorrect

```
const example = 'no highlighting'
```

### Use Correct Link Styles

- Use relative links for internal docs: `[Auth](../authentication.md)`
- Use full URLs for external docs: `[Zod](https://zod.dev)`

## References

- [Writing Standards](./writing.md)
- [Diagram Standards](./diagrams.md)
