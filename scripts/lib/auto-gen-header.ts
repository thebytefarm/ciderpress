/**
 * Comment syntax used to wrap an auto-generated header.
 * - `html` — HTML / markdown block comments
 * - `js` — TypeScript / JavaScript line comments
 * - `jsx` — MDX / JSX block comments
 */
export type CommentStyle = 'html' | 'js' | 'jsx'

/**
 * Render the "do not edit — regenerate with X" banner used at the top of
 * every generated file. Unified across the lauf scripts so the wording
 * stays consistent and the comment-style is picked per output format.
 * @param opts.cmd - command users should run to regenerate (e.g. `lauf run docs`)
 * @param opts.style - comment syntax to wrap the banner in
 * @returns the formatted header line, ready to paste at the top of a file
 */
export function autoGenHeader(opts: {
  readonly cmd: string
  readonly style: CommentStyle
}): string {
  const text = `@auto-generated — do not edit. Regenerate with: ${opts.cmd}`
  if (opts.style === 'html') {
    return `<!-- ${text} -->`
  }
  if (opts.style === 'jsx') {
    return `{/* ${text} */}`
  }
  return `// ${text}`
}
