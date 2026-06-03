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
```

This renders the template with your title and writes it to the output directory.

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

Templates use `{{title}}` as the placeholder, which is replaced when rendering.

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
