import { match, P } from 'massaman/match'
import type React from 'react'

/**
 * Ladle stub for `@rspress/core/theme`.
 *
 * Replaces the runtime code-block renderer and LLM-copy button with plain
 * fallbacks so stories that import them render without Rspress's build
 * pipeline.
 *
 * @private
 */

export interface CodeBlockRuntimeProps {
  readonly code: string
  readonly lang?: string
}

/**
 * Plain `<pre><code>` stand-in for Rspress's syntax-highlighted code block.
 *
 * @param props - Raw code string and optional language identifier
 * @returns Preformatted code element
 */
export function CodeBlockRuntime({ code, lang }: CodeBlockRuntimeProps): React.ReactElement {
  return match(lang)
    .with(P.nonNullable, (l) => (
      <pre className={`language-${l}`}>
        <code>{code}</code>
      </pre>
    ))
    .otherwise(() => (
      <pre>
        <code>{code}</code>
      </pre>
    ))
}

export interface LlmsCopyButtonProps {
  readonly children?: React.ReactNode
}

/**
 * Plain button stand-in for Rspress's LLM-copy button.
 *
 * @param props - Optional button label
 * @returns Button element
 */
export function LlmsCopyButton({ children }: LlmsCopyButtonProps): React.ReactElement {
  return <button type="button">{children ?? 'Copy'}</button>
}
