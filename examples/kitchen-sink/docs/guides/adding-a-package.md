---
title: Adding a Package
description: How to create a new shared package in the monorepo.
---

# Adding a Package

## Scaffold

Create a new package directory:

```bash
mkdir -p packages/my-pkg/src
```

## Package manifest

Create `packages/my-pkg/package.json`:

```json
{
  "name": "@acme/my-pkg",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "build": "rslib build",
    "typecheck": "tsc --noEmit"
  }
}
```

## Source entry

Create `packages/my-pkg/src/index.ts`:

```ts
export const hello = (name: string): string => `Hello, ${name}!`
```

## Register workspace

pnpm automatically discovers packages under `packages/`. Run:

```bash
pnpm install
```

## Consume from an app

Add the dependency to an app:

```bash
pnpm --filter web add @acme/my-pkg
```

Import and use:

```ts
import { hello } from '@acme/my-pkg'

console.log(hello('world'))
```

## Add documentation

Create `packages/my-pkg/docs/overview.md` and add a workspace entry in `ciderpress.config.ts`:

```ts
packages: [
  // ...existing packages
  {
    text: 'My Pkg',
    icon: 'devicon:typescript',
    description: 'What my-pkg does',
    tags: ['typescript'],
    docsPrefix: '/packages/my-pkg',
  },
],
```
