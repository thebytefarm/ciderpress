import type { Story } from '@ladle/react'
import type React from 'react'

import { BrowserWindow, TerminalWindow, Command, Output, Line } from './desktop-window.tsx'

export default {
  title: 'Shared / Windows',
}

/**
 * BrowserWindow with a URL bar and inline body content.
 *
 * @returns Rendered browser chrome
 */
export const Browser: Story = () => (
  <BrowserWindow
    url="https://ciderpress.dev/guides/themes"
    tab={{ title: 'Ciderpress · Themes' }}
  >
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
export const BrowserWithImage: Story = () => (
  <BrowserWindow
    url="https://ciderpress.dev"
    tab={{ title: 'Ciderpress' }}
    image="https://images.unsplash.com/photo-1505765050516-f72dcac9c60a?w=1200&auto=format"
  />
)

/**
 * TerminalWindow with composed command/output children including coloured
 * inline `<Line>` runs.
 *
 * @returns Terminal chrome
 */
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
