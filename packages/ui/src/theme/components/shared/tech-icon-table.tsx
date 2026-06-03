import type React from 'react'

import { Icon } from './icon'

export interface TechIconEntry {
  readonly tag: string
  readonly icon: string
  readonly label: string
}

export interface TechIconTableProps {
  readonly entries: readonly TechIconEntry[]
}

const tableStyle: React.CSSProperties = {
  width: '100%',
}

const iconCellStyle: React.CSSProperties = {
  width: 48,
  textAlign: 'center' as const,
}

const iconWrapperStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  background: 'var(--cp-c-bg-icon)',
}

/**
 * Renders a table of technology icons with tag, label, and identifier columns.
 * Used in generated icon reference docs.
 *
 * @param props - Props with an array of tech icon entries to render
 * @returns React element with an icon reference table
 */
export function TechIconTable({ entries }: TechIconTableProps): React.ReactElement {
  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={iconCellStyle} />
          <th>Tag</th>
          <th>Label</th>
          <th>Identifier</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.tag}>
            <td style={iconCellStyle}>
              <div style={iconWrapperStyle}>
                <Icon icon={entry.icon} width={20} height={20} />
              </div>
            </td>
            <td>
              <code>{entry.tag}</code>
            </td>
            <td>{entry.label}</td>
            <td>
              <code>{entry.icon}</code>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
