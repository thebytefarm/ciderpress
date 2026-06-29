import type React from 'react'

interface CustomSplitVisualProps {
  readonly code: string
  readonly language?: string
}

/**
 * Custom Split visual — renders a user-supplied code snippet inside the
 * same `<pre>` shell as the default `ConfigPreview`. Language hint is
 * surfaced as a `data-language` attribute so themes can hook into it
 * for syntax-highlighter overlays. No client-side highlighting is
 * performed in the framework (keeps the bundle slim); the rendered
 * `<pre>` matches the default surface so themes that style the
 * default block also style the custom one.
 *
 * @param props - Code snippet + optional language hint
 * @returns Pre-formatted code block
 */
export function CustomSplitVisual(props: CustomSplitVisualProps): React.ReactElement {
  return (
    <pre data-language={props.language ?? 'ts'} className="cp-split__code">
      {props.code}
    </pre>
  )
}
