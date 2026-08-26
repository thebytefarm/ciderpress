import { unfold } from 'massaman/array'
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

/**
 * Highlight class. `==text==` is the ecosystem's highlight marker
 * (Obsidian, Typora, markdown-it-mark), so it renders a tinted `<mark>`
 * rather than being redefined as a second accent.
 */
export const MARK_CLASS = 'cp-mark'

// Ordered alternation, earliest match wins. Alternation order only breaks
// ties at the SAME start index, so `**` being listed before `*` does not by
// itself stop a stray earlier `*` from claiming a later bold's opening
// marker — the italic branch carries `(?<!\*)` / `(?!\*)` guards for that.
//
// A backslash escape comes first so `\*`, `` \` ``, `\[`, `\<`, `\=` and
// `\\` can be written literally. Without it a docs site cannot put `*.md`
// or `**/*.ts` in its own copy.
//
// A fenced code span comes next so markers inside it stay literal.
//
// The tag branch reads attributes as a quote-aware run so a `>` inside an
// attribute value does not truncate the tag, and pins the tag name with a
// `(?=[\s/>])` lookahead so the name group and the attribute run cannot
// overlap — that ambiguity, not attribute nesting, is the backtracking
// blowup. The trailing `/` of a self-closing tag is read off the captured
// text.
// The italic branch also requires its delimiters to "flank" the text —
// the opener followed by a non-space, the closer preceded by one — which
// is CommonMark's rule and what keeps `2 * 3 * 4` from italicising ` 3 `.
//
// The unsafe-regex lint is suppressed below rather than satisfied: every
// alternation here is disjoint on its first character (`"` / `'` / neither
// for attributes; `(` / not-`(` for link destinations), so there is no
// ambiguity for a backtracking engine to explore. Measured linear from 2k
// to 128k chars (0.19ms -> 0.45ms) across tag-name runs, attribute runs,
// quote runs, unbalanced parens, and unterminated quotes. The pattern this
// replaced *was* quadratic (2ms -> 427ms over the same range).
const TOKEN_PATTERN =
  /(?:\\([*=`[\]<\\]))|(?:`([^`]+)`)|(?:\*\*([\s\S]+?)\*\*)|(?:==([\s\S]+?)==)|(?:(?<!\*)\*(?=[^\s*])([^*\n]+?)(?<=[^\s*])\*(?!\*))|(?:\[([^\]]*)\]\(((?:[^()\s]|\([^()\s]*\))+)\))|(?:<(\/?)\s*([a-zA-Z][a-zA-Z0-9-]*)(?=[\s/>])((?:"[^"]*"|'[^']*'|[^>"'])*)>)/

const ATTR_PATTERN = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g

/**
 * Characters that may follow `</name` in a well-formed closing tag. Used to
 * reject a prefix hit — `</s` must not close on `</span>`.
 */
const CLOSE_TAG_BOUNDARY = /[\s>]/

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
 * Supported: `**accent**`, `==highlight==`, `*italic*`, `` `code` ``,
 * `[text](/href)`, `<br>`, and the tags in {@link ALLOWED_TAGS}. Use
 * `<strong>` or `<b>` for bold that is not brand-coloured. Links
 * are validated with {@link safeUrl}, so `javascript:` and friends are
 * dropped. Unknown tags are unwrapped and dangerous ones removed whole,
 * so a renderer never has to trust the input.
 *
 * A backslash escapes any marker character — `\*`, `` \` ``, `\=`, `\[`,
 * `\]`, `\<`, `\\` — so copy can name a glob or an expression such as
 * `2 * 3` without it being read as markup.
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
  return parseInline({ input: text, inLink: false })
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
 * Derived from the parsed nodes rather than a raw regex: markers inside
 * a code span are literal text, and treating them as an accent would
 * suppress the hero's automatic one while rendering no accent at all.
 *
 * @param text - Raw string from config or frontmatter
 * @returns True when an accent element is present
 */
export function hasAccentMarker(text: string): boolean {
  return containsAccent(parseRichText(text))
}

/**
 * Whether copy is entirely unmarked text. Callers that slice a string
 * before rendering it — the hero's positional accent, for one — must
 * not cut through markup, so they use this to bail out.
 *
 * @param text - Raw string from config or frontmatter
 * @returns True when parsing yields nothing but text
 */
export function isPlainText(text: string): boolean {
  return parseRichText(text).every((node) => node.kind === 'text')
}

/**
 * Whether any node in the tree is an accent element.
 *
 * @private
 * @param nodes - Parsed inline nodes
 * @returns True when an accent element is present at any depth
 */
function containsAccent(nodes: readonly InlineNode[]): boolean {
  return nodes.some((node) =>
    match(node)
      .with({ kind: 'element' }, (n) => n.className === ACCENT_CLASS || containsAccent(n.children))
      .with({ kind: 'link' }, (n) => containsAccent(n.children))
      .otherwise(() => false)
  )
}

/**
 * Parameters for {@link parseInline}.
 *
 * @private
 */
interface ParseInlineParams {
  readonly input: string
  /**
   * Whether parsing is already inside a link. Nested anchors are invalid
   * DOM — React warns and browsers split the tree on hydration — so a
   * link found while this is set renders as its label alone.
   */
  readonly inLink: boolean
}

/**
 * Tokenize copy into inline nodes. Each step takes the text before the
 * first token, the token itself, then continues on what the token left
 * behind.
 *
 * Driven by `unfold` rather than self-recursion: a self-recursive walk
 * adds a stack frame per token and JS has no tail-call elimination, so
 * long copy overflowed the stack with an unattributed `RangeError` that
 * failed the whole SSG build. Nesting still recurses — through
 * {@link consumeToken} — but that depth is bounded by how deeply the
 * markup nests, not by how many tokens the string holds.
 *
 * @private
 * @param params - Remaining unparsed copy and whether it sits inside a link
 * @returns Parsed nodes in source order
 */
function parseInline({ input, inLink }: ParseInlineParams): readonly InlineNode[] {
  return unfold<string, readonly InlineNode[]>((remaining) => {
    if (remaining.length === 0) {
      return false
    }
    const found = TOKEN_PATTERN.exec(remaining)
    if (found === null) {
      return [[{ kind: 'text', value: remaining }], '']
    }
    const lead = remaining.slice(0, found.index)
    const after = remaining.slice(found.index + found[0].length)
    const step = consumeToken({ found, after, inLink })
    return [[...textNodes(lead), ...step.nodes], step.rest]
  }, input).flat()
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
 * Parameters for {@link consumeToken}.
 *
 * @private
 */
interface ConsumeTokenParams {
  readonly found: RegExpExecArray
  readonly after: string
  readonly inLink: boolean
}

/**
 * Convert one token match into nodes.
 *
 * @private
 * @param params - The token match, the input following it, and link depth
 * @returns Nodes and the remaining input
 */
function consumeToken({ found, after, inLink }: ConsumeTokenParams): TokenStep {
  const [, escaped, code, bold, highlight, italic, linkText, linkHref, closing, tagName, rawAttrs] =
    found
  // Sequential guards rather than a `match` on the group tuple: the
  // groups are independent `string | undefined` slots, so matching one
  // tells the compiler nothing useful about the others.
  if (escaped !== undefined) {
    return { nodes: [{ kind: 'text', value: escaped }], rest: after }
  }
  if (code !== undefined) {
    return { nodes: [codeNode(code)], rest: after }
  }
  if (bold !== undefined) {
    return { nodes: [accentNode(parseInline({ input: bold, inLink }))], rest: after }
  }
  if (highlight !== undefined) {
    return { nodes: [markNode(parseInline({ input: highlight, inLink }))], rest: after }
  }
  if (italic !== undefined) {
    return {
      nodes: [element({ tag: 'em', children: parseInline({ input: italic, inLink }) })],
      rest: after,
    }
  }
  if (linkHref !== undefined) {
    return { nodes: linkNodes({ text: linkText ?? '', href: linkHref, inLink }), rest: after }
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
      inLink,
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
  readonly inLink: boolean
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
  const { tagName, attrs, isClosing, isSelfClosing, after, inLink } = params
  if (isClosing) {
    return { nodes: [], rest: after }
  }
  if (tagName === 'br') {
    return { nodes: [{ kind: 'break' }], rest: after }
  }
  if (isSelfClosing) {
    return { nodes: selfClosingNodes({ tagName, attrs }), rest: after }
  }

  const close = findClosingTag({ text: after, tagName })
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
    return { nodes: anchorNodes({ attrs, inner, inLink }), rest }
  }
  if (ALLOWED_TAGS.has(tagName)) {
    return {
      nodes: [
        taggedElement({ tag: tagName, attrs, children: parseInline({ input: inner, inLink }) }),
      ],
      rest,
    }
  }
  return { nodes: parseInline({ input: inner, inLink }), rest }
}

/**
 * Parameters for {@link selfClosingNodes}.
 *
 * @private
 */
interface SelfClosingNodesParams {
  readonly tagName: string
  readonly attrs: string
}

/**
 * Nodes for a self-closing tag — only whitelisted ones survive, and
 * they render empty.
 *
 * @private
 * @param params - Lowercased tag name and raw attribute text
 * @returns Zero or one element nodes
 */
function selfClosingNodes({ tagName, attrs }: SelfClosingNodesParams): readonly InlineNode[] {
  if (!ALLOWED_TAGS.has(tagName)) {
    return []
  }
  return [taggedElement({ tag: tagName, attrs, children: [] })]
}

/**
 * Parameters for {@link findClosingTag}.
 *
 * @private
 */
interface FindClosingTagParams {
  readonly text: string
  readonly tagName: string
}

/**
 * Position of a tag's closing tag within `text`.
 *
 * Uses `indexOf` rather than a constructed regex — building a `RegExp`
 * from a parsed tag name would compile user input into a pattern.
 *
 * @private
 * @param params - Input following the opening tag, and the tag to close
 * @returns Start/end offsets of the closing tag, or null when absent
 */
function findClosingTag({
  text,
  tagName,
}: FindClosingTagParams): { readonly start: number; readonly end: number } | null {
  return scanForClose({ lower: text.toLowerCase(), tagName, from: 0 })
}

/**
 * Parameters for {@link scanForClose}.
 *
 * @private
 */
interface ScanForCloseParams {
  readonly lower: string
  readonly tagName: string
  readonly from: number
}

/**
 * Find the next `</tagName>` at or after `from`, skipping prefix hits.
 *
 * A bare `indexOf('</' + tagName)` treats `</span>` as a match for `</s`,
 * so `<s>a <span>b</span> c</s>` closed the strikethrough on the span's
 * tag: the inner element vanished and the trailing copy escaped its
 * styling. Every whitelisted tag that prefixes another — `s`, `b`, `i`,
 * `u` against `span`/`strong`/`small`/`sub`/`sup`/`br`/`ins` — hit this.
 * The character after the name must therefore be `>` or whitespace.
 *
 * @private
 * @param params - Lowercased haystack, tag to close, and search offset
 * @returns Start/end offsets of the closing tag, or null when absent
 */
function scanForClose({
  lower,
  tagName,
  from,
}: ScanForCloseParams): { readonly start: number; readonly end: number } | null {
  // Driven by `unfold`, for the same reason `parseInline` is. Recursing on
  // each prefix miss costs one frame per `</tag` occurrence in the remainder
  // — not per nesting level — so copy like `'</should'.repeat(30000)` could
  // exhaust the stack during a build. Candidate offsets are produced
  // iteratively instead, leaving depth constant.
  const needle = `</${tagName}`
  const candidates = unfold<number, number>((offset) => {
    const at = lower.indexOf(needle, offset)
    if (at === -1) {
      return false
    }
    return [at, at + needle.length]
  }, from)
  const start = candidates.find((at) => CLOSE_TAG_BOUNDARY.test(lower.charAt(at + needle.length)))
  if (start === undefined) {
    return null
  }
  const gt = lower.indexOf('>', start)
  if (gt === -1) {
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
 * Parameters for {@link taggedElement}.
 *
 * @private
 */
interface TaggedElementParams {
  readonly tag: string
  readonly attrs: string
  readonly children: readonly InlineNode[]
}

/**
 * Build an element node from a whitelisted tag and its attributes.
 *
 * @private
 * @param params - Tag name, raw attribute text, and parsed contents
 * @returns Element node
 */
function taggedElement({ tag, attrs, children }: TaggedElementParams): InlineNode {
  const parsed = parseAttrs(attrs)
  return { kind: 'element', tag, className: parsed.className, title: parsed.title, children }
}

/**
 * Parameters for {@link anchorNodes}.
 *
 * @private
 */
interface AnchorNodesParams {
  readonly attrs: string
  readonly inner: string
  readonly inLink: boolean
}

/**
 * Nodes for an `<a>` element — validated through {@link safeUrl}, and
 * unwrapped to its text when the destination is rejected, missing, or
 * would nest one anchor inside another.
 *
 * @private
 * @param params - Raw attribute text, raw contents, and link depth
 * @returns Link node, or the bare contents
 */
function anchorNodes({ attrs, inner, inLink }: AnchorNodesParams): readonly InlineNode[] {
  const { href } = parseAttrs(attrs)
  if (href === undefined || inLink) {
    return parseInline({ input: inner, inLink })
  }
  const safe = safeUrl(href)
  if (safe === null) {
    return parseInline({ input: inner, inLink })
  }
  const children = parseInline({ input: inner, inLink: true })
  return linkOrChildren({ href: safe, children })
}

/**
 * Parameters for {@link linkNodes}.
 *
 * @private
 */
interface LinkNodesParams {
  readonly text: string
  readonly href: string
  readonly inLink: boolean
}

/**
 * Nodes for a markdown link, falling back to bare text when the
 * destination fails validation or the link would nest inside another.
 *
 * @private
 * @param params - Link label, raw destination, and link depth
 * @returns Link node, or the parsed label
 */
function linkNodes({ text, href, inLink }: LinkNodesParams): readonly InlineNode[] {
  const safe = safeUrl(href)
  if (safe === null || inLink) {
    return parseInline({ input: text, inLink })
  }
  return linkOrChildren({ href: safe, children: parseInline({ input: text, inLink: true }) })
}

/**
 * Parameters for {@link linkOrChildren}.
 *
 * @private
 */
interface LinkOrChildrenParams {
  readonly href: string
  readonly children: readonly InlineNode[]
}

/**
 * Wrap contents in a link, dropping the link when it has no contents.
 *
 * An empty label — `[](/x)` or `<a href="/x"></a>` — would render an
 * anchor with no accessible name, which screen readers announce as a bare
 * "link" and which fails WCAG 2.4.4.
 *
 * @private
 * @param params - Validated destination and parsed contents
 * @returns A single link node, or nothing
 */
function linkOrChildren({ href, children }: LinkOrChildrenParams): readonly InlineNode[] {
  if (children.length === 0) {
    return []
  }
  return [{ kind: 'link', href, children }]
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
 * Build a highlight node — a tinted `<mark>`, matching what `==` means
 * in Obsidian, Typora, and markdown-it-mark.
 *
 * @private
 * @param children - Parsed contents
 * @returns Mark element node
 */
function markNode(children: readonly InlineNode[]): InlineNode {
  return { kind: 'element', tag: 'mark', className: MARK_CLASS, children }
}

/**
 * Parameters for {@link element}.
 *
 * @private
 */
interface ElementParams {
  readonly tag: string
  readonly children: readonly InlineNode[]
}

/**
 * Build a plain element node with no attributes.
 *
 * @private
 * @param params - Element tag and parsed contents
 * @returns Element node
 */
function element({ tag, children }: ElementParams): InlineNode {
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
