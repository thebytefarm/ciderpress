import path from 'node:path'

import { match } from 'massaman/match'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { mdxFromMarkdown } from 'mdast-util-mdx'
import { gfm } from 'micromark-extension-gfm'
import { mdxjs } from 'micromark-extension-mdxjs'

import type { PageData } from './types.ts'

/**
 * Regex matching markdown links: `[text](url)` or `[text](url "title")`.
 * Uses a negative lookbehind to exclude image links (prefixed with `!`).
 */
const LINK_RE = /(?<!!)(\[[^\]]*\]\()([^)\s]+)((?:\s+"[^"]*")?\))/g

interface SourceNode {
  readonly type: string
  readonly children?: readonly SourceNode[]
  readonly position?: {
    readonly start: { readonly offset?: number }
    readonly end: { readonly offset?: number }
  }
}

interface TextReplacement {
  readonly start: number
  readonly end: number
  readonly value: string
}

/**
 * Mapping from repo-relative source path to content-relative output path.
 */
export type SourceMap = ReadonlyMap<string, string>

/**
 * Build a mapping from repo-relative source paths to content-relative output paths.
 *
 * Used by the link rewriter to resolve relative links in source markdown files
 * to their correct output locations.
 *
 * @param params - Pages and repo root for computing relative paths
 * @returns Immutable map of source path to output path
 */
export function buildSourceMap(params: {
  readonly pages: readonly PageData[]
  readonly repoRoot: string
}): SourceMap {
  return new Map(
    params.pages.flatMap((page): readonly [string, string][] => {
      if (page.source === null || page.source === undefined) {
        return []
      }
      const relSource = path.relative(params.repoRoot, page.source)
      return [[relSource, page.outputPath]]
    })
  )
}

/**
 * Rewrite relative markdown links in content to match the output directory structure.
 *
 * Scans markdown for relative links to `.md`/`.mdx` files, resolves them against
 * the source file's location, looks up the target in the source map, and rewrites
 * the link to point to the correct output location.
 *
 * Links that cannot be mapped (external, absolute, anchor-only, or not in the
 * source map) are left unchanged.
 *
 * @param params - Content, source/output paths, and the source-to-output map
 * @returns Content with rewritten links
 */
export function rewriteLinks(params: {
  readonly content: string
  readonly sourcePath: string
  readonly outputPath: string
  readonly sourceMap: SourceMap
}): string {
  const codeRanges = collectCodeRanges({
    node: parseSource(params),
    content: params.content,
  })
  const withoutCode = replaceRanges({ content: params.content, replacements: codeRanges })
  const sourceDir = path.dirname(params.sourcePath)
  const outputDir = path.dirname(params.outputPath)
  const replacements = [...withoutCode.matchAll(LINK_RE)].flatMap(
    (link): readonly TextReplacement[] => {
      const [, prefix, url] = link
      const resolved = resolveLink({ url, sourceDir, outputDir, sourceMap: params.sourceMap })
      if (resolved === null) {
        return []
      }
      const start = link.index + prefix.length
      return [{ start, end: start + url.length, value: resolved }]
    }
  )

  return replaceRanges({ content: params.content, replacements })
}

/**
 * Parse GFM for both source formats and JSX/expressions only for MDX sources.
 *
 * @private
 * @param params - Source content and filename used to select the Markdown dialect.
 * @returns Parsed source tree with original offsets.
 */
function parseSource(params: {
  readonly content: string
  readonly sourcePath: string
}): SourceNode {
  // Match the sync frontmatter parser's leading YAML block, including its optional BOM.
  const metadata = params.content.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  const [frontmatter = ''] = metadata ?? []
  const content = frontmatter.replace(/[^\r\n]/g, ' ') + params.content.slice(frontmatter.length)
  const body = (() => {
    if (params.sourcePath.endsWith('.mdx')) {
      return fromMarkdown(content, {
        extensions: [gfm(), mdxjs()],
        mdastExtensions: [gfmFromMarkdown(), mdxFromMarkdown()],
      })
    }
    return fromMarkdown(content, {
      extensions: [gfm()],
      mdastExtensions: [gfmFromMarkdown()],
    })
  })()
  return {
    type: 'root',
    children: [
      fromMarkdown(frontmatter, {
        extensions: [gfm()],
        mdastExtensions: [gfmFromMarkdown()],
      }),
      body,
    ],
  }
}

/**
 * Collect code-node ranges in source order, masking each with equal-length whitespace.
 *
 * @private
 * @param params - Parsed Markdown node and original source.
 * @returns Non-overlapping replacements that hide code without shifting source offsets.
 */
function collectCodeRanges(params: {
  readonly node: SourceNode
  readonly content: string
}): readonly TextReplacement[] {
  const { node, content } = params
  if (node.type === 'code' || node.type === 'inlineCode') {
    const position = node.position
    if (position === undefined) {
      return []
    }
    const start = position.start.offset
    const end = position.end.offset
    if (start === undefined || end === undefined) {
      return []
    }
    return [{ start, end, value: content.slice(start, end).replace(/[^\r\n]/g, ' ') }]
  }
  const children = node.children ?? []
  return children.flatMap((child) => collectCodeRanges({ node: child, content }))
}

/**
 * Apply ordered source replacements without serializing or reformatting Markdown.
 *
 * @private
 * @param params - Original source and non-overlapping replacements in source order.
 * @returns Source with only the selected ranges replaced.
 */
function replaceRanges(params: {
  readonly content: string
  readonly replacements: readonly TextReplacement[]
}): string {
  const result = params.replacements.reduce(
    (acc, replacement) => ({
      output: acc.output + params.content.slice(acc.offset, replacement.start) + replacement.value,
      offset: replacement.end,
    }),
    { output: '', offset: 0 }
  )
  return result.output + params.content.slice(result.offset)
}

/**
 * Attempt to resolve a single link URL to its correct output-relative path.
 *
 * @private
 * @param params - Link resolution parameters
 * @param params.url - The URL to resolve
 * @param params.sourceDir - Directory of the source file
 * @param params.outputDir - Directory of the output file
 * @param params.sourceMap - Source-to-output path mapping
 * @returns The rewritten URL string, or null if the link should be left unchanged
 */
function resolveLink(params: {
  readonly url: string
  readonly sourceDir: string
  readonly outputDir: string
  readonly sourceMap: SourceMap
}): string | null {
  if (isNonRewritableUrl(params.url)) {
    return null
  }

  const { linkPath, fragment } = splitFragment(params.url)

  if (!linkPath.endsWith('.md') && !linkPath.endsWith('.mdx')) {
    return null
  }

  const resolvedSource = path.normalize(path.join(params.sourceDir, linkPath))

  const targetOutput = params.sourceMap.get(resolvedSource)
  if (targetOutput === undefined) {
    return null
  }

  const relativePath = path.relative(params.outputDir, targetOutput)

  const normalized = relativePath.split(path.sep).join('/')

  return `${normalized}${fragment}`
}

/**
 * Check whether a URL should be skipped by the link rewriter.
 *
 * @private
 * @param url - URL string to check
 * @returns True if the URL is absolute, protocol-based, or anchor-only
 */
function isNonRewritableUrl(url: string): boolean {
  return (
    url.startsWith('/') ||
    url.startsWith('#') ||
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('mailto:')
  )
}

/**
 * Split a URL into its path and fragment components.
 *
 * @private
 * @param url - URL string to split
 * @returns Object with linkPath and fragment (empty string if no fragment)
 */
function splitFragment(url: string): { readonly linkPath: string; readonly fragment: string } {
  const hashIdx = url.indexOf('#')
  return match(hashIdx !== -1)
    .with(true, () => ({
      linkPath: url.slice(0, hashIdx),
      fragment: url.slice(hashIdx),
    }))
    .otherwise(() => ({
      linkPath: url,
      fragment: '',
    }))
}
