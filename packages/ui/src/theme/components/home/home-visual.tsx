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
 * Terminates in `.otherwise`, not `.exhaustive`: on a hand-authored home
 * page this receives raw frontmatter, where a blank `visual:` parses to
 * null and `type:` may name a variant that does not exist. Throwing
 * `NonExhaustiveError` from here failed the entire site build, so an
 * unrenderable visual yields nothing instead.
 *
 * @param props - Validated visual config and the surface it renders into
 * @returns The visual's React element, or null when it cannot be rendered
 */
export function HomeVisualView(props: HomeVisualViewProps): React.ReactElement | null {
  const { visual, context } = props
  return match(visual)
    .with({ type: 'code' }, (v) => renderCode(v.code, v.language, context))
    .with({ type: 'image' }, (v) => renderImage(v, context))
    .with({ type: 'terminal' }, (v) => <VisualTerminal config={v} />)
    .otherwise(() => null)
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
  // Hand-authored frontmatter bypasses the schema; a non-string here
  // reaches React as a child and throws mid-render.
  const commandText = match(command)
    .with(P.string, (c) => c)
    .otherwise(() => '')
  const title = match(windowTitle)
    .with(P.string, (w) => w)
    .otherwise(() => undefined)
  // `lines` is required by the type but frontmatter is unvalidated on
  // hand-authored home pages — a missing key would otherwise throw here
  // and blank the whole page.
  const output = match(lines)
    .with(
      P.when((l): l is readonly HomeVisualLine[] => Array.isArray(l)),
      (l) => l.filter(isTerminalLine)
    )
    .otherwise(() => [])
  return (
    <div className="cp-hero-demo">
      <div className="cp-hero-demo__bar">
        <span className="cp-hero-demo__dot" />
        <span className="cp-hero-demo__dot" />
        <span className="cp-hero-demo__dot" />
        {match(title)
          .with(P.string, (w) => <span className="cp-hero-demo__title">{w}</span>)
          .otherwise(() => null)}
      </div>
      <pre className="cp-hero-demo__body">
        <span className="cp-hero-demo__prompt">$ </span>
        {commandText}
        {'\n\n'}
        {output.map((line, i) => (
          <TerminalLine key={`${line.kind}-${i}`} line={line} />
        ))}
      </pre>
    </div>
  )
}

/**
 * Whether a frontmatter value is a renderable terminal line. A YAML
 * sequence with a blank entry yields `null`, which would throw on the
 * first property read.
 *
 * @private
 * @param value - Unvalidated line from frontmatter
 * @returns True when the line can be rendered
 */
function isTerminalLine(value: unknown): value is HomeVisualLine {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const line = value as { text?: unknown }
  return typeof line.text === 'string'
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
  // `kind` is a union in the type but arrives unvalidated from
  // hand-authored frontmatter — fall back to the neutral marker rather
  // than throwing on an unknown value.
  const className = match(props.line.kind)
    .with('ok', () => 'cp-hero-demo__ok')
    .with('cmt', () => 'cp-hero-demo__cmt')
    .with('err', () => 'cp-hero-demo__err')
    .otherwise(() => 'cp-hero-demo__info')
  const glyph = match(props.line.kind)
    .with('ok', () => ' ✓')
    .with('cmt', () => ' ↻')
    .with('err', () => ' ✗')
    .otherwise(() => ' ▸')
  return (
    <>
      <span className={className}>{glyph}</span> {props.line.text}
      {'\n'}
    </>
  )
}
