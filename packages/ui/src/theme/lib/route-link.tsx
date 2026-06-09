import { Link } from '@rspress/core/runtime'
import type React from 'react'

/**
 * Props accepted by the {@link RouteLink} helper. Mirror `<a>` props but
 * narrow `href` to a required string (we route on it).
 */
export interface RouteLinkProps {
  /**
   * Destination URL. Internal paths (anything starting with `/` or `#`)
   * are routed through Rspress's `<Link>` so navigation stays SPA
   * (no full document load). Everything else is treated as external and
   * rendered as a plain anchor.
   */
  readonly href: string
  /**
   * Optional class applied to the rendered element.
   */
  readonly className?: string
  /**
   * Optional inline ARIA label.
   */
  readonly 'aria-label'?: string
  /**
   * Optional ARIA current marker (e.g. `'page'`).
   */
  readonly 'aria-current'?: React.AriaAttributes['aria-current']
  /**
   * Optional `role` attribute (e.g. `'menuitem'`).
   */
  readonly role?: string
  /**
   * Optional title attribute.
   */
  readonly title?: string
  /**
   * Optional click handler (closing dropdowns, etc.).
   */
  readonly onClick?: React.MouseEventHandler<HTMLElement>
  /**
   * Optional data-* attribute used by the nav menu measure layer.
   */
  readonly 'data-cp-menu-item'?: boolean | string
  /**
   * Rendered children.
   */
  readonly children: React.ReactNode
}

/**
 * Render an in-app link that prefers SPA navigation when the destination
 * is internal, falling back to a plain `<a>` for external URLs.
 *
 * Internal hrefs (starting with `/` or `#`) go through Rspress's
 * `Link` from `@rspress/core/runtime` — that's a thin wrapper over
 * `react-router-dom`'s `Link`, so the click is intercepted and routed
 * through history without a full page reload.
 *
 * External hrefs (`http://`, `https://`, `mailto:`, `tel:`, `data:`,
 * etc.) render as `<a target="_blank" rel="noopener noreferrer">` so
 * clicks open in a new tab and the document doesn't leak `window.opener`.
 *
 * @param props - Link props (href + presentational/ARIA attributes)
 * @returns React element (`<Link>` for internal, `<a>` for external)
 */
export function RouteLink(props: RouteLinkProps): React.ReactElement {
  const isInternal = isInternalHref(props.href)
  if (isInternal) {
    return (
      <Link
        to={props.href}
        className={props.className}
        aria-label={props['aria-label']}
        aria-current={props['aria-current']}
        role={props.role}
        title={props.title}
        onClick={props.onClick}
        data-cp-menu-item={props['data-cp-menu-item']}
      >
        {props.children}
      </Link>
    )
  }
  return (
    <a
      href={props.href}
      className={props.className}
      aria-label={props['aria-label']}
      aria-current={props['aria-current']}
      role={props.role}
      title={props.title}
      onClick={props.onClick}
      data-cp-menu-item={props['data-cp-menu-item']}
      target="_blank"
      rel="noopener noreferrer"
    >
      {props.children}
    </a>
  )
}

/**
 * Decide whether `href` points at an in-app route. Internal URLs are
 * absolute paths (`/foo`) or anchors (`#bar`). Everything else — full
 * URLs with a scheme, scheme-relative URLs, mailto, tel, etc. — is
 * treated as external.
 *
 * @private
 * @param href - Candidate destination
 * @returns `true` when `href` should be SPA-routed
 */
function isInternalHref(href: string): boolean {
  if (href.length === 0) {
    return false
  }
  if (href.startsWith('//')) {
    return false
  }
  if (href.startsWith('/')) {
    return true
  }
  if (href.startsWith('#')) {
    return true
  }
  return false
}
