/**
 * Render a markdown frontmatter block. Just the standard `---` fences
 * around a `title` and `description`; richer fields can be added by the
 * caller as needed.
 * @param opts.title - the page title
 * @param opts.description - the page description (used for SEO and previews)
 * @returns the frontmatter block, with no trailing newline
 */
export function frontmatter(opts: {
  readonly title: string
  readonly description: string
}): string {
  return `---
title: ${opts.title}
description: ${opts.description}
---`
}

/**
 * Wrap `body` in a triple-backtick code fence with the given language tag.
 * Centralised so call sites don't have to deal with escaping backticks
 * inside template literals.
 * @param opts.lang - the language tag (`ts`, `bash`, etc.)
 * @param opts.body - the code body — leading and trailing whitespace is trimmed
 * @returns the fenced block, with no trailing newline
 */
export function codeFence(opts: { readonly lang: string; readonly body: string }): string {
  return `\`\`\`${opts.lang}\n${opts.body.trim()}\n\`\`\``
}
