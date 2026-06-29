---
title: Mermaid Diagrams
description: Render diagrams from text using Mermaid fenced code blocks.
---

# Mermaid Diagrams

ciderpress bundles `rspress-plugin-mermaid` so any fenced code block with the `mermaid` language renders as a diagram. No configuration required.

## Flowchart

**Code**

````md
```mermaid
graph LR
  A[Start] --> B{Decision}
  B -->|Yes| C[Action]
  B -->|No| D[End]
```
````

**Output**

```mermaid
graph LR
  A[Start] --> B{Decision}
  B -->|Yes| C[Action]
  B -->|No| D[End]
```

## Sequence diagram

**Code**

````md
```mermaid
sequenceDiagram
  participant Client
  participant Server
  participant DB

  Client->>+Server: POST /api/login
  Server->>+DB: SELECT user WHERE email = ?
  DB-->>-Server: user row
  Server-->>-Client: 200 OK { token }
```
````

**Output**

```mermaid
sequenceDiagram
  participant Client
  participant Server
  participant DB

  Client->>+Server: POST /api/login
  Server->>+DB: SELECT user WHERE email = ?
  DB-->>-Server: user row
  Server-->>-Client: 200 OK { token }
```

## Entity relationship

**Code**

````md
```mermaid
erDiagram
  USER ||--o{ POST : writes
  USER ||--o{ COMMENT : authors
  POST ||--|{ TAG : has
  POST ||--o{ COMMENT : receives
```
````

**Output**

```mermaid
erDiagram
  USER ||--o{ POST : writes
  USER ||--o{ COMMENT : authors
  POST ||--|{ TAG : has
  POST ||--o{ COMMENT : receives
```

## State diagram

**Code**

````md
```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Review : submit
  Review --> Published : approve
  Review --> Draft : request changes
  Published --> Archived : archive
  Archived --> [*]
```
````

**Output**

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Review : submit
  Review --> Published : approve
  Review --> Draft : request changes
  Published --> Archived : archive
  Archived --> [*]
```

## Git graph

**Code**

````md
```mermaid
gitGraph
  commit
  commit
  branch feature
  checkout feature
  commit
  commit
  checkout main
  merge feature
  commit
```
````

**Output**

```mermaid
gitGraph
  commit
  commit
  branch feature
  checkout feature
  commit
  commit
  checkout main
  merge feature
  commit
```

## Gantt chart

**Code**

````md
```mermaid
gantt
  title Release Plan
  dateFormat YYYY-MM-DD
  section Development
    Core features     :a1, 2025-01-01, 30d
    API integration   :a2, after a1, 20d
  section Testing
    Unit tests        :b1, after a1, 15d
    E2E tests         :b2, after a2, 10d
  section Release
    Documentation     :c1, after b2, 7d
    Launch            :milestone, after c1, 0d
```
````

**Output**

```mermaid
gantt
  title Release Plan
  dateFormat YYYY-MM-DD
  section Development
    Core features     :a1, 2025-01-01, 30d
    API integration   :a2, after a1, 20d
  section Testing
    Unit tests        :b1, after a1, 15d
    E2E tests         :b2, after a2, 10d
  section Release
    Documentation     :c1, after b2, 7d
    Launch            :milestone, after c1, 0d
```

## Pie chart

**Code**

````md
```mermaid
pie title Tech Stack
  "TypeScript" : 45
  "React" : 30
  "CSS" : 15
  "Other" : 10
```
````

**Output**

```mermaid
pie title Tech Stack
  "TypeScript" : 45
  "React" : 30
  "CSS" : 15
  "Other" : 10
```

## All supported types

| Type                | Directive              |
| ------------------- | ---------------------- |
| Flowchart           | `graph` or `flowchart` |
| Sequence            | `sequenceDiagram`      |
| Class               | `classDiagram`         |
| State               | `stateDiagram-v2`      |
| Entity Relationship | `erDiagram`            |
| Gantt               | `gantt`                |
| Pie                 | `pie`                  |
| Git Graph           | `gitGraph`             |
| Mindmap             | `mindmap`              |
| Timeline            | `timeline`             |

## References

- [Mermaid documentation](https://mermaid.js.org/intro/)
