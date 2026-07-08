/**
 * Page badge helpers — the shared wire format for sidebar badges.
 *
 * Badges are declared in frontmatter, page/workspace `defaults`, or glob
 * rules ({@link BadgeRule}). The CLI normalizes them with
 * {@link normalizeBadgeInput} and encodes them into an Rspress sidebar
 * `tag` string via {@link encodeBadges}; the `@ciderpress/ui` theme decodes
 * that string with {@link decodeBadges} and renders the chips. Keeping both
 * ends in this one module makes the wire format a single source of truth.
 */

import { isString } from 'massaman/predicate'

import type { BadgeConfig, BadgeVariant } from './types.ts'

/**
 * Sentinel prefix marking a ciderpress-encoded badge `tag` string. Tags
 * without this prefix fall through to Rspress's native `Tag` rendering.
 */
export const BADGE_TAG_PREFIX = 'cp-badge::'

const BADGE_VARIANTS: ReadonlySet<BadgeVariant> = new Set([
  'info',
  'success',
  'warning',
  'danger',
  'neutral',
])

/**
 * Normalize a raw badge input into a flat list of {@link BadgeConfig}.
 *
 * Accepts the string shorthand, a single object, an array of either, or
 * unvalidated YAML from a file's frontmatter. Malformed entries (missing
 * text, unknown shapes) are dropped rather than throwing.
 *
 * @param input - Badge input from config `defaults` or file frontmatter
 * @returns Normalized badge list (empty when nothing valid is present)
 */
export function normalizeBadgeInput(input: unknown): readonly BadgeConfig[] {
  if (Array.isArray(input)) {
    return input.flatMap(normalizeOne)
  }
  return normalizeOne(input)
}

/**
 * Encode a normalized badge list into an Rspress sidebar `tag` string.
 *
 * @param badges - Normalized badges to encode
 * @returns Prefixed JSON tag string, or `undefined` when the list is empty
 */
export function encodeBadges(badges: readonly BadgeConfig[]): string | undefined {
  if (badges.length === 0) {
    return undefined
  }
  return `${BADGE_TAG_PREFIX}${JSON.stringify(badges)}`
}

/**
 * Decode a sidebar `tag` string produced by {@link encodeBadges}.
 *
 * @param tag - Raw `tag` value from a sidebar item
 * @returns Decoded badges, or `null` when `tag` is not ciderpress-encoded
 *   or fails to parse (caller should fall back to native rendering)
 */
export function decodeBadges(tag: string): readonly BadgeConfig[] | null {
  if (!tag.startsWith(BADGE_TAG_PREFIX)) {
    return null
  }
  const json = tag.slice(BADGE_TAG_PREFIX.length)
  const parsed = safeParse(json)
  if (!Array.isArray(parsed)) {
    return null
  }
  const badges = parsed.flatMap(normalizeOne)
  if (badges.length === 0) {
    return null
  }
  return badges
}

/**
 * Normalize a single badge value into zero or one {@link BadgeConfig}.
 *
 * @private
 * @param value - String shorthand, badge object, or malformed value
 * @returns Single-element list, or empty when the value is unusable
 */
function normalizeOne(value: unknown): readonly BadgeConfig[] {
  if (isString(value)) {
    const text = value.trim()
    if (text.length === 0) {
      return []
    }
    return [{ text }]
  }
  if (isBadgeObject(value)) {
    return [buildBadge(value)]
  }
  return []
}

/**
 * Build a clean {@link BadgeConfig} from a validated badge-shaped object,
 * keeping only recognized fields.
 *
 * @private
 * @param value - Object with a string `text` field
 * @returns Normalized badge config
 */
function buildBadge(value: BadgeShape): BadgeConfig {
  return {
    text: value.text.trim(),
    ...variantField(value.variant),
    ...stringField({ key: 'color', value: value.color }),
    ...stringField({ key: 'tooltip', value: value.tooltip }),
  }
}

/**
 * Build the optional `variant` field, omitted when the value is unknown.
 *
 * @private
 * @param value - Raw variant value
 * @returns `{ variant }` or an empty object
 */
function variantField(value: unknown): { readonly variant?: BadgeVariant } {
  const variant = normalizeVariant(value)
  if (variant === null) {
    return {}
  }
  return { variant }
}

/**
 * Build an optional string field, omitted when the value is not a string.
 *
 * @private
 * @param params - Field name and raw value
 * @returns Single-key object or an empty object
 */
function stringField(params: {
  readonly key: 'color' | 'tooltip'
  readonly value: unknown
}): Record<string, string> {
  const { key, value } = params
  if (isString(value)) {
    return { [key]: value }
  }
  return {}
}

/**
 * Coerce a raw variant value into a known {@link BadgeVariant}.
 *
 * @private
 * @param value - Raw variant from config or wire data
 * @returns A valid variant, or `null` to fall back to the default
 */
function normalizeVariant(value: unknown): BadgeVariant | null {
  if (isString(value) && BADGE_VARIANTS.has(value as BadgeVariant)) {
    return value as BadgeVariant
  }
  return null
}

/**
 * Shape of a badge object after the {@link isBadgeObject} guard.
 *
 * @private
 */
interface BadgeShape {
  readonly text: string
  readonly variant?: unknown
  readonly color?: unknown
  readonly tooltip?: unknown
}

/**
 * Type guard for a badge-shaped object with a non-empty string `text`.
 *
 * @private
 * @param value - Candidate value
 * @returns True when `value` is an object with a usable `text` field
 */
function isBadgeObject(value: unknown): value is BadgeShape {
  if (value === null || typeof value !== 'object') {
    return false
  }
  const text = (value as { readonly text?: unknown }).text
  return isString(text) && text.trim().length > 0
}

/**
 * Parse JSON, returning `null` instead of throwing on malformed input.
 *
 * @private
 * @param json - Candidate JSON string
 * @returns Parsed value, or `null` when parsing fails
 */
function safeParse(json: string): unknown {
  const [, value] = attemptParse(json)
  return value
}

/**
 * Wrap `JSON.parse` in a Result tuple so failures are values, not throws.
 *
 * @private
 * @param json - Candidate JSON string
 * @returns `[error, null]` on failure, `[null, value]` on success
 */
function attemptParse(json: string): readonly [Error, null] | readonly [null, unknown] {
  try {
    return [null, JSON.parse(json)]
  } catch (error) {
    if (error instanceof Error) {
      return [error, null]
    }
    return [new Error(String(error)), null]
  }
}
