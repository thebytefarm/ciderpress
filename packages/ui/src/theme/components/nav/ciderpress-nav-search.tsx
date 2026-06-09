import type React from 'react'

import { Icon } from '../shared/icon.tsx'

import './ciderpress-nav-search.css'

/**
 * Search trigger button. Click dispatches a synthetic `Cmd+K` keyboard
 * event so Rspress's underlying search modal opens — same shortcut the
 * user can press globally. We don't reach into Rspress's search
 * internals; the keyboard handler is the public contract.
 *
 * @returns Search trigger button
 */
export function CiderpressNavSearch(): React.ReactElement {
  return (
    <button
      type="button"
      className="cp-nav-search"
      onClick={dispatchSearchHotkey}
      aria-label="Search docs"
    >
      <Icon icon="pixelarticons:search" width={16} height={16} className="cp-nav-search__icon" />
      <span className="cp-nav-search__label">Search</span>
      <kbd className="cp-nav-search__hotkey" aria-hidden="true">
        <span>⌘</span>
        <span>K</span>
      </kbd>
    </button>
  )
}

/**
 * Dispatch a synthetic `Cmd+K` (mac) or `Ctrl+K` (everything else)
 * `keydown` so Rspress's global search modal opens. Modifier choice is
 * driven off `navigator.platform`, which is the same heuristic
 * Rspress's own shortcut handler uses.
 *
 * @private
 */
function dispatchSearchHotkey(): void {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')
  const event = new KeyboardEvent('keydown', {
    key: 'k',
    code: 'KeyK',
    keyCode: 75,
    metaKey: isMac,
    ctrlKey: !isMac,
    bubbles: true,
    cancelable: true,
  })
  document.dispatchEvent(event)
}

export { CiderpressNavSearch as default }
