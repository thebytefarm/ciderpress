---
title: Types
description: The seven documentation types and when to use each one.
---

# Doc Types

Every document you write falls into one of seven types. Each type has a distinct purpose, audience, and structure. Mixing types within a single document is the most common source of confusing docs.

## Tutorial

A guided learning experience that teaches through doing.

**Reader:** Someone learning a concept for the first time.

**Rules:**

- Title starts with a learning verb (Build, Create, Explore)
- One learning goal per tutorial
- Max 7 steps, each producing a visible outcome
- Minimize explanation — link to concept docs instead
- One path, no alternatives or choices

**Structure:**

| Section             | Required |
| ------------------- | -------- |
| What You Will Learn | Yes      |
| What You Will Build | Yes      |
| Prerequisites       | Yes      |
| Steps (numbered)    | Yes      |
| Summary             | Yes      |
| Next Steps          | Yes      |

**Example title:** "Build Your First Plugin"

## Guide

Step-by-step instructions for completing a specific task.

**Reader:** Someone who knows what they want to do and needs the steps.

**Rules:**

- Title starts with an action verb (Add, Configure, Deploy, Set Up)
- Steps are numbered
- Include verification — how to confirm it worked
- Link to reference docs for detailed options

**Structure:**

| Section          | Required |
| ---------------- | -------- |
| Prerequisites    | Yes      |
| Steps (numbered) | Yes      |
| Verification     | Yes      |
| Next Steps       | No       |
| Troubleshooting  | No       |
| References       | Yes      |

**Example title:** "Configure Custom Themes"

## Quickstart

A fast-track from zero to working result. A compressed tutorial that prioritizes speed over learning.

**Reader:** Someone who wants a working setup as fast as possible.

**Rules:**

- Title is "Get Started with {Domain}"
- Max 5 steps
- No explanations, no alternatives — the fastest path
- Every code block must be copy-pasteable

**Structure:**

| Section             | Required |
| ------------------- | -------- |
| What You Will Build | Yes      |
| Prerequisites       | Yes      |
| Steps (numbered)    | Yes      |
| Result              | Yes      |
| Next Steps          | Yes      |

**Example title:** "Get Started with ciderpress"

## Explanation

Conceptual background that helps the reader understand a topic.

**Reader:** Someone who wants to understand how or why something works.

**Rules:**

- Explain "what" and "why," not "how to"
- Include diagrams where they clarify architecture
- Link to guides for step-by-step instructions
- No numbered steps

**Structure:**

| Section      | Required |
| ------------ | -------- |
| Overview     | Yes      |
| Architecture | No       |
| Key Concepts | Yes      |
| Usage        | No       |
| References   | Yes      |

**Example title:** "Authentication"

## Reference

Technical descriptions of APIs, configuration, CLI commands, or data models.

**Reader:** Someone who knows what they're looking for and needs exact details.

**Rules:**

- Comprehensive — document every option, field, or parameter
- Use tables for structured data
- No tutorials or guides embedded in reference docs
- Keep descriptions terse

**Structure:**

| Section        | Required |
| -------------- | -------- |
| Overview       | No       |
| Fields/Options | Yes      |
| Examples       | No       |
| References     | No       |

**Example title:** "Configuration Reference"

## Standard

Rules and conventions that your team must follow.

**Reader:** Someone who needs to know the rules for a specific domain.

**Rules:**

- Clear rules with good/bad examples
- Document how the standard is enforced (linter, CI, code review)
- No step-by-step instructions — link to guides

**Structure:**

| Section     | Required |
| ----------- | -------- |
| Overview    | Yes      |
| Rules       | Yes      |
| Examples    | Yes      |
| Enforcement | No       |

**Example title:** "Git Commit Conventions"

## Troubleshooting

Common problems and their fixes.

**Reader:** Someone with a broken setup who needs a fix now.

**Rules:**

- Each H2 is a single issue (creates linkable anchors)
- Keep fixes short — a command or 1-2 sentences
- No background explanations
- Include exact error messages when possible

**Structure:**

| Section                   | Required |
| ------------------------- | -------- |
| Issue (H2, one per issue) | Yes      |
| Symptom                   | Yes      |
| Fix                       | Yes      |
| Cause                     | No       |

**Example title:** "Deployment Troubleshooting"

## Runbook

Step-by-step operational procedures for recurring tasks that require care.

**Reader:** Someone performing a sensitive operation who needs to get it right.

**Rules:**

- Title names the procedure
- Every step includes verification
- Include rollback instructions
- No conceptual explanations — link to concept docs

**Structure:**

| Section       | Required |
| ------------- | -------- |
| When to Use   | Yes      |
| Prerequisites | Yes      |
| Procedure     | Yes      |
| Rollback      | Yes      |
| Escalation    | No       |

**Example title:** "Database Migration Rollback"

## Choosing the right type

Use this decision tree:

1. Is the reader **learning** something new? → **Tutorial** or **Quickstart**
2. Is the reader **doing** a specific task? → **Guide**
3. Is the reader trying to **understand** something? → **Explanation**
4. Is the reader **looking up** a specific detail? → **Reference**
5. Is the reader **fixing** something broken? → **Troubleshooting**
6. Is the reader performing a **sensitive operation**? → **Runbook**
7. Is this defining **rules** for your team? → **Standard**

## References

- [Overview](/framework/overview) — why documentation organization matters
- [Templates](/framework/templates) — starter templates for each type
- [Diataxis](https://diataxis.fr) — the original framework
