import { match } from 'massaman/match'
import type React from 'react'
import { createElement } from 'react'

import type { InlineNode } from './rich-text-parse.ts'
import { parseRichText } from './rich-text-parse.ts'
import { RouteLink } from './route-link.tsx'

export { hasAccentMarker, toPlainText } from './rich-text-parse.ts'

/**
 * Render config copy as React nodes, applying an inline-only markdown
 * subset plus a whitelist of inline HTML.
 *
 * Supported: `**bold**`, `*italic*`, `` `code` ``, `==accent==`,
 * `[text](/href)`, `<br>`, and a whitelist of inline tags. Parsing and
 * sanitizing happen in `rich-text-parse`; this renders the resulting
 * nodes as React elements, so `dangerouslySetInnerHTML` is never
 * involved and unknown markup cannot execute.
 *
 * @param text - Raw string from config or frontmatter
 * @returns React nodes ready to render inline
 *
 * @example
 * renderRichText('Beautiful Docs, ==Zero Effort==')
 * renderRichText('Runs on `ciderpress dev` — see [the guide](/guides).')
 */
export function renderRichText(text: string): React.ReactNode {
  const nodes = parseRichText(text)
  if (nodes.length === 0) {
    return null
  }
  return renderNodes(nodes)
}

interface RichTextProps {
  /**
   * Raw copy to render.
   */
  readonly text: string
}

/**
 * Component form of {@link renderRichText}, for call sites that read
 * better as an element than a function call.
 *
 * @param props - Raw copy to render
 * @returns Rendered inline nodes
 */
export function RichText(props: RichTextProps): React.ReactElement {
  return <>{renderRichText(props.text)}</>
}

/**
 * Render parsed nodes to React, keyed by position.
 *
 * @private
 * @param nodes - Parsed inline nodes
 * @returns React nodes
 */
function renderNodes(nodes: readonly InlineNode[]): React.ReactNode {
  return nodes.map((node, index) => <RichNode key={index} node={node} />)
}

interface RichNodeProps {
  readonly node: InlineNode
}

/**
 * Render one parsed node.
 *
 * @private
 * @param props - The node to render
 * @returns React element
 */
function RichNode(props: RichNodeProps): React.ReactElement {
  return match(props.node)
    .with({ kind: 'text' }, (n) => <>{n.value}</>)
    .with({ kind: 'code' }, (n) => <code>{n.value}</code>)
    .with({ kind: 'break' }, () => <br />)
    .with({ kind: 'link' }, (n) => <RouteLink href={n.href}>{renderNodes(n.children)}</RouteLink>)
    .with({ kind: 'element' }, (n) =>
      createElement(n.tag, { className: n.className, title: n.title }, renderNodes(n.children))
    )
    .exhaustive()
}
