import { match } from 'massaman/match'

import { safeUrl } from './safe-url.ts'

/**
 * Inline HTML tags allowed in config copy. Anything outside this table
 * is unwrapped — the tag vanishes, its text survives — except for
 * {@link STRIPPED_TAGS}, which are dropped along with their contents.
 */
const ALLOWED_TAGS: ReadonlySet<string> = new Set([
  'b',
  'strong',
  'i',
  'em',
  'code',
  'kbd',
  'mark',
  'sup',
  'sub',
  'span',
  'small',
  'u',
  's',
  'del',
  'ins',
])

/**
 * Tags whose contents are discarded with the tag. Unwrapping these would
 * paint script source or stylesheet text onto the page.
 */
const STRIPPED_TAGS: ReadonlySet<string> = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'template',
  'noscript',
])

/**
 * Accent class. `**text**` is emphasis in display copy, and emphasis
 * here means the brand colour — a heading is already bold, so weight
 * alone would say nothing.
 */
export const ACCENT_CLASS = 'cp-accent'

// Ordered alternation — the earliest match wins, and `**` is tried
// before `*` so bold is not read as two italics. A fenced code span
// comes first so markers inside it stay literal.
//
// The tag branch takes everything up to `>` as one `[^>]*` run rather
// than a nested optional-attribute group: nesting quantifiers there is
// the classic backtracking blowup, and the trailing `/` of a
// self-closing tag is cheaper to read off the captured text.
const TOKEN_PATTERN =
  /(?:`([^`]+)`)|(?:\*\*([\s\S]+?)\*\*)|(?:\*([^*\n]+?)\*)|(?:\[([^\]]*)\]\(([^)\s]+)\))|(?:<(\/?)\s*([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>)/

const ATTR_PATTERN = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g

/**
 * One parsed inline node. Plain data, so the same parse feeds both the
 * React renderer and the plain-text stripper — and so this module stays
 * free of React, letting build-time code (which has no router context)
 * import {@link toPlainText}.
 */
export type InlineNode =
  | { readonly kind: 'text'; readonly value: string }
  | { readonly kind: 'code'; readonly value: string }
  | { readonly kind: 'break' }
  | { readonly kind: 'link'; readonly href: string; readonly children: readonly InlineNode[] }
  | {
      readonly kind: 'element'
      readonly tag: string
      readonly className?: string
      readonly title?: string
      readonly children: readonly InlineNode[]
    }

/**
 * Parse config copy into inline nodes, applying an inline-only markdown
 * subset plus a whitelist of inline HTML.
 *
 * Supported: `**accent**`, `*italic*`, `` `code` ``, `[text](/href)`,
 * `<br>`, and the tags in {@link ALLOWED_TAGS}. Use `<strong>` or
 * `<b>` for bold that is not brand-coloured. Links
 * are validated with {@link safeUrl}, so `javascript:` and friends are
 * dropped. Unknown tags are unwrapped and dangerous ones removed whole,
 * so a renderer never has to trust the input.
 *
 * Block markdown (lists, headings, blockquotes) is out of scope: these
 * fields are single-line display copy.
 *
 * @param text - Raw string from config or frontmatter
 * @returns Parsed inline nodes in source order
 *
 * @example
 * parseRichText('Docs, **Zero Effort**')
 */
export function parseRichText(text: string): readonly InlineNode[] {
  if (typeof text !== 'string' || text.length === 0) {
    return []
  }
  return parseInline(text)
}

/**
 * Strip inline markup, returning bare text. Use for values that land
 * where elements cannot go — `<title>`, `<meta>` content, `alt` /
 * `aria-label`, and the search index — so `**Zero** Effort` reads as
 * `Zero Effort` instead of leaking its markers.
 *
 * @param text - Raw string from config or frontmatter
 * @returns The same copy with markup removed
 *
 * @example
 * toPlainText('Beautiful Docs, **Zero Effort**') // → 'Beautiful Docs, Zero Effort'
 */
export function toPlainText(text: string): string {
  return flattenNodes(parseRichText(text))
}

/**
 * Whether copy carries an explicit `**accent**`. The hero title uses
 * this to choose between its positional auto-accent and the author's
 * explicit one.
 *
 * @param text - Raw string from config or frontmatter
 * @returns True when an accent marker is present
 */
export function hasAccentMarker(text: string): boolean {
  if (typeof text !== 'string') {
    return false
  }
  return /\*\*[\s\S]+?\*\*/.test(text)
}

/**
 * Tokenize copy into inline nodes. Recursive rather than iterative:
 * each pass takes the text before the first token, the token itself,
 * then continues on what the token left behind.
 *
 * @private
 * @param input - Remaining unparsed copy
 * @returns Parsed nodes in source order
 */
function parseInline(input: string): readonly InlineNode[] {
  if (input.length === 0) {
    return []
  }
  const found = TOKEN_PATTERN.exec(input)
  if (found === null) {
    return [{ kind: 'text', value: input }]
  }
  const lead = input.slice(0, found.index)
  const after = input.slice(found.index + found[0].length)
  const step = consumeToken(found, after)
  return [...textNodes(lead), ...step.nodes, ...parseInline(step.rest)]
}

/**
 * Wrap leading text, dropping it when empty.
 *
 * @private
 * @param lead - Text before the matched token
 * @returns Zero or one text nodes
 */
function textNodes(lead: string): readonly InlineNode[] {
  if (lead.length === 0) {
    return []
  }
  return [{ kind: 'text', value: lead }]
}

/**
 * Nodes produced by one token, plus the input still to parse. HTML
 * elements consume their closing tag, so `rest` is not simply the text
 * after the match.
 *
 * @private
 */
interface TokenStep {
  readonly nodes: readonly InlineNode[]
  readonly rest: string
}

/**
 * Convert one token match into nodes.
 *
 * @private
 * @param found - Match produced by {@link TOKEN_PATTERN}
 * @param after - Input following the match
 * @returns Nodes and the remaining input
 */
function consumeToken(found: RegExpExecArray, after: string): TokenStep {
  const [, code, bold, italic, linkText, linkHref, closing, tagName, rawAttrs] = found
  // Sequential guards rather than a `match` on the group tuple: the
  // groups are independent `string | undefined` slots, so matching one
  // tells the compiler nothing useful about the others.
  if (code !== undefined) {
    return { nodes: [codeNode(code)], rest: after }
  }
  if (bold !== undefined) {
    return { nodes: [accentNode(parseInline(bold))], rest: after }
  }
  if (italic !== undefined) {
    return { nodes: [element('em', parseInline(italic))], rest: after }
  }
  if (linkHref !== undefined) {
    return { nodes: linkNodes(linkText ?? '', linkHref), rest: after }
  }
  if (tagName !== undefined) {
    const tail = (rawAttrs ?? '').trimEnd()
    const isSelfClosing = tail.endsWith('/')
    return consumeTag({
      tagName: tagName.toLowerCase(),
      attrs: match(isSelfClosing)
        .with(true, () => tail.slice(0, -1))
        .otherwise(() => tail),
      isClosing: closing === '/',
      isSelfClosing,
      after,
    })
  }
  return { nodes: [{ kind: 'text', value: found[0] }], rest: after }
}

/**
 * Parameters for {@link consumeTag}.
 *
 * @private
 */
interface ConsumeTagParams {
  readonly tagName: string
  readonly attrs: string
  readonly isClosing: boolean
  readonly isSelfClosing: boolean
  readonly after: string
}

/**
 * Handle an HTML tag found in copy.
 *
 * - `<br>` becomes a line break
 * - a whitelisted tag becomes that element, its contents parsed and its
 *   closing tag consumed
 * - `<script>` and friends are dropped with their contents
 * - anything else is unwrapped: the tag goes, its text stays
 * - a stray closing tag is dropped
 *
 * Same-tag nesting is not tracked — the first matching close wins, which
 * is sufficient for single-line display copy.
 *
 * @private
 * @param params - Tag name, raw attributes, tag flavour, and trailing input
 * @returns Nodes and the remaining input
 */
function consumeTag(params: ConsumeTagParams): TokenStep {
  const { tagName, attrs, isClosing, isSelfClosing, after } = params
  if (isClosing) {
    return { nodes: [], rest: after }
  }
  if (tagName === 'br') {
    return { nodes: [{ kind: 'break' }], rest: after }
  }
  if (isSelfClosing) {
    return { nodes: selfClosingNodes(tagName, attrs), rest: after }
  }

  const close = findClosingTag(after, tagName)
  if (close === null) {
    // Unterminated: drop the rest outright for dangerous tags so their
    // body never paints, otherwise just unwrap the opener.
    if (STRIPPED_TAGS.has(tagName)) {
      return { nodes: [], rest: '' }
    }
    return { nodes: [], rest: after }
  }

  const inner = after.slice(0, close.start)
  const rest = after.slice(close.end)
  if (STRIPPED_TAGS.has(tagName)) {
    return { nodes: [], rest }
  }
  if (tagName === 'a') {
    return { nodes: anchorNodes(attrs, parseInline(inner)), rest }
  }
  if (ALLOWED_TAGS.has(tagName)) {
    return { nodes: [taggedElement(tagName, attrs, parseInline(inner))], rest }
  }
  return { nodes: parseInline(inner), rest }
}

/**
 * Nodes for a self-closing tag — only whitelisted ones survive, and
 * they render empty.
 *
 * @private
 * @param tagName - Lowercased tag name
 * @param attrs - Raw attribute text
 * @returns Zero or one element nodes
 */
function selfClosingNodes(tagName: string, attrs: string): readonly InlineNode[] {
  if (!ALLOWED_TAGS.has(tagName)) {
    return []
  }
  return [taggedElement(tagName, attrs, [])]
}

/**
 * Position of a tag's closing tag within `text`.
 *
 * Uses `indexOf` rather than a constructed regex — building a `RegExp`
 * from a parsed tag name would compile user input into a pattern.
 *
 * @private
 * @param text - Input following the opening tag
 * @param tagName - Lowercased tag name to close
 * @returns Start/end offsets of the closing tag, or null when absent
 */
function findClosingTag(
  text: string,
  tagName: string
): { readonly start: number; readonly end: number } | null {
  const start = text.toLowerCase().indexOf(`</${tagName}`)
  if (start < 0) {
    return null
  }
  const gt = text.indexOf('>', start)
  if (gt < 0) {
    return null
  }
  return { start, end: gt + 1 }
}

/**
 * Parse the whitelisted attributes off a raw tag. Everything else —
 * `onclick`, `style`, `srcset` — is discarded.
 *
 * @private
 * @param attrs - Raw attribute text from the tag
 * @returns Parsed `class`, `title`, and `href` values
 */
function parseAttrs(attrs: string): {
  readonly className?: string
  readonly title?: string
  readonly href?: string
} {
  const entries = [...attrs.matchAll(ATTR_PATTERN)]
  return entries.reduce<{ className?: string; title?: string; href?: string }>((acc, entry) => {
    const name = entry[1].toLowerCase()
    const value = entry[2] ?? entry[3] ?? ''
    return match(name)
      .with('class', () => ({ ...acc, className: value }))
      .with('classname', () => ({ ...acc, className: value }))
      .with('title', () => ({ ...acc, title: value }))
      .with('href', () => ({ ...acc, href: value }))
      .otherwise(() => acc)
  }, {})
}

/**
 * Build an element node from a whitelisted tag and its attributes.
 *
 * @private
 * @param tag - Lowercased tag name
 * @param attrs - Raw attribute text
 * @param children - Parsed contents
 * @returns Element node
 */
function taggedElement(tag: string, attrs: string, children: readonly InlineNode[]): InlineNode {
  const parsed = parseAttrs(attrs)
  return { kind: 'element', tag, className: parsed.className, title: parsed.title, children }
}

/**
 * Nodes for an `<a>` element — validated through {@link safeUrl}, and
 * unwrapped to its text when the destination is rejected or missing.
 *
 * @private
 * @param attrs - Raw attribute text
 * @param children - Parsed contents
 * @returns Link node, or the bare contents
 */
function anchorNodes(attrs: string, children: readonly InlineNode[]): readonly InlineNode[] {
  const { href } = parseAttrs(attrs)
  if (href === undefined) {
    return children
  }
  const safe = safeUrl(href)
  if (safe === null) {
    return children
  }
  return [{ kind: 'link', href: safe, children }]
}

/**
 * Nodes for a markdown link, falling back to bare text when the
 * destination fails validation.
 *
 * @private
 * @param text - Link label
 * @param href - Raw destination
 * @returns Link node, or the parsed label
 */
function linkNodes(text: string, href: string): readonly InlineNode[] {
  const safe = safeUrl(href)
  if (safe === null) {
    return parseInline(text)
  }
  return [{ kind: 'link', href: safe, children: parseInline(text) }]
}

/**
 * Build a code node.
 *
 * @private
 * @param value - Literal code text
 * @returns Code node
 */
function codeNode(value: string): InlineNode {
  return { kind: 'code', value }
}

/**
 * Build an accent node — bold *and* brand-coloured, so it reads as
 * emphasis in body copy and as the accent phrase in a heading.
 *
 * @private
 * @param children - Parsed contents
 * @returns Accent element node
 */
function accentNode(children: readonly InlineNode[]): InlineNode {
  return { kind: 'element', tag: 'strong', className: ACCENT_CLASS, children }
}

/**
 * Build a plain element node with no attributes.
 *
 * @private
 * @param tag - Element tag
 * @param children - Parsed contents
 * @returns Element node
 */
function element(tag: string, children: readonly InlineNode[]): InlineNode {
  return { kind: 'element', tag, children }
}

/**
 * Flatten parsed nodes back to bare text.
 *
 * @private
 * @param nodes - Parsed inline nodes
 * @returns Concatenated text content
 */
function flattenNodes(nodes: readonly InlineNode[]): string {
  return nodes.map(flattenNode).join('')
}

/**
 * Text content of one parsed node.
 *
 * @private
 * @param node - Parsed node
 * @returns Its text
 */
function flattenNode(node: InlineNode): string {
  return match(node)
    .with({ kind: 'text' }, (n) => n.value)
    .with({ kind: 'code' }, (n) => n.value)
    .with({ kind: 'break' }, () => ' ')
    .with({ kind: 'link' }, (n) => flattenNodes(n.children))
    .with({ kind: 'element' }, (n) => flattenNodes(n.children))
    .exhaustive()
}
