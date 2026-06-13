/**
 * One row out of `TECH_ICONS`, with its key, iconify ID, and display label.
 */
export interface TechEntry {
  readonly key: string
  readonly icon: string
  readonly label: string
}

/**
 * A `// -- Category -- ` block from `tech-map.ts`, with all entries that
 * follow it up to the next category boundary.
 */
export interface Category {
  readonly name: string
  readonly entries: readonly TechEntry[]
}

/**
 * Parse `packages/ui/src/theme/icons/tech-map.ts` into structured
 * categories. The source is intentionally simple to keep this parser
 * regex-only; each category is introduced by a `// -- Name -- ` comment
 * and entries follow the `'key': { icon: '...', label: '...' }` pattern.
 * @param source - raw contents of `tech-map.ts`
 * @returns the parsed categories in declaration order
 */
export function parseTechMap(source: string): readonly Category[] {
  const lines = source.split('\n')

  const categoryBoundaries = lines
    .map((line, i) => ({ match: line.match(/\/\/\s*--\s*(.+?)\s*--/), index: i }))
    .filter((entry): entry is { match: RegExpMatchArray; index: number } => entry.match !== null)
    .map(({ match, index }) => ({ name: match[1], startIndex: index }))

  return categoryBoundaries.map((boundary, i) => {
    const endIndex = endIndexFor(categoryBoundaries, i, lines.length)
    const entries = lines
      .slice(boundary.startIndex + 1, endIndex)
      .map((line) =>
        line.match(/^\s*'?([^':\s]+)'?\s*:\s*\{\s*icon:\s*'([^']+)',\s*label:\s*'([^']+)'/)
      )
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => ({ key: m[1], icon: m[2], label: m[3] }))
    return { name: boundary.name, entries }
  })
}

/**
 * Resolve the end index of category `i` — either the start of the next
 * category or the end of the file.
 * @param boundaries - all parsed category boundaries
 * @param i - index of the current category
 * @param totalLines - the total number of lines in the source file
 * @returns the exclusive end line index for category `i`
 * @private
 */
function endIndexFor(
  boundaries: readonly { readonly startIndex: number }[],
  i: number,
  totalLines: number
): number {
  const next = boundaries[i + 1]
  if (next === undefined) {
    return totalLines
  }
  return next.startIndex
}

/**
 * Look up several categories by name. Missing names are silently dropped
 * — the caller is expected to know about its own naming.
 * @param categories - all parsed categories
 * @param names - the names to look up
 * @returns the categories that matched, in input order
 */
export function findCategories(
  categories: readonly Category[],
  names: readonly string[]
): readonly Category[] {
  return names.flatMap((name) => {
    const found = categories.find((c) => c.name === name)
    if (found === undefined) {
      return []
    }
    return [found]
  })
}

/**
 * Sum the total number of `TechEntry`s across a set of categories.
 * @param categories - the categories to sum
 * @returns the total entry count
 */
export function countEntries(categories: readonly Category[]): number {
  return categories.reduce((sum, c) => sum + c.entries.length, 0)
}
