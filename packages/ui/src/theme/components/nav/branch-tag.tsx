import { match, P } from 'massaman/match'
import type React from 'react'

import type { CiderpressSiteBlock } from '../../hooks/use-ciderpress'
import { useCiderpress } from '../../hooks/use-ciderpress'

import './branch-tag.css'
import { Icon } from '../shared/icon.tsx'

declare const __CIDERPRESS_GIT_BRANCH__: string | undefined

/**
 * Git branch tag — pill-shaped badge rendered via the `beforeNavMenu`
 * layout slot. Hidden when on default branches (`main` or `master`) or
 * when no `editLink.repo` is configured. Uses the pixelarticons:git-branch
 * icon.
 *
 * @returns React element, or `null` when on a default branch / unconfigured.
 */
export function BranchTag(): React.ReactElement | null {
  const { site } = useCiderpress()
  const branch = resolveBranch()

  if (!branch || branch === 'main' || branch === 'master') {
    return null
  }

  const href = buildBranchHref({ repo: resolveRepo(site), branch })
  if (href === null) {
    return null
  }

  return (
    <a
      className="cp-branch-tag"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`Branch: ${branch}`}
    >
      <Icon icon="pixelarticons:git-branch" width={14} height={14} />
      <span className="cp-branch-tag__text">{branch}</span>
    </a>
  )
}

export { BranchTag as default }

/**
 * Resolves the current git branch name from the build-time global,
 * returning an empty string when undefined.
 *
 * @private
 * @returns Current git branch name or empty string
 */
function resolveBranch(): string {
  if (__CIDERPRESS_GIT_BRANCH__ !== undefined) {
    return __CIDERPRESS_GIT_BRANCH__
  }
  return ''
}

/**
 * Build a GitHub `/tree/<branch>` URL from the configured `editLink.repo`.
 *
 * Accepts either a full URL (used as-is) or an `org/repo` slug
 * (prefixed with `https://github.com/`). Returns `null` when `repo` is
 * missing so the caller can omit the component entirely.
 *
 * @private
 * @param params - The configured repo and the current branch.
 * @returns Fully-qualified URL string, or `null` when unconfigured.
 */
function buildBranchHref(params: {
  readonly repo: string | undefined
  readonly branch: string
}): string | null {
  return match(params.repo)
    .with(undefined, () => null)
    .with('', () => null)
    .with(P.string.startsWith('http'), (full) => `${full}/tree/${params.branch}`)
    .otherwise((slug) => `https://github.com/${slug}/tree/${params.branch}`)
}

/**
 * Pull the configured edit-repo slug off the serialised site block,
 * expressed with explicit null checks rather than optional chaining.
 *
 * @private
 * @param site - The runtime site block (may be undefined).
 * @returns The configured `edit.repo` value or `undefined`.
 */
function resolveRepo(site: CiderpressSiteBlock | undefined): string | undefined {
  if (site === undefined) {
    return undefined
  }
  if (site.edit === undefined) {
    return undefined
  }
  return site.edit.repo
}
