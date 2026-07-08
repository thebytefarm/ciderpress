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
 * A fillable variable a template declares in its frontmatter under `vars`.
 *
 * Declared vars are the `{{ id }}` markers a `draft` fills — from `--var`
 * arguments or an interactive prompt — leaving any it can't resolve as the raw
 * marker for a human or agent to complete later. `title` and `description` are
 * surfaced as the prompt label and hint. Only `id` is required.
 */
export interface TemplateVar {
  /** The placeholder id: the token inside `{{ }}` (e.g. `decision`). */
  readonly id: string
  /** Human-readable label shown when prompting for this var. */
  readonly title?: string
  /** Guidance shown alongside the prompt describing what to fill in. */
  readonly description?: string
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
   * Fillable variables declared in the template's `vars` frontmatter. Absent
   * when the template declares none; undeclared `{{ }}` markers in the body are
   * always allowed and pass through as plain text.
   */
  readonly vars?: readonly TemplateVar[]
  /**
   * Output file extension used when scaffolding a document from this template.
   * Defaults to `.md`; `.mdx` routes the drafted file through the MDX pipeline.
   */
  readonly extension?: '.md' | '.mdx'
  /**
   * Optional group used to cluster the template in interactive pickers. Set
   * from a `group` frontmatter field or derived from the template's
   * sub-directory; absent for ungrouped and built-in templates.
   */
  readonly group?: string
}

/**
 * Categories of failure produced when validating a template definition.
 */
export type TemplateErrorType =
  | 'missing_field'
  | 'unknown_field'
  | 'invalid_type'
  | 'invalid_vars'
  | 'empty_body'
  | 'invalid_group'

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
