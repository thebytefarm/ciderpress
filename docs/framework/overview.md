---
title: Overview
description: ciderpress's opinionated take on documentation organization, inspired by Diataxis.
---

# Framework

Most documentation sites grow organically and end up as a pile of markdown files with no clear structure. ciderpress recommends an opinionated framework for organizing your docs so they stay useful as your project scales.

## Why this matters

Bad docs aren't usually a writing problem — they're an organization problem. A perfectly written guide buried in the wrong section is invisible. A concept doc mixed into a quickstart confuses more than it helps.

A framework gives you two things:

1. **A place for everything** — your team knows where to put new docs without asking
2. **Reader expectations** — users know what kind of content they'll find in each section

## Our take on Diataxis

This framework is heavily inspired by [Diataxis](https://diataxis.fr), a documentation system created by Daniele Procida. Diataxis defines four content types along two axes: learning vs. working, and theory vs. practice.

|              | Learning    | Working   |
| ------------ | ----------- | --------- |
| **Theory**   | Explanation | Reference |
| **Practice** | Tutorials   | Guides    |

We extend this with three additional types that most real-world projects need: **Standards**, **Troubleshooting**, and **Runbooks**.

## The eight doc types

| Type                | Purpose                                 | Reader mindset                |
| ------------------- | --------------------------------------- | ----------------------------- |
| **Tutorial**        | Guided learning experience              | "Teach me"                    |
| **Guide**           | Step-by-step task instructions          | "Help me do this"             |
| **Quickstart**      | Fastest path to a working result        | "Get me running"              |
| **Explanation**     | Conceptual background and architecture  | "Help me understand"          |
| **Reference**       | Technical descriptions and API surfaces | "Give me the details"         |
| **Standard**        | Rules and conventions                   | "What are the rules?"         |
| **Troubleshooting** | Common problems and fixes               | "Something is broken"         |
| **Runbook**         | Operational procedures                  | "Walk me through this safely" |

Each type has its own structure, rules, and templates. See [Types](/framework/types) for details.

## How this maps to ciderpress

The framework maps directly to top-level entries in `config.pages`. A typical project might look like:

```ts
pages: [
  { title: 'Getting Started' /* tutorials + quickstarts */ },
  { title: 'Guides' /* task-oriented how-tos */ },
  { title: 'Concepts' /* explanations */ },
  { title: 'Reference' /* API, config, CLI */ },
  { title: 'Standards' /* rules and conventions */ },
  { title: 'Troubleshooting' /* common issues and fixes */ },
]
```

See [Recommended](/framework/recommended) for the full recommended layout.

## References

- [Diataxis](https://diataxis.fr) — the framework that inspired this approach
- [Types](/framework/types) — detailed breakdown of each doc type
- [Recommended](/framework/recommended) — the recommended layout
