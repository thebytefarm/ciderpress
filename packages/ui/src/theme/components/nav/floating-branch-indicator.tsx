import type { SiteConfig } from '@ciderpress/config'
import { match, P } from 'massaman/match'
import type React from 'react'

import { useCiderpress } from '../../hooks/use-ciderpress'

import './floating-branch-indicator.css'
import { Icon } from '../shared/icon.tsx'

declare const __CIDERPRESS_GIT_BRANCH__: string | undefined

/**
 * Floating git-branch indicator pinned to the bottom-right corner of the
 * viewport. Collapsed: a small circular icon. On hover: expands to reveal
 * the branch name. Click anywhere on the pill opens the branch on GitHub.
 *
 * Hidden when on default branches (`main` / `master`), when the
 * build-time branch global is undefined, or when `site.edit.repo` is
 * not configured.
 *
 * @returns React element or null when hidden
 */
export function FloatingBranchIndicator(): React.ReactElement | null {
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
      className="cp-floating-branch"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`Branch: ${branch}`}
    >
      <Icon
        icon="pixelarticons:git-branch"
        width={16}
        height={16}
        className="cp-floating-branch__icon"
      />
      <span className="cp-floating-branch__text">{branch}</span>
    </a>
  )
}

export { FloatingBranchIndicator as default }

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

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
 * Build a GitHub `/tree/<branch>` URL from the configured `site.edit.repo`.
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
 * Pull the configured edit-repo slug off the site config, expressed
 * with explicit null checks rather than optional chaining.
 *
 * @private
 * @param site - The ciderpress site config (may be undefined).
 * @returns The configured `edit.repo` value or `undefined`.
 */
function resolveRepo(site: SiteConfig | undefined): string | undefined {
  if (site === undefined) {
    return undefined
  }
  if (site.edit === undefined) {
    return undefined
  }
  return site.edit.repo
}
