---
title: LLM Output
description: How ciderpress serves documentation as structured text for LLMs, AI agents, and programmatic consumers.
---

# LLM Output

## Overview

Every ciderpress site exposes three machine-readable interfaces out of the box:

| Interface         | Endpoint         | Description                                     |
| ----------------- | ---------------- | ----------------------------------------------- |
| LLMs.txt index    | `/llms.txt`      | Page listing with titles and URLs               |
| LLMs.txt full     | `/llms-full.txt` | All page content concatenated into one document |
| Per-page markdown | `{any-page}.md`  | Raw markdown for any individual page            |

These are generated at build time and served alongside your HTML pages. No configuration, no opt-in — they exist on every ciderpress site.

## LLMs.txt

ciderpress follows the [llms.txt specification](https://llmstxt.org/) to provide two endpoints that give LLMs and AI tools a structured view of your documentation.

### `/llms.txt` — page index

A lightweight index of every page, grouped by section. Useful for discovery and navigation.

```txt
# My Docs

> A documentation site for my project.

## Getting Started

- [Introduction](https://docs.example.com/getting-started/introduction)
- [Quick Start](https://docs.example.com/getting-started/quick-start)

## Concepts

- [Content](https://docs.example.com/concepts/content)
- [Navigation](https://docs.example.com/concepts/navigation)
- [Themes](https://docs.example.com/concepts/themes)

## Reference

- [Configuration](https://docs.example.com/reference/configuration)
- [CLI Commands](https://docs.example.com/reference/cli)
```

### `/llms-full.txt` — full content

The complete text of every page, concatenated into a single document. Useful for feeding entire documentation sets into an LLM context window.

```txt
# My Docs

> A documentation site for my project.

## Getting Started

### Introduction

Welcome to My Docs. This guide walks you through...

### Quick Start

Install the package:

npm install @acme/docs

Create a config file:
...
```

## Per-page raw markdown

Every documentation page is also available as raw markdown by appending `.md` to the URL:

| URL                                | Content-Type    | Description         |
| ---------------------------------- | --------------- | ------------------- |
| `/getting-started/introduction`    | `text/html`     | Rendered HTML page  |
| `/getting-started/introduction.md` | `text/markdown` | Raw source markdown |

This is useful for:

- AI agents that prefer markdown over HTML
- Programmatic documentation consumers
- Downstream tooling that processes raw content

### Example

**Code**

```bash
curl -s https://docs.example.com/getting-started/introduction.md
```

**Output**

```md
# Introduction

Welcome to My Docs. This guide walks you through setting up your
documentation site from scratch.

## Prerequisites

- Node.js 24+
- A project with markdown files
```

## OpenAPI pages

OpenAPI-generated pages replace the standard raw markdown button with a "Copy Markdown" button that produces a structured markdown representation of the operation, including method, path, parameters, request body, and responses.

## Design Decisions

- **Always on** — machine-readable output requires no configuration. Every site gets it for free because discoverability by AI tools should be a default, not an afterthought.
- **Build-time generation** — LLMs.txt files are generated during `ciderpress build`, not served dynamically. This keeps runtime simple and means the files are cacheable by CDNs.
- **Per-page `.md` endpoints** — rather than forcing consumers to parse HTML or download the full `llms-full.txt`, individual pages are available as raw markdown. This lets agents fetch only what they need.

## Resources

- [llms.txt specification](https://llmstxt.org/)

## References

- [Content](/concepts/content) — how pages and sections define your site structure
- [Configuration reference](/reference/configuration) — full config field reference
