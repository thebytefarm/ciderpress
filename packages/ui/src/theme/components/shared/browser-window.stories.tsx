import type { Story } from '@ladle/react'

import {
  BrowserWindow,
  Command,
  IDEWindow,
  Line,
  Output,
  TerminalWindow,
} from './desktop-window.tsx'

const meta = {
  title: 'Windows',
}

export default meta

/**
 * BrowserWindow with a URL bar and inline body content.
 *
 * @returns Rendered browser chrome
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Browser: Story = () => (
  <BrowserWindow url="https://ciderpress.dev/guides/themes" tab={{ title: 'Ciderpress · Themes' }}>
    <div style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Theme palettes</h1>
      <p>Switch the palette in the toolbar above to preview the cascade.</p>
    </div>
  </BrowserWindow>
)

/**
 * BrowserWindow rendering an image as its body — common pattern in docs
 * for screenshots / hero captures.
 *
 * @returns Browser chrome wrapping an image
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const BrowserWithImage: Story = () => (
  <BrowserWindow
    url="https://ciderpress.dev"
    tab={{ title: 'Ciderpress' }}
    image="https://picsum.photos/seed/ciderpress/1200/600"
  />
)

/**
 * TerminalWindow with composed command/output children including coloured
 * inline `<Line>` runs.
 *
 * @returns Terminal chrome
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Terminal: Story = () => (
  <TerminalWindow title="zsh">
    <Command>pnpm install ciderpress</Command>
    <Output>
      <Line color="muted">resolved 142 packages in 1.4s</Line>
    </Output>
    <Output>
      <Line color="success" bold>
        +
      </Line>{' '}
      <Line color="muted">ciderpress 1.0.0-rc.0</Line>
    </Output>
    <Command>pnpm cider dev</Command>
    <Output>
      <Line color="info">→</Line> <Line>http://localhost:3000</Line>
    </Output>
  </TerminalWindow>
)

const IDE_SAMPLE_CODE = `import { defineConfig } from 'ciderpress'

export default defineConfig({
  title: 'My Docs',
  theme: 'mulled',
  base: '/',
})
`

/**
 * IDE-style window with file tabs and a syntax-highlighted code block
 * rendered via the stubbed `CodeBlockRuntime`.
 *
 * @returns IDE chrome with sample TypeScript code
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const IDE: Story = () => (
  <IDEWindow
    files={[
      { name: 'ciderpress.config.ts', active: true },
      { name: 'package.json' },
      { name: 'README.md' },
    ]}
    code={IDE_SAMPLE_CODE}
    lang="ts"
  />
)
