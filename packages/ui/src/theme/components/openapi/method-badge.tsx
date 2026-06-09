import type React from 'react'

export interface MethodBadgeProps {
  /**
   * HTTP method name (get, post, put, patch, delete, etc.).
   */
  readonly method: string
}

/**
 * Colored badge for an HTTP method.
 *
 * Maps the method string to a BEM modifier class that applies
 * the corresponding `--cp-oas-*` color token.
 *
 * @param props - Props with the HTTP method name
 * @returns React element with a method badge span
 */
export function MethodBadge({ method }: MethodBadgeProps): React.ReactElement {
  const normalized = method.toLowerCase()
  return (
    <span className={`cp-oas-method-badge cp-oas-method-badge--${normalized}`}>{normalized}</span>
  )
}
