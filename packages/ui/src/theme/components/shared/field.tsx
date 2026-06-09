import { match, P } from 'massaman/match'
import type React from 'react'
import { useState } from 'react'

import { Icon } from './icon'

export interface FieldProps {
  /**
   * Field name, rendered in monospace bold.
   */
  readonly name: string
  /**
   * Type annotation shown as a pill badge (e.g. "string", "User[]").
   */
  readonly type?: string
  /**
   * When true, shows a "required" badge. When false or omitted, shows "optional".
   * Ignored when `deprecated` is true.
   */
  readonly required?: boolean
  /**
   * When true, shows a "deprecated" badge and strikes through the name.
   * Overrides the required/optional badge.
   */
  readonly deprecated?: boolean
  /**
   * Default value displayed below the header row.
   */
  readonly defaultValue?: string
  /**
   * Description text and optional nested FieldGroup.
   */
  readonly children: React.ReactNode
}

/**
 * Individual field documentation block displaying a parameter name,
 * type badge, required/optional/deprecated badges, default value,
 * and description body.
 *
 * @param props - Field configuration and description children
 * @returns React element for a single documented field
 */
export function Field({
  name,
  type,
  required,
  deprecated,
  defaultValue,
  children,
}: FieldProps): React.ReactElement {
  const nameClass = match(deprecated)
    .with(true, () => 'cp-field__name cp-field__name--deprecated')
    .otherwise(() => 'cp-field__name')

  const typeEl = match(type)
    .with(P.nonNullable, (t) => <span className="cp-field__type">{t}</span>)
    .otherwise(() => null)

  const badgeEl = match(deprecated)
    .with(true, () => (
      <span className="cp-field__badge cp-field__badge--deprecated">deprecated</span>
    ))
    .otherwise(() =>
      match(required)
        .with(true, () => (
          <span className="cp-field__badge cp-field__badge--required">required</span>
        ))
        .otherwise(() => (
          <span className="cp-field__badge cp-field__badge--optional">optional</span>
        ))
    )

  const defaultEl = match(defaultValue)
    .with(P.nonNullable, (v) => (
      <div className="cp-field__default">
        Default: <code>{v}</code>
      </div>
    ))
    .otherwise(() => null)

  return (
    <div className="cp-field">
      <div className="cp-field__header">
        <span className={nameClass}>{name}</span>
        {typeEl}
        {badgeEl}
      </div>
      {defaultEl}
      <div className="cp-field__body">{children}</div>
    </div>
  )
}

export interface FieldGroupProps {
  /**
   * Group label displayed as a header or trigger text.
   */
  readonly title: string
  /**
   * When true, renders as a collapsible section with a toggle trigger.
   */
  readonly expandable?: boolean
  /**
   * Initial expanded state when `expandable` is true.
   */
  readonly defaultOpen?: boolean
  /**
   * Field children to display within the group.
   */
  readonly children: React.ReactNode
}

/**
 * Dual-purpose grouping wrapper for Field components.
 *
 * In top-level mode (default), renders a titled section with a bottom border.
 * In expandable mode, renders a collapsible panel with a click-to-toggle
 * trigger and chevron icon.
 *
 * @param props - Group configuration with title and optional expand behavior
 * @returns React element wrapping grouped fields
 */
export function FieldGroup({
  title,
  expandable = false,
  defaultOpen = false,
  children,
}: FieldGroupProps): React.ReactElement {
  return match(expandable)
    .with(true, () => (
      <ExpandableFieldGroup title={title} defaultOpen={defaultOpen}>
        {children}
      </ExpandableFieldGroup>
    ))
    .otherwise(() => (
      <div className="cp-field-group">
        <div className="cp-field-group__title">{title}</div>
        {children}
      </div>
    ))
}

const DATA_OPEN = { 'data-open': '' } as const
const DATA_CLOSED = {} as const

interface ExpandableFieldGroupInternalProps {
  readonly title: string
  readonly defaultOpen: boolean
  readonly children: React.ReactNode
}

/**
 * Internal expandable variant of FieldGroup with toggle state.
 *
 * @private
 * @param props - Title, default open state, and children
 * @returns React element with collapsible panel
 */
function ExpandableFieldGroup({
  title,
  defaultOpen,
  children,
}: ExpandableFieldGroupInternalProps): React.ReactElement {
  const [open, setOpen] = useState(defaultOpen)

  const dataAttrs = match(open)
    .with(true, () => DATA_OPEN)
    .otherwise(() => DATA_CLOSED)

  return (
    <div className="cp-field-group--expandable" {...dataAttrs}>
      <button
        type="button"
        className="cp-field-group__trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="cp-field-group__chevron">
          <Icon icon="pixelarticons:chevron-right" />
        </span>
        {title}
      </button>
      <div className="cp-field-group__panel">{children}</div>
    </div>
  )
}
