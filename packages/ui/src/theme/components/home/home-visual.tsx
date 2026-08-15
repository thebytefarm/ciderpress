import type { HomeVisual, HomeVisualLine, HomeVisualTerminal } from '@ciderpress/config'
import { CodeBlockRuntime } from '@rspress/core/theme'
import { match, P } from 'massaman/match'
import type React from 'react'

import { withMountBase } from '../../lib/with-mount-base.ts'

import './hero-demo.css'

/**
 * Surface a {@link HomeVisual} is rendered into.
 *
 * - `'hero'` — supplies its own framed `cp-hero-demo` container
 * - `'split'` — the parent `cp-split__visual` frame owns the chrome
 * - `'tabs'` — the parent `cp-tabs__visual` frame owns the chrome
 */
export type HomeVisualContext = 'hero' | 'split' | 'tabs'

interface HomeVisualViewProps {
  readonly visual: HomeVisual
  readonly context: HomeVisualContext
}

/**
 * Render a user-supplied {@link HomeVisual}. One union, three variants,
 * shared by `home.hero.demo` and `home.blocks[].visual`:
 *
 * - **code** — rendered through Rspress's native `CodeBlockRuntime`, the
 *   same Shiki pipeline that highlights markdown code fences, so it
 *   themes identically to the rest of the site.
 * - **image** — a screenshot or graphic, base-prefixed via
 *   {@link withMountBase} to survive a mounted `base`.
 * - **terminal** — the framework's fake-macOS chrome painted with the
 *   supplied command and output lines.
 *
 * @param props - Validated visual config and the surface it renders into
 * @returns The visual's React element
 */
export function HomeVisualView(props: HomeVisualViewProps): React.ReactElement {
  const { visual, context } = props
  return match(visual)
    .with({ type: 'code' }, (v) => renderCode(v.code, v.language, context))
    .with({ type: 'image' }, (v) => renderImage(v, context))
    .with({ type: 'terminal' }, (v) => <VisualTerminal config={v} />)
    .exhaustive()
}

/**
 * Render the code variant, framing it only in the hero context.
 *
 * @private
 * @param code - Snippet source
 * @param language - Shiki language identifier, defaulting to `ts`
 * @param context - Surface being rendered into
 * @returns Highlighted code block
 */
function renderCode(
  code: string,
  language: string | undefined,
  context: HomeVisualContext
): React.ReactElement {
  const block = <CodeBlockRuntime lang={language ?? 'ts'} code={code} />
  return match(context)
    .with('hero', () => <div className="cp-hero-demo cp-hero-demo--code">{block}</div>)
    .otherwise(() => block)
}

/**
 * Image variant fields shared by both surfaces.
 *
 * @private
 */
interface VisualImageFields {
  readonly src: string
  readonly alt?: string
  readonly width?: number | string
  readonly height?: number | string
}

/**
 * Render the image variant with the class names its surface expects.
 *
 * @private
 * @param image - Validated image visual
 * @param context - Surface being rendered into
 * @returns Image element, framed in the hero context
 */
function renderImage(image: VisualImageFields, context: HomeVisualContext): React.ReactElement {
  const { src, alt, width, height } = image
  const framedClass = match(context)
    .with('tabs', () => 'cp-tabs__img')
    .otherwise(() => 'cp-split__img')
  return match(context)
    .with(P.union('split', 'tabs'), () => (
      <img
        src={withMountBase(src)}
        alt={alt ?? ''}
        width={width}
        height={height}
        className={framedClass}
      />
    ))
    .with('hero', () => (
      <div className="cp-hero-demo cp-hero-demo--image">
        <img
          src={withMountBase(src)}
          alt={alt ?? ''}
          width={width}
          height={height}
          className="cp-hero-demo__img"
        />
      </div>
    ))
    .exhaustive()
}

interface VisualTerminalProps {
  readonly config: HomeVisualTerminal
}

/**
 * Render the terminal variant with the user-supplied command and lines.
 * In the split context the parent frame flattens the chrome via CSS, so
 * the markup is identical on both surfaces.
 *
 * @private
 * @param props - Validated terminal config
 * @returns Terminal-shell element
 */
function VisualTerminal(props: VisualTerminalProps): React.ReactElement {
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
  readonly line: HomeVisualLine
}

/**
 * Render a single terminal output line. Each kind gets a coloured prefix
 * glyph mirroring the framework default.
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
