import { LlmsCopyButton } from '@rspress/core/theme'
import type React from 'react'
import { useCallback } from 'react'

export interface CopyMarkdownButtonProps {
  /**
   * Markdown content to copy to the clipboard.
   */
  readonly markdown: string
}

/**
 * Copy Markdown button that overrides Rspress's default copy behavior.
 *
 * Uses the native Clipboard API to copy pre-generated markdown content
 * instead of the raw MDX source.
 *
 * @param props - Props with the markdown string to copy to the clipboard
 * @returns React element with the copy button
 */
export function CopyMarkdownButton({
  markdown,
}: CopyMarkdownButtonProps): React.ReactElement | null {
  if (import.meta.env.SSG_MD) {
    return null
  }

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      return navigator.clipboard.writeText(markdown).catch(() => null)
    },
    [markdown]
  )

  return (
    <div className="cp-oas-copy-markdown">
      <LlmsCopyButton text="Copy Markdown" onClick={handleClick} />
    </div>
  )
}
