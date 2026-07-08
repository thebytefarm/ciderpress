/**
 * Result tuple for error handling without exceptions.
 *
 * Mirrors the repo-wide convention (see `.claude/rules/errors.md`). Defined
 * locally so this package stays dependency-free and does not couple to
 * `@ciderpress/config` for a shared alias.
 */
export type Result<T, E = Error> = readonly [E, null] | readonly [null, T]

/**
 * Built-in template type identifiers.
 */
export const TEMPLATE_TYPES = [
  'tutorial',
  'guide',
  'quickstart',
  'explanation',
  'reference',
  'standard',
  'troubleshooting',
  'runbook',
] as const

/**
 * A built-in template type identifier.
 */
export type TemplateType = (typeof TEMPLATE_TYPES)[number]

/**
 * Variables available for template rendering.
 * `title` is always required; additional custom variables are allowed.
 */
export interface TemplateVariables {
  readonly title: string
  readonly [key: string]: string
}

/**
 * A documentation template definition.
 */
export interface Template {
  readonly type: string
  readonly label: string
  readonly hint: string
  readonly body: string
  /**
   * Output file extension used when scaffolding a document from this template.
   * Defaults to `.md`; `.mdx` routes the drafted file through the MDX pipeline.
   */
  readonly extension?: '.md' | '.mdx'
}

/**
 * Categories of failure produced when validating a template definition.
 */
export type TemplateErrorType =
  | 'missing_field'
  | 'unknown_field'
  | 'invalid_type'
  | 'unknown_placeholder'
  | 'empty_body'

/**
 * A template validation failure. Distinct from a frontmatter parse failure
 * (which is a concern of the caller's markdown parser, not this package).
 */
export interface TemplateError {
  readonly _tag: 'TemplateError'
  readonly type: TemplateErrorType
  readonly message: string
}

/**
 * Options for extending an existing template.
 */
export interface ExtendTemplateOptions {
  readonly label?: string
  readonly hint?: string
  readonly body?: string | ((base: string) => string)
}

/**
 * An immutable registry of templates.
 */
export interface TemplateRegistry {
  readonly templates: ReadonlyMap<string, Template>
  readonly get: (type: string) => Template | undefined
  readonly has: (type: string) => boolean
  readonly list: () => readonly Template[]
  readonly types: () => readonly string[]
  readonly add: (template: Template) => TemplateRegistry
  readonly extend: (type: string, options: ExtendTemplateOptions) => TemplateRegistry
  readonly merge: (other: TemplateRegistry) => TemplateRegistry
}
