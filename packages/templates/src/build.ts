import { isString } from 'massaman/predicate'

import type { Result, Template, TemplateError, TemplateErrorType } from './types.ts'

const TYPE_PATTERN = /^[a-z0-9-]+$/
const PLACEHOLDER_PATTERN = /\{\{\s*([^}]+?)\s*\}\}/g
const ALLOWED_FIELDS = new Set(['label', 'hint', 'group'])
const ALLOWED_PLACEHOLDERS = new Set(['title'])

/**
 * Input for {@link buildTemplate}: a parsed template file split into its
 * frontmatter (`data`), stripped `content`, derived `type`, and `extension`.
 */
export interface BuildTemplateInput {
  readonly type: string
  readonly data: Record<string, unknown>
  readonly content: string
  readonly extension: '.md' | '.mdx'
  /**
   * Group derived from the template's location (e.g. its sub-directory). Used
   * when the frontmatter omits an explicit `group`; a frontmatter `group`
   * always wins.
   */
  readonly group?: string
}

/**
 * Validate a parsed template file and build a {@link Template}.
 *
 * Enforces the "simple prebuild markdown" contract: `type` is a kebab slug,
 * frontmatter carries only `label`/`hint`, the body is non-empty, and the only
 * supported interpolation is `{{title}}`.
 *
 * @example
 * ```ts
 * const [error, template] = buildTemplate({
 *   type: 'adr',
 *   data: { label: 'ADR', hint: 'Architecture decision record' },
 *   content: '# {{title}}\n\n## Context\n',
 *   extension: '.md',
 * })
 * ```
 *
 * @param input - Parsed template file parts (type, frontmatter, content, extension)
 * @returns A Result tuple: the validated template, or a `TemplateError`
 */
export function buildTemplate(input: BuildTemplateInput): Result<Template, TemplateError> {
  const { type, data, content, extension } = input

  if (!isValidSlug(type)) {
    return [
      templateError(
        'invalid_type',
        `Template type "${type}" must be a kebab-case slug (lowercase letters, digits, single hyphens)`
      ),
      null,
    ]
  }

  const unknownField = Object.keys(data).find((key) => !ALLOWED_FIELDS.has(key))
  if (unknownField !== undefined) {
    return [
      templateError(
        'unknown_field',
        `Unknown frontmatter field "${unknownField}" in template "${type}" (allowed: label, hint, group)`
      ),
      null,
    ]
  }

  const [labelError, label] = readStringField({ type, field: 'label', value: data.label })
  if (labelError) {
    return [labelError, null]
  }

  const [hintError, hint] = readStringField({ type, field: 'hint', value: data.hint })
  if (hintError) {
    return [hintError, null]
  }

  const [groupError, frontmatterGroup] = readOptionalGroup({ type, value: data.group })
  if (groupError) {
    return [groupError, null]
  }

  if (content.trim().length === 0) {
    return [templateError('empty_body', `Template "${type}" has an empty body`), null]
  }

  const placeholderError = findUnknownPlaceholder({ type, content })
  if (placeholderError) {
    return [placeholderError, null]
  }

  const group = frontmatterGroup ?? input.group
  if (group === undefined) {
    return [null, { type, label, hint, body: content, extension }]
  }
  return [null, { type, label, hint, body: content, extension, group }]
}

/**
 * Check whether a string is a valid kebab-case slug: lowercase letters, digits,
 * and single interior hyphens only. Uses a flat pattern plus edge checks to
 * avoid a backtracking-prone nested-quantifier regex.
 *
 * @private
 * @param type - The candidate type string
 * @returns True when the type is a valid slug
 */
function isValidSlug(type: string): boolean {
  if (!TYPE_PATTERN.test(type)) {
    return false
  }
  if (type.startsWith('-') || type.endsWith('-')) {
    return false
  }
  return !type.includes('--')
}

/**
 * Read a required non-empty string frontmatter field.
 *
 * @private
 * @param input - The template type, field name, and raw value
 * @returns A Result tuple: the trimmed-valid string, or a `missing_field` error
 */
function readStringField(input: {
  readonly type: string
  readonly field: string
  readonly value: unknown
}): Result<string, TemplateError> {
  const { type, field, value } = input
  if (!isString(value) || value.trim().length === 0) {
    return [
      templateError(
        'missing_field',
        `Template "${type}" is missing required "${field}" (must be a non-empty string)`
      ),
      null,
    ]
  }
  return [null, value.trim()]
}

/**
 * Read the optional `group` frontmatter field: absent yields `undefined`, a
 * non-empty string is trimmed, and any other value is rejected.
 *
 * @private
 * @param input - The template type and the raw `group` value
 * @returns A Result tuple: the trimmed group or `undefined`, or an `invalid_group` error
 */
function readOptionalGroup(input: {
  readonly type: string
  readonly value: unknown
}): Result<string | undefined, TemplateError> {
  const { type, value } = input
  if (value === undefined) {
    return [null, undefined]
  }
  if (!isString(value) || value.trim().length === 0) {
    return [
      templateError(
        'invalid_group',
        `Template "${type}" has an invalid "group" (must be a non-empty string when set)`
      ),
      null,
    ]
  }
  return [null, value.trim()]
}

/**
 * Scan a template body for any placeholder other than `{{title}}`.
 *
 * @private
 * @param input - The template type and its body content
 * @returns An `unknown_placeholder` error for the first stray token, else null
 */
function findUnknownPlaceholder(input: {
  readonly type: string
  readonly content: string
}): TemplateError | null {
  const { type, content } = input
  const unknown = [...content.matchAll(PLACEHOLDER_PATTERN)]
    .map((match) => (match[1] ?? '').trim())
    .find((name) => !ALLOWED_PLACEHOLDERS.has(name))
  if (unknown !== undefined) {
    return templateError(
      'unknown_placeholder',
      `Template "${type}" uses unknown placeholder "{{${unknown}}}" (only {{title}} is supported)`
    )
  }
  return null
}

/**
 * Construct a {@link TemplateError}.
 *
 * @private
 * @param type - The error category discriminant
 * @param message - Human-readable error message
 * @returns A `TemplateError`
 */
function templateError(type: TemplateErrorType, message: string): TemplateError {
  return { _tag: 'TemplateError', type, message }
}
