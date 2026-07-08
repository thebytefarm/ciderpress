import { isPlainObject, isString } from 'massaman/predicate'

import type { Result, Template, TemplateError, TemplateErrorType, TemplateVar } from './types.ts'

const TYPE_PATTERN = /^[a-z0-9-]+$/
const ALLOWED_FIELDS = new Set(['label', 'hint', 'group', 'vars'])

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
 * frontmatter carries only `label`/`hint`/`group`/`vars`, and the body is
 * non-empty. `{{ }}` markers in the body are never rejected — declared `vars`
 * name the fillable ones, and any undeclared marker passes through as plain
 * text.
 *
 * @example
 * ```ts
 * const [error, template] = buildTemplate({
 *   type: 'adr',
 *   data: {
 *     label: 'ADR',
 *     hint: 'Architecture decision record',
 *     vars: [{ id: 'decision', description: 'The choice being made' }],
 *   },
 *   content: '# {{title}}\n\n## Decision\n{{ decision }}\n',
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
        `Unknown frontmatter field "${unknownField}" in template "${type}" (allowed: label, hint, group, vars)`
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

  const [varsError, vars] = readVars({ type, value: data.vars })
  if (varsError) {
    return [varsError, null]
  }

  if (content.trim().length === 0) {
    return [templateError('empty_body', `Template "${type}" has an empty body`), null]
  }

  const group = frontmatterGroup ?? input.group
  const base = { type, label, hint, body: content, extension }
  if (vars === undefined && group === undefined) {
    return [null, base]
  }
  if (vars === undefined) {
    return [null, { ...base, group }]
  }
  if (group === undefined) {
    return [null, { ...base, vars }]
  }
  return [null, { ...base, vars, group }]
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
 * Read and validate the optional `vars` frontmatter field: absent yields
 * `undefined`, otherwise it must be an array of entries each carrying a
 * non-empty string `id` plus optional string `title`/`description`.
 *
 * @private
 * @param input - The template type and the raw `vars` value
 * @returns A Result tuple: the parsed vars or `undefined`, or an `invalid_vars` error
 */
function readVars(input: {
  readonly type: string
  readonly value: unknown
}): Result<readonly TemplateVar[] | undefined, TemplateError> {
  const { type, value } = input
  if (value === undefined) {
    return [null, undefined]
  }
  if (!Array.isArray(value)) {
    return [
      templateError('invalid_vars', `Template "${type}" has an invalid "vars" (must be a list)`),
      null,
    ]
  }
  return value.reduce<Result<readonly TemplateVar[], TemplateError>>(
    (acc, entry, index) => {
      const [accError, accVars] = acc
      if (accError) {
        return acc
      }
      const [entryError, parsed] = readVarEntry({ type, entry, index })
      if (entryError) {
        return [entryError, null]
      }
      return [null, [...accVars, parsed]]
    },
    [null, []]
  )
}

/**
 * Validate a single `vars` entry into a {@link TemplateVar}.
 *
 * @private
 * @param input - The template type, the raw entry, and its list index
 * @returns A Result tuple: the parsed var, or an `invalid_vars` error
 */
function readVarEntry(input: {
  readonly type: string
  readonly entry: unknown
  readonly index: number
}): Result<TemplateVar, TemplateError> {
  const { type, entry, index } = input

  if (!isPlainObject(entry)) {
    return [invalidVar({ type, index, detail: 'each var must be an object with an "id"' }), null]
  }
  if (!isString(entry.id) || entry.id.trim().length === 0) {
    return [
      invalidVar({ type, index, detail: '"id" is required and must be a non-empty string' }),
      null,
    ]
  }
  if (entry.title !== undefined && !isString(entry.title)) {
    return [invalidVar({ type, index, detail: '"title" must be a string when set' }), null]
  }
  if (entry.description !== undefined && !isString(entry.description)) {
    return [invalidVar({ type, index, detail: '"description" must be a string when set' }), null]
  }

  const id = entry.id.trim()
  if (isString(entry.title) && isString(entry.description)) {
    return [null, { id, title: entry.title.trim(), description: entry.description.trim() }]
  }
  if (isString(entry.title)) {
    return [null, { id, title: entry.title.trim() }]
  }
  if (isString(entry.description)) {
    return [null, { id, description: entry.description.trim() }]
  }
  return [null, { id }]
}

/**
 * Construct an `invalid_vars` {@link TemplateError} for a single bad entry.
 *
 * @private
 * @param input - The template type, the entry index, and the failure detail
 * @returns A `TemplateError` describing the malformed var
 */
function invalidVar(input: {
  readonly type: string
  readonly index: number
  readonly detail: string
}): TemplateError {
  return templateError(
    'invalid_vars',
    `Template "${input.type}" has an invalid var at index ${input.index}: ${input.detail}`
  )
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
