/**
 * Status registry — the semantic layer over badges.
 *
 * A {@link Status} is a named, documented badge preset (title + meaning +
 * color). Pages reference one by id (`status: alpha`) instead of respelling
 * text/color/tooltip everywhere. This module ships the built-in defaults
 * ({@link DEFAULT_STATUSES}), merges user overrides ({@link resolveStatuses}),
 * and resolves a status reference into badge chips ({@link resolveStatusBadges}).
 */

import { isString } from 'massaman/predicate'

import type { BadgeConfig, Status } from './types.ts'

/**
 * Built-in status registry — common software-maturity statuses. Uses
 * theme-aware `variant`s so chips adapt to dark/light and every theme.
 * User `statuses` entries are merged over these by `id`.
 */
export const DEFAULT_STATUSES: readonly Status[] = [
  {
    id: 'alpha',
    title: 'Alpha',
    description: 'Early and unstable — APIs may change or break without notice.',
    variant: 'warning',
  },
  {
    id: 'beta',
    title: 'Beta',
    description: 'Feature-complete but still stabilizing; minor changes possible.',
    variant: 'info',
  },
  {
    id: 'wip',
    title: 'WIP',
    description: 'Work in progress — incomplete and subject to change.',
    variant: 'warning',
  },
  {
    id: 'experimental',
    title: 'Experimental',
    description: 'Experimental — may change or be removed at any time.',
    variant: 'warning',
  },
  {
    id: 'new',
    title: 'New',
    description: 'Recently added.',
    variant: 'success',
  },
  {
    id: 'stable',
    title: 'Stable',
    description: 'Stable and safe for production use.',
    variant: 'success',
  },
  {
    id: 'deprecated',
    title: 'Deprecated',
    description: 'Deprecated — scheduled for removal; migrate away.',
    variant: 'danger',
  },
  {
    id: 'internal',
    title: 'Internal',
    description: 'Internal — not part of the public API.',
    variant: 'neutral',
  },
  {
    id: 'planned',
    title: 'Planned',
    description: 'Planned — not yet available.',
    variant: 'neutral',
  },
]

/**
 * Merge user-defined statuses over the built-in defaults by `id`. Matching
 * ids override the default; new ids extend the registry.
 *
 * @param userStatuses - Statuses declared in `config.statuses`
 * @returns The effective registry (defaults + user overrides)
 */
export function resolveStatuses(userStatuses: readonly Status[] | undefined): readonly Status[] {
  const entries = [...DEFAULT_STATUSES, ...(userStatuses ?? [])].map((s) => [s.id, s] as const)
  return [...new Map(entries).values()]
}

/**
 * Resolve status id reference(s) into badge chips using a registry.
 * Unknown ids are skipped.
 *
 * @param ids - A status id, a list of ids, or unvalidated frontmatter
 * @param registry - The effective status registry
 * @returns Badge chips for the resolved statuses (empty when none resolve)
 */
export function resolveStatusBadges(
  ids: unknown,
  registry: readonly Status[]
): readonly BadgeConfig[] {
  return normalizeIds(ids).flatMap((id) => {
    const status = registry.find((s) => s.id === id)
    if (status === undefined) {
      return []
    }
    return [statusToBadge(status)]
  })
}

/**
 * Convert a status into its badge chip: title → text, description →
 * tooltip, color/variant → chip color.
 *
 * @param status - The status to render
 * @returns The badge config for the status
 */
export function statusToBadge(status: Status): BadgeConfig {
  return {
    text: status.title,
    tooltip: status.description,
    ...colorField(status),
  }
}

/**
 * Build the chip color field from a status — `color` wins over `variant`,
 * and either may be omitted.
 *
 * @private
 * @param status - The status to read color from
 * @returns `{ color }`, `{ variant }`, or an empty object
 */
function colorField(status: Status): Pick<BadgeConfig, 'color' | 'variant'> {
  if (status.color !== undefined) {
    return { color: status.color }
  }
  if (status.variant !== undefined) {
    return { variant: status.variant }
  }
  return {}
}

/**
 * Normalize a status reference into a clean list of ids, tolerating a
 * single string, an array, or unvalidated frontmatter values.
 *
 * @private
 * @param ids - Raw status reference
 * @returns Trimmed, non-empty status ids
 */
function normalizeIds(ids: unknown): readonly string[] {
  if (isString(ids)) {
    return trimmed(ids)
  }
  if (Array.isArray(ids)) {
    return ids.flatMap(idFromUnknown)
  }
  return []
}

/**
 * Normalize one array element into zero or one id, ignoring non-strings.
 *
 * @private
 * @param id - Raw array element
 * @returns A single trimmed id, or empty when not a usable string
 */
function idFromUnknown(id: unknown): readonly string[] {
  if (isString(id)) {
    return trimmed(id)
  }
  return []
}

/**
 * Trim a string id, returning a single-element list or empty when blank.
 *
 * @private
 * @param id - Raw id string
 * @returns `[id]` when non-blank, otherwise `[]`
 */
function trimmed(id: string): readonly string[] {
  const value = id.trim()
  if (value.length === 0) {
    return []
  }
  return [value]
}
