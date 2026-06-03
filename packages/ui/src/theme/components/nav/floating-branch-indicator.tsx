import type React from 'react'

import './floating-branch-indicator.css'
import { Icon } from '../shared/icon.tsx'

declare const __CIDERPRESS_GIT_BRANCH__: string | undefined

/**
 * Floating git-branch indicator pinned to the bottom-right corner of the
 * viewport. Collapsed: a small circular icon. On hover: expands to reveal
 * the branch name. Click anywhere on the pill opens the branch on GitHub.
 *
 * Hidden when on default branches (`main` / `master`) and when the
 * build-time branch global is undefined.
 *
 * @returns React element or null when hidden
 */
export function FloatingBranchIndicator(): React.ReactElement | null {
  const branch = resolveBranch()

  if (!branch || branch === 'main' || branch === 'master') {
    return null
  }

  return (
    <a
      className="cp-floating-branch"
      href={`https://github.com/thebytefarm/ciderpress/tree/${branch}`}
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
