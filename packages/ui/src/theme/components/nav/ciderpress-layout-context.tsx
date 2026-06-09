import { createContext, useContext } from 'react'
import type React from 'react'

/**
 * State shape for the ciderpress doc-layout drawer controls.
 *
 * Shared between `<CiderpressDocLayout />` (the owner) and
 * `<CiderpressDocsBar />` (the consumer that toggles the sidebar
 * drawer open/closed on narrow viewports).
 */
export interface CiderpressLayoutContextValue {
  readonly isSidebarOpen: boolean
  readonly setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
  readonly isOutlineOpen: boolean
  readonly setIsOutlineOpen: React.Dispatch<React.SetStateAction<boolean>>
}

/**
 * Empty default setter — used only when the context is read outside
 * a provider, which happens on home / blank pages where the doc
 * layout isn't mounted.
 *
 * @private
 */
function noop(): void {
  // intentional no-op
}

const defaultValue: CiderpressLayoutContextValue = {
  isSidebarOpen: false,
  setIsSidebarOpen: noop,
  isOutlineOpen: false,
  setIsOutlineOpen: noop,
}

/**
 * @internal
 */
export const CiderpressLayoutContext = createContext<CiderpressLayoutContextValue>(defaultValue)

/**
 * Read the shared doc-layout drawer state. Returns no-op setters when
 * called outside a `<CiderpressDocLayout />` (e.g. on home pages).
 *
 * @returns Sidebar/outline open state and their setters.
 */
export function useCiderpressLayout(): CiderpressLayoutContextValue {
  return useContext(CiderpressLayoutContext)
}
