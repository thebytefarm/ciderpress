import type React from 'react'

/**
 * SVG lock icon for authentication badges.
 *
 * @returns React element with lock SVG
 */
export function LockIcon(): React.ReactElement {
  return (
    <svg
      className="cp-oas-security__lock"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

/**
 * SVG chevron icon for expandable sections.
 *
 * @param props - Props with an optional className to apply to the SVG
 * @returns React element with chevron SVG
 */
export function ChevronIcon({ className }: { readonly className?: string }): React.ReactElement {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
