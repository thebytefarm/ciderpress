import type { HeroDemoConfig, HeroDemoLine, HeroDemoTerminal } from '@ciderpress/config'
import { match } from 'massaman/match'
import type React from 'react'

import './hero-demo.css'

interface CustomHeroDemoProps {
  readonly config: HeroDemoConfig
}

/**
 * Custom replacement for `<HeroDemo />`. Driven by `home.heroDemo` from
 * `ciderpress.config.ts`:
 *
 * - **Image form** (`{ src, alt, width?, height? }`) — renders an
 *   `<img>` inside the framework's framed `cp-hero-demo` container
 *   (rounded corners + brand-soft glow shadow preserved).
 * - **Terminal form** (`{ windowTitle?, command, lines }`) — keeps the
 *   fake-macOS chrome but paints the user's command + output lines.
 *
 * The discriminator is structural: image objects carry `src`, terminal
 * objects carry `lines`.
 *
 * @param props - Validated `HeroDemoConfig`
 * @returns Custom hero demo element
 */
export function CustomHeroDemo(props: CustomHeroDemoProps): React.ReactElement {
  return match(props.config)
    .when(
      (c): c is HeroDemoTerminal => 'lines' in c,
      (c) => <CustomTerminal config={c} />
    )
    .otherwise((c) => (
      <div className="cp-hero-demo cp-hero-demo--image">
        <img
          src={c.src}
          alt={c.alt ?? ''}
          width={c.width}
          height={c.height}
          className="cp-hero-demo__img"
        />
      </div>
    ))
}

interface CustomTerminalProps {
  readonly config: HeroDemoTerminal
}

/**
 * Render the terminal-form hero demo with user-supplied command + lines.
 *
 * @private
 * @param props - Validated terminal config
 * @returns Terminal-shell hero demo element
 */
function CustomTerminal(props: CustomTerminalProps): React.ReactElement {
  const { windowTitle, command, lines } = props.config
  return (
    <div className="cp-hero-demo">
      <div className="cp-hero-demo__bar">
        <span className="cp-hero-demo__dot" />
        <span className="cp-hero-demo__dot" />
        <span className="cp-hero-demo__dot" />
        {match(windowTitle)
          .with(undefined, () => null)
          .otherwise((t) => (
            <span className="cp-hero-demo__title">{t}</span>
          ))}
      </div>
      <pre className="cp-hero-demo__body">
        <span className="cp-hero-demo__prompt">$ </span>
        {command}
        {'\n\n'}
        {lines.map((line, i) => (
          <TerminalLine key={`${line.kind}-${i}`} line={line} />
        ))}
      </pre>
    </div>
  )
}

interface TerminalLineProps {
  readonly line: HeroDemoLine
}

/**
 * Render a single line of the structured terminal hero demo. Each
 * kind gets a coloured prefix glyph mirroring the framework default.
 *
 * @private
 * @param props - Single line entry
 * @returns Glyph-prefixed line followed by a newline
 */
function TerminalLine(props: TerminalLineProps): React.ReactElement {
  const className = match(props.line.kind)
    .with('ok', () => 'cp-hero-demo__ok')
    .with('info', () => 'cp-hero-demo__info')
    .with('cmt', () => 'cp-hero-demo__cmt')
    .with('err', () => 'cp-hero-demo__err')
    .exhaustive()
  const glyph = match(props.line.kind)
    .with('ok', () => ' ✓')
    .with('info', () => ' ▸')
    .with('cmt', () => ' ↻')
    .with('err', () => ' ✗')
    .exhaustive()
  return (
    <>
      <span className={className}>{glyph}</span> {props.line.text}
      {'\n'}
    </>
  )
}
