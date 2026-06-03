# @ciderpress/cli

CLI for building and serving ciderpress documentation sites.

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

| Command    | Description                         |
| ---------- | ----------------------------------- |
| `dev`      | Start dev server with hot reload    |
| `build`    | Build for production                |
| `serve`    | Preview production build            |
| `sync`     | Sync config to documentation output |
| `clean`    | Remove generated output             |
| `dump`     | Dump resolved config for debugging  |
| `setup`    | Scaffold a new ciderpress project   |
| `generate` | Generate assets (banners, icons)    |

## Usage

```bash
npx ciderpress dev       # start dev server
npx ciderpress build     # production build
npx ciderpress serve     # preview build
```

> Most users should install [`ciderpress`](https://www.npmjs.com/package/ciderpress) instead, which re-exports the CLI alongside config helpers.

## License

[MIT](https://github.com/thebytefarm/ciderpress/blob/main/LICENSE) - Joggr, Inc.
