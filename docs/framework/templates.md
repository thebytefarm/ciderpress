---
title: Templates
description: Starter templates for each documentation type.
---

# Templates

Every doc type has a matching template bundled in the `@ciderpress/templates` package. Use the CLI to scaffold them or import the SDK directly into your own tooling.

## Scaffolding with the CLI

The fastest way to create a new doc is `ciderpress draft`:

```bash
# Interactive — prompts for type and title
ciderpress draft

# Specify type and title directly
ciderpress draft --type guide --title "Deploy to Vercel"

# Output to a specific directory
ciderpress draft --type guide --title "Deploy to Vercel" --out docs/guides

# Fill declared variables up front (repeatable)
ciderpress draft --type adr --title "Use Postgres" --var decision="Adopt Postgres"
```

This renders the template with your title (plus any variables) and writes it to the output directory. Variables you don't supply are left as raw `{{ }}` markers for you — or a coding agent — to fill in later, and `draft` prints a checklist of what remains.

## Custom templates

Point Ciderpress at one or more directories of your own templates via the `templates` field in `ciderpress.config.ts`:

```ts
export default defineConfig({
  // A single directory, or an array of directories
  templates: ['docs/.templates', 'shared/templates'],
})
```

Each template is a plain `.md` or `.mdx` file with `label` and `hint` frontmatter. The **filename is the type** (`adr.md` becomes type `adr`):

```md
---
label: ADR
hint: Architecture decision record
---

# {{title}}

## Context

## Decision

## Consequences
```

- **`.mdx` templates** scaffold to `.mdx` files, so JSX and components flow through the MDX pipeline.
- A custom template whose filename matches a built-in **overrides** it — a `guide.md` replaces the bundled Guide.
- Frontmatter is always stripped from the scaffolded output.

## Variables

A template body can contain `{{ marker }}` variables. Interior whitespace is ignored, so `{{title}}` and `{{ title }}` are equivalent.

**Built-in variables** are always substituted at draft time:

| Variable       | Value                                        |
| -------------- | -------------------------------------------- |
| `{{title}}`    | The `--title` you pass (or are prompted for) |
| `{{slug}}`     | Kebab-case slug of the title                 |
| `{{date}}`     | Today's date, `YYYY-MM-DD`                   |
| `{{filename}}` | The output filename (slug + extension)       |

**Declared variables** are the fillable blanks a template names under `vars`. Only `id` is required; `title` and `description` drive the interactive prompt:

```md
---
label: ADR
hint: Architecture decision record
vars:
  - id: decision
    title: Decision
    description: The change being proposed or made
  - id: consequences
---

# {{title}}

- **Date:** {{date}}

## Decision

{{ decision }}

## Consequences

{{ consequences }}
```

At draft time each declared variable is filled from a `--var id=value` argument, then — on an interactive terminal — prompted for. Anything left blank (or every declared variable when running non-interactively, e.g. from a coding agent) stays as a raw `{{ id }}` marker.

**Undeclared markers** pass through untouched as plain text — no error, no substitution. This lets you leave hand-authored blanks a template doesn't formally declare.

### The no-leftover-markers lint

`ciderpress check` and `ciderpress build` fail when a **published** doc still contains a `{{ }}` marker, so a half-filled draft can't ship. Markers inside fenced or inline code are ignored, so docs that _demonstrate_ the convention (like this one) don't trip it.

## Listing and validating

```bash
# List built-in and custom templates (overrides marked with *)
ciderpress templates list

# Validate template frontmatter and vars
ciderpress templates check
```

Template validation also runs as part of `ciderpress check` and `ciderpress build`, alongside the [no-leftover-markers lint](#the-no-leftover-markers-lint).

## Using the SDK

You can import `@ciderpress/templates` directly to integrate with your own CLI or tooling:

```ts
import { createRegistry, render, toSlug, defineTemplate } from '@ciderpress/templates'

// Use built-in templates
const registry = createRegistry()
const guide = registry.get('guide')
const content = render(guide, { title: 'Deploy to Vercel' })

// Add custom templates
const custom = registry.add(
  defineTemplate({
    type: 'adr',
    label: 'ADR',
    hint: 'Architecture decision record',
    body: '# {{title}}\n\n## Context\n\n## Decision\n\n## Consequences\n',
  })
)

// Extend a built-in template
const extended = registry.extend('guide', {
  body: (base) => base + '\n## Internal Notes\n',
})
```

`render` substitutes only the keys you pass and leaves the rest as raw markers. Use `findMarkers` to list what remains:

```ts
import { findMarkers, render } from '@ciderpress/templates'

const output = render(adr, { title: 'Use Postgres' })
findMarkers(output) // e.g. ['{{ decision }}', '{{ consequences }}']
```

## Available templates

| Template                            | Type              | Diataxis quadrant |
| ----------------------------------- | ----------------- | ----------------- |
| [Tutorial](#tutorial)               | `tutorial`        | Tutorial          |
| [Guide](#guide)                     | `guide`           | How-To            |
| [Quickstart](#quickstart)           | `quickstart`      | Tutorial          |
| [Explanation](#explanation)         | `explanation`     | Explanation       |
| [Reference](#reference)             | `reference`       | Reference         |
| [Standard](#standard)               | `standard`        | —                 |
| [Troubleshooting](#troubleshooting) | `troubleshooting` | —                 |
| [Runbook](#runbook)                 | `runbook`         | —                 |

These built-in templates use `{{title}}`; see [Variables](#variables) for the full substitution model.

## Tutorial

**Type:** `tutorial`

```markdown
# Build Your First {{title}}

## What You Will Learn

## What You Will Build

## Prerequisites

## Steps

### 1. First Step

### 2. Second Step

### 3. Third Step

## Summary

## Next Steps
```

## Guide

**Type:** `guide`

```markdown
# {{title}}

## Prerequisites

## Steps

### 1. First Step

### 2. Second Step

### 3. Third Step

## Verification

## Troubleshooting

## References
```

## Quickstart

**Type:** `quickstart`

```markdown
# Get Started with {{title}}

## What You Will Build

## Prerequisites

## Steps

### 1. First Step

### 2. Second Step

### 3. Third Step

## Result

## Next Steps
```

## Explanation

**Type:** `explanation`

```markdown
# {{title}}

## Overview

## Key Terms

## How It Works

## Design Decisions

## References
```

## Reference

**Type:** `reference`

```markdown
# {{title}}

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |

## Examples

## References
```

## Standard

**Type:** `standard`

```markdown
# {{title}}

## Overview

## Rules

### Rule Category

## Examples

### Good

### Bad

## Enforcement

## References
```

## Troubleshooting

**Type:** `troubleshooting`

```markdown
# {{title}} Troubleshooting

## Issue Name

**Symptom:** ...
**Fix:** ...

## Another Issue

**Symptom:** ...
**Cause:** ...
**Fix:** ...
```

## Runbook

**Type:** `runbook`

```markdown
# {{title}}

## When to Use

## Prerequisites

## Procedure

### 1. Assess

### 2. Execute

### 3. Confirm

## Rollback

## Escalation
```

## References

- [Types](/framework/types) — rules for each doc type
- [Recommended](/framework/recommended) — where templates fit in the layout
- [CLI Commands](/reference/cli) — full CLI reference
