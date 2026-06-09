# @ciderpress/cli

The `ciderpress` CLI — sync, dev, build, and serve commands. Part of [ciderpress](https://www.npmjs.com/package/ciderpress), the docs framework for monorepos.

<span class="cp-badge">

[![CI](https://github.com/thebytefarm/ciderpress/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/thebytefarm/ciderpress/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@ciderpress/cli)](https://www.npmjs.com/package/@ciderpress/cli)
[![License](https://img.shields.io/github/license/thebytefarm/ciderpress)](https://github.com/thebytefarm/ciderpress/blob/main/LICENSE)

</span>

## Install

```bash
npm install @ciderpress/cli
```

## Commands

| Command | Description                                           |
| ------- | ----------------------------------------------------- |
| `dev`   | Run sync + watcher and start the Rspress dev server   |
| `build` | Sync content, generate assets, and build the site     |
| `serve` | Preview the built site                                |
| `sync`  | Sync documentation content without building           |
| `clean` | Remove build artifacts, synced content, and cache     |
| `check` | Validate config and check for broken links            |
| `diff`  | Show changed files in watched source directories      |
| `dump`  | Resolve and print the full entry tree as JSON         |
| `draft` | Scaffold a new documentation file from a template     |
| `setup` | Initialize a ciderpress config in the current project |

## Usage

```bash
npx ciderpress dev       # start dev server
npx ciderpress build     # production build
npx ciderpress serve     # preview build
```

> Most users should install [`ciderpress`](https://www.npmjs.com/package/ciderpress) instead, which re-exports the CLI alongside config helpers.

## License

[MIT](https://github.com/thebytefarm/ciderpress/blob/main/LICENSE)
