---
title: Guide Template
description: Copy-paste template for writing how-to guide documentation.
---

# Guide Template

Template for how-to guides — task-oriented documentation that walks the reader through completing a specific goal.

Scaffold this template with `ciderpress draft --type guide`.

## Rules

- H1 starts with a verb (Add, Create, Set Up, Run, Debug, Write, Configure, Deploy)
- One-liner immediately after H1 — what the reader will accomplish
- One goal per guide — if you're covering two tasks, split into two docs
- Steps are numbered H3 headings under a `## Steps` parent
- Include a Prerequisites section before Steps
- Include a Verification section after Steps — how to confirm success
- Each step should be a single discrete action — if a step has sub-parts, use a numbered list inside the step
- Include a Troubleshooting section when there are known failure modes
- End with a References section linking to related docs
- Code examples use the exact commands or code the reader should run
- No conceptual explanations — link to concept docs
- No API signatures or field tables — link to reference docs

## Structure

| Section           | Required | Description                           |
| ----------------- | -------- | ------------------------------------- |
| H1 verb-led title | yes      | Starts with an action verb            |
| One-liner         | yes      | What the reader will accomplish       |
| Prerequisites     | yes      | What the reader needs before starting |
| Steps             | yes      | Numbered H3 sub-steps                 |
| Verification      | yes      | How to confirm success                |
| Next Steps        | no       | Follow-on tasks or deeper topics      |
| Troubleshooting   | no       | Common failures and fixes             |
| References        | yes      | Related docs and external resources   |

## Template

````markdown
# Action Title

What the reader will accomplish by following this guide in one sentence.

## Prerequisites

- Prerequisite 1
- Prerequisite 2
- Familiarity with [Related Concept](../link) — what they should know

## Steps

### 1. First Step

Brief explanation of what this step does and why.

```bash
command here
```

### 2. Second Step

Brief explanation.

```ts
const result = await doSomething({
  option: 'value',
})
```

### 3. Third Step

Continue as needed.

## Verification

Run the verification command:

```bash
verification-command
```

Expected output or behavior description.

## Next Steps

- [Next guide title](../link) — what to do after completing this guide
- [Concept doc title](../link) — deeper understanding of the concepts used

## Troubleshooting

### Common Issue Name

**Symptom:** What the user observes (error message, unexpected behavior).

**Fix:**

```bash
solution-command
```

### Another Common Issue

**Symptom:** Brief description of the problem.

**Cause:** Why this happens.

**Fix:**

1. First corrective step
2. Second corrective step

## References

- [Related Concept](../link) — background on why this works the way it does
- [Reference Doc](../link) — detailed API or configuration options
````

## References

- [Types](/framework/types) — the seven doc types
- [Diataxis — How-To Guides](https://diataxis.fr/how-to-guides/) — framework reference
