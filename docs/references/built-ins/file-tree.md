---
title: File Tree
description: Render interactive file tree visualizations.
---

# File Tree

ciderpress bundles `rspress-plugin-file-tree` for rendering file and directory structures. Trees are collapsible and expanded one level deep by default. No configuration required.

Use a fenced code block with the `tree` language.

## Usage

**Code**

````md
```tree
.
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Card.tsx
│   ├── utils/
│   │   └── helpers.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```
````

**Output**

```tree
.
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Card.tsx
│   ├── utils/
│   │   └── helpers.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

## Monorepo example

**Code**

````md
```tree
.
├── packages/
│   ├── cli/
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── dev.ts
│   │   │   │   ├── build.ts
│   │   │   │   └── sync.ts
│   │   │   └── index.ts
│   │   └── package.json
│   ├── core/
│   │   ├── src/
│   │   │   ├── sync/
│   │   │   │   ├── index.ts
│   │   │   │   └── sidebar.ts
│   │   │   └── index.ts
│   │   └── package.json
│   └── ui/
│       ├── src/
│       │   └── theme/
│       │       ├── components/
│       │       ├── styles/
│       │       └── index.tsx
│       └── package.json
├── docs/
│   ├── getting-started/
│   │   ├── introduction.md
│   │   └── quick-start.md
│   └── concepts/
│       └── sections-and-pages.md
├── ciderpress.config.ts
└── package.json
```
````

**Output**

```tree
.
├── packages/
│   ├── cli/
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── dev.ts
│   │   │   │   ├── build.ts
│   │   │   │   └── sync.ts
│   │   │   └── index.ts
│   │   └── package.json
│   ├── core/
│   │   ├── src/
│   │   │   ├── sync/
│   │   │   │   ├── index.ts
│   │   │   │   └── sidebar.ts
│   │   │   └── index.ts
│   │   └── package.json
│   └── ui/
│       ├── src/
│       │   └── theme/
│       │       ├── components/
│       │       ├── styles/
│       │       └── index.tsx
│       └── package.json
├── docs/
│   ├── getting-started/
│   │   ├── introduction.md
│   │   └── quick-start.md
│   └── concepts/
│       └── sections-and-pages.md
├── ciderpress.config.ts
└── package.json
```

## Syntax

| Character    | Meaning                        |
| ------------ | ------------------------------ |
| `├──`        | Item with siblings after it    |
| `└──`        | Last item in a directory       |
| `│`          | Vertical connector for nesting |
| Trailing `/` | Directory                      |

## Comments

Add comments by separating them from the filename with two or more spaces:

**Code**

````md
```tree
.
├── src/
│   ├── config.ts      configuration loading
│   ├── sync.ts        sync engine entry
│   └── sidebar.ts     sidebar generation
└── package.json
```
````

**Output**

```tree
.
├── src/
│   ├── config.ts      configuration loading
│   ├── sync.ts        sync engine entry
│   └── sidebar.ts     sidebar generation
└── package.json
```
