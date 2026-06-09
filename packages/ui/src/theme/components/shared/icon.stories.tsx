import type { Story } from '@ladle/react'

import { Icon } from './icon'

const meta = {
  title: 'Icons / Icon',
}

export default meta

/**
 * Default — Iconify icon at default size (inherits text color via
 * `currentColor`).
 *
 * @returns Single icon
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Default: Story = () => (
  <div style={{ fontSize: 32 }}>
    <Icon icon="pixelarticons:sparkles" />
  </div>
)

/**
 * One icon per registered Iconify library so reviewers can verify each
 * collection loaded.
 *
 * @returns Grid of icons across libraries
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Libraries: Story = () => {
  const samples = [
    { id: 'pixelarticons:flag', label: 'pixelarticons' },
    { id: 'devicon:typescript', label: 'devicon' },
    { id: 'mdi:database', label: 'mdi' },
    { id: 'simple-icons:vercel', label: 'simple-icons' },
    { id: 'skill-icons:rust', label: 'skill-icons' },
    { id: 'catppuccin:typescript', label: 'catppuccin' },
    { id: 'logos:github-icon', label: 'logos' },
    { id: 'vscode-icons:file-type-typescript', label: 'vscode-icons' },
    { id: 'material-icon-theme:typescript', label: 'material-icon-theme' },
  ]
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
      }}
    >
      {samples.map((s) => (
        <div
          key={s.id}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            padding: 12,
            border: '1px solid var(--cp-c-border)',
            borderRadius: 8,
            background: 'var(--cp-c-bg-soft)',
            fontFamily: 'ui-monospace, monospace',
            fontSize: 11,
          }}
        >
          <div style={{ fontSize: 28 }}>
            <Icon icon={s.id} />
          </div>
          <code style={{ color: 'var(--cp-c-text-3)' }}>{s.label}</code>
          <code style={{ color: 'var(--cp-c-text-2)' }}>{s.id}</code>
        </div>
      ))}
    </div>
  )
}

/**
 * Explicit size — width/height props bypass the inherited font-size.
 *
 * @returns Three icons at 16/32/64px
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Sizes: Story = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
    <Icon icon="pixelarticons:sparkles" width={16} height={16} />
    <Icon icon="pixelarticons:sparkles" width={32} height={32} />
    <Icon icon="pixelarticons:sparkles" width={64} height={64} />
  </div>
)
