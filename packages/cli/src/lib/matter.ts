import type { Result } from '@ciderpress/config'
import { attempt } from 'massaman/control'
import { isPlainObject } from 'massaman/predicate'
import { parse } from 'yaml'

// Isolates a leading `---` fenced YAML block: group 1 is the raw frontmatter,
// group 2 is everything after the closing fence. The `s` flag lets `.` span
// newlines so multi-line bodies are captured whole.
const FRONTMATTER_PATTERN = /^---\r?\n(.*?)\r?\n---\r?\n?(.*)$/s

/**
 * Parsed markdown/MDX file, split into frontmatter and body. Field names mirror
 * gray-matter's surface (`data`, `content`, `matter`, `excerpt`) so this is a
 * near drop-in for existing gray-matter call sites.
 */
export interface MatterFile {
  readonly data: Record<string, unknown>
  readonly content: string
  readonly matter: string
  readonly excerpt: string
}

/**
 * Categories of frontmatter parse failure.
 */
export type MatterFileErrorType = 'missing_frontmatter' | 'invalid_yaml'

/**
 * A frontmatter parse failure. Distinct from any downstream validation error.
 */
export interface MatterFileError {
  readonly _tag: 'MatterFileError'
  readonly type: MatterFileErrorType
  readonly message: string
}

/**
 * Split a markdown/MDX source string into its frontmatter and body.
 *
 * The body (`content`) is always the text after the closing `---` fence, so
 * frontmatter is stripped by construction — identical behaviour for `.md` and
 * `.mdx`. Unlike gray-matter, this returns a `Result` tuple and never throws.
 *
 * @example
 * ```ts
 * const [error, file] = splitFrontmatter('---\nlabel: Guide\n---\n# {{title}}\n')
 * if (!error) {
 *   file.data // { label: 'Guide' }
 *   file.content // '# {{title}}\n'
 * }
 * ```
 *
 * @param source - Raw file contents, expected to begin with a `---` YAML block
 * @returns A Result tuple: the parsed `MatterFile`, or a `MatterFileError`
 */
export function splitFrontmatter(source: string): Result<MatterFile, MatterFileError> {
  const match = FRONTMATTER_PATTERN.exec(source)
  if (!match) {
    return [
      matterFileError(
        'missing_frontmatter',
        'No frontmatter found — the file must begin with a `---` fenced YAML block'
      ),
      null,
    ]
  }

  const rawMatter = match[1] ?? ''
  const content = match[2] ?? ''

  const parsed = attempt(() => parse(rawMatter))
  if (!parsed.ok) {
    return [
      matterFileError('invalid_yaml', `Failed to parse frontmatter YAML: ${parsed.error.message}`),
      null,
    ]
  }

  return [null, { data: toData(parsed.value), content, matter: rawMatter, excerpt: '' }]
}

/**
 * Coerce a parsed YAML value into a frontmatter record. Empty or scalar
 * frontmatter yields an empty object; downstream validation reports the
 * resulting missing fields.
 *
 * @private
 * @param value - The parsed YAML value
 * @returns A frontmatter record
 */
function toData(value: unknown): Record<string, unknown> {
  if (isPlainObject(value)) {
    return value
  }
  return {}
}

/**
 * Construct a {@link MatterFileError}.
 *
 * @private
 * @param type - The error category discriminant
 * @param message - Human-readable error message
 * @returns A `MatterFileError`
 */
function matterFileError(type: MatterFileErrorType, message: string): MatterFileError {
  return { _tag: 'MatterFileError', type, message }
}
