# ciderpress

An opinionated documentation framework for monorepos. Just point it at your code.

<span class="cp-badge">

[![CI](https://github.com/thebytefarm/ciderpress/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/thebytefarm/ciderpress/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/ciderpress)](https://www.npmjs.com/package/ciderpress)
[![License](https://img.shields.io/github/license/thebytefarm/ciderpress)](https://github.com/thebytefarm/ciderpress/blob/main/LICENSE)

</span>

## Features

- **Your docs, your structure** — conforms to your repo, not the other way around.
- **One config, full chrome** — sidebars, nav, footer, edit links, version chip, announcement, and theme from one file.
- **Beautiful themes out of the box** — three built-in themes with full dark-mode support, plus first-class custom themes.
- **Monorepo-first** — built for internal docs with workspace cards, OpenAPI integration, and Liquid template support.

## Install

```bash
npm install ciderpress
```

## Usage

### Define your docs

```ts
// ciderpress.config.ts
import { defineConfig } from 'ciderpress'

export default defineConfig({
  title: 'my-project',
  description: 'Documentation for my-project',
  sections: [
    {
      title: 'Getting Started',
      path: '/getting-started',
      include: 'docs/getting-started/*.md',
    },
    {
      title: 'Guides',
      path: '/guides',
      include: 'docs/guides/*.md',
      icon: 'pixelarticons:book-open',
      sort: 'alpha',
    },
  ],
  theme: { name: 'midnight' },
  site: {
    version: 'v1.0',
    edit: { repo: 'acme/docs', branch: 'main', directory: 'docs' },
    report: { repo: 'acme/docs' },
    topbarCta: { text: 'Get started →', href: '/getting-started' },
  },
})
```

### Run it

```bash
npx ciderpress dev       # start dev server with hot reload
npx ciderpress build     # build for production
npx ciderpress serve     # preview production build
```

## Packages

| Package                                                                        | Description                          |
| ------------------------------------------------------------------------------ | ------------------------------------ |
| [`@ciderpress/core`](https://www.npmjs.com/package/@ciderpress/core)           | Config loading, sync engine, assets  |
| [`@ciderpress/cli`](https://www.npmjs.com/package/@ciderpress/cli)             | CLI commands and file watcher        |
| [`@ciderpress/ui`](https://www.npmjs.com/package/@ciderpress/ui)               | Rspress plugin, theme, and styles    |
| [`@ciderpress/theme`](https://www.npmjs.com/package/@ciderpress/theme)         | Theme factory, tokens, and built-ins |
| [`@ciderpress/config`](https://www.npmjs.com/package/@ciderpress/config)       | Config loading + Zod schemas         |
| [`@ciderpress/templates`](https://www.npmjs.com/package/@ciderpress/templates) | Liquid template registry             |

## Why `ciderpress`?

> [!NOTE]
> Published as `ciderpress` because npm's overly aggressive moniker rules block the `ciderpress` name.

## License

[MIT](https://github.com/thebytefarm/ciderpress/blob/main/LICENSE) - Joggr, Inc.
