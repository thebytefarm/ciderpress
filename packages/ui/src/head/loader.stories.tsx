import type { Story } from '@ladle/react'
import { match } from 'massaman/match'
import { useEffect, useRef, useState } from 'react'
import type React from 'react'

import loaderAppleCss from './css/loader-apple.css?inline'
import loaderBackdropCss from './css/loader-backdrop.css?inline'
import loaderDotsCss from './css/loader-dots.css?inline'

const meta = {
  title: 'Head / Loader',
}

export default meta

type Phase = 'visible' | 'fading' | 'ready'
type LoaderStyle = 'apple' | 'classic'

/**
 * Frame sequence cycled by `loader-dots.js` — kept in lockstep here so
 * the classic loader story shows the production animation. The apple
 * loader pins `content: 'loading'` and ignores this cycle.
 */
const FRAMES: readonly string[] = ['loading', 'loading.', 'loading..', 'loading...']
const FRAME_INTERVAL_MS = 300
const STYLE_TAG_ID = 'cp-loader-story-styles'
const PREVIEW_CLASS = 'cp-loader-preview'
const BACKDROP_CLASS = 'cp-loader-preview-backdrop'
const LEAF_CLASS = 'cp-loader-preview-leaf'

/**
 * Production loader CSS targets `html::*` and `body::*` pseudo-elements
 * with `position: fixed`. The preview only has two pseudos, so we
 * rewrite the body pseudos to sibling `<div>`s inside the preview
 * frame, the html pseudos to `.cp-loader-preview::*`, and convert
 * `position: fixed` to `position: absolute` so everything pins to the
 * preview's bounds instead of the viewport. The on-disk canonical CSS
 * files stay untouched.
 *
 * Order matters here: more-specific patterns (e.g. `html.cp-loader-fade
 * body::after`) must be rewritten before less-specific ones (e.g.
 * `body::after`), otherwise the inner substring gets replaced first
 * and the surrounding selector loses its anchor.
 *
 * @private
 * @param css - Raw CSS source
 * @returns Source with all loader selectors rescoped to the preview
 */
function scopeToPreview(css: string): string {
  return css
    .replaceAll(
      'html.cp-loader-fade body::before',
      `.${PREVIEW_CLASS}.cp-loader-fade .${BACKDROP_CLASS}`
    )
    .replaceAll(
      'html.cp-loader-fade body::after',
      `.${PREVIEW_CLASS}.cp-loader-fade .${LEAF_CLASS}`
    )
    .replaceAll(
      'html[data-cp-ready] body::before',
      `.${PREVIEW_CLASS}[data-cp-ready] .${BACKDROP_CLASS}`
    )
    .replaceAll(
      'html[data-cp-ready] body::after',
      `.${PREVIEW_CLASS}[data-cp-ready] .${LEAF_CLASS}`
    )
    .replaceAll('html.cp-loader-fade::before', `.${PREVIEW_CLASS}.cp-loader-fade::before`)
    .replaceAll('html.cp-loader-fade::after', `.${PREVIEW_CLASS}.cp-loader-fade::after`)
    .replaceAll('html[data-cp-ready]::before', `.${PREVIEW_CLASS}[data-cp-ready]::before`)
    .replaceAll('html[data-cp-ready]::after', `.${PREVIEW_CLASS}[data-cp-ready]::after`)
    .replaceAll('html::before', `.${PREVIEW_CLASS}::before`)
    .replaceAll('html::after', `.${PREVIEW_CLASS}::after`)
    .replaceAll('body::before', `.${PREVIEW_CLASS} .${BACKDROP_CLASS}`)
    .replaceAll('body::after', `.${PREVIEW_CLASS} .${LEAF_CLASS}`)
    .replaceAll('position: fixed', 'position: absolute')
}

/**
 * Resolve the loader CSS bundle for a given style. Mirrors
 * `resolveLoaderCss` in `packages/ui/src/css.ts` so the story renders
 * exactly what production injects, just with the scoped rewriter
 * applied on top.
 *
 * @private
 * @param style - Loader variant to render
 * @returns Concatenated backdrop + variant CSS, already preview-scoped
 */
function buildLoaderCss(style: LoaderStyle): string {
  const variant = match(style)
    .with('apple', () => loaderAppleCss)
    .with('classic', () => loaderDotsCss)
    .exhaustive()
  return `${scopeToPreview(loaderBackdropCss)}\n${scopeToPreview(variant)}`
}

interface PhaseToggleProps {
  readonly phase: Phase
  readonly onPhase: (next: Phase) => void
}

interface StyleToggleProps {
  readonly style: LoaderStyle
  readonly onStyle: (next: LoaderStyle) => void
}

interface LoaderHarnessProps {
  readonly initial: Phase
  readonly initialStyle?: LoaderStyle
  readonly controls?: boolean
}

/**
 * Drive the production loader inside a contained Ladle viewport.
 *
 * Injects scoped versions of `loader-backdrop.css` plus the chosen
 * variant CSS (`loader-apple.css` or `loader-dots.css`) into a managed
 * `<style>` tag, drives the same dots animation as `loader-dots.js`
 * (visible only for the classic variant — the apple variant pins a
 * static "loading" string), and exposes controls to walk through the
 * visible → fading → ready lifecycle as well as swap loader styles.
 *
 * @param props - Initial loader phase, optional initial style, and
 *   optional control surface override
 * @returns Contained preview frame with optional controls
 */
function LoaderHarness({
  initial,
  initialStyle = 'apple',
  controls = true,
}: LoaderHarnessProps): React.ReactElement {
  const [phase, setPhase] = useState<Phase>(initial)
  const [style, setStyle] = useState<LoaderStyle>(initialStyle)
  const frameRef = useRef(0)
  const previewRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const styleTag = document.createElement('style')
    styleTag.id = STYLE_TAG_ID
    // Inject scoped loader CSS PLUS a chrome-strip rule that flattens
    // the Ladle canvas wrapper while a loader story is mounted. Uses
    // `:has()` so the override only fires when the preview element is
    // actually in the tree — sister stories keep their dashed canvas.
    styleTag.textContent = `${buildLoaderCss(style)}
.cp-ladle-shell:has(.${PREVIEW_CLASS}) { padding: 0 !important; }
.cp-ladle-canvas:has(.${PREVIEW_CLASS}) {
  padding: 0 !important;
  border: none !important;
  border-radius: 0 !important;
  background: transparent !important;
}`
    document.head.append(styleTag)

    const preview = previewRef.current
    if (preview !== null) {
      delete preview.dataset.cpReady
      preview.classList.remove('cp-loader-fade')
      preview.dataset.cpLoaderText = FRAMES[0] as string
    }

    const interval = setInterval(() => {
      frameRef.current = (frameRef.current + 1) % FRAMES.length
      const { current } = previewRef
      if (current !== null) {
        current.dataset.cpLoaderText = FRAMES[frameRef.current] as string
      }
    }, FRAME_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      styleTag.remove()
    }
  }, [style])

  useEffect(() => {
    const preview = previewRef.current
    if (preview === null) {
      return
    }
    match(phase)
      .with('visible', () => {
        preview.classList.remove('cp-loader-fade')
        delete preview.dataset.cpReady
      })
      .with('fading', () => {
        preview.classList.add('cp-loader-fade')
        delete preview.dataset.cpReady
      })
      .with('ready', () => {
        preview.classList.add('cp-loader-fade')
        preview.dataset.cpReady = 'true'
      })
      .exhaustive()
  }, [phase])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        ref={previewRef}
        className={PREVIEW_CLASS}
        style={{
          position: 'relative',
          width: '100%',
          minHeight: 'calc(100vh - 180px)',
          overflow: 'hidden',
          background: 'transparent',
        }}
      >
        <div className={BACKDROP_CLASS} />
        <div className={LEAF_CLASS} />
        <Backdrop />
      </div>
      {match(controls)
        .with(true, () => (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <StyleToggle style={style} onStyle={setStyle} />
            <PhaseToggle phase={phase} onPhase={setPhase} />
          </div>
        ))
        .otherwise(() => null)}
    </div>
  )
}

/**
 * Inline panel that flips between the apple loader and the classic
 * dots loader at runtime. Mirrors what setting `loader: 'apple' |
 * 'classic'` in `ciderpress.config.ts` would do at build time.
 *
 * @private
 * @param props - Current style + change handler
 * @returns Style switcher element
 */
function StyleToggle({ style, onStyle }: StyleToggleProps): React.ReactElement {
  const styles: readonly LoaderStyle[] = ['apple', 'classic']
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 8,
        background: 'var(--cp-c-bg-elv, #161616)',
        border: '1px solid var(--cp-c-border, #2a2a2a)',
        font: '12px/1 ui-monospace, SFMono-Regular, Menlo, monospace',
        color: 'var(--cp-c-text-1, #f5f5f5)',
      }}
    >
      <span style={{ opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Loader
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        {styles.map((s) => {
          const active = s === style
          return (
            <button
              key={s}
              type="button"
              onClick={() => onStyle(s)}
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                border: '1px solid var(--cp-c-border, #2a2a2a)',
                background: match(active)
                  .with(true, () => 'var(--cp-c-brand-1, #dc2626)')
                  .otherwise(() => 'transparent'),
                color: match(active)
                  .with(true, () => 'var(--cp-c-brand-fg, #ffffff)')
                  .otherwise(() => 'var(--cp-c-text-2, #f5f5f5)'),
                cursor: 'pointer',
                font: 'inherit',
              }}
            >
              {s}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Inline control panel — sits below the preview frame instead of
 * over the loader, so it stays usable in every phase including `ready`.
 *
 * @private
 * @param props - Current phase + change handler
 * @returns Controls panel element
 */
function PhaseToggle({ phase, onPhase }: PhaseToggleProps): React.ReactElement {
  const phases: readonly Phase[] = ['visible', 'fading', 'ready']
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 8,
        background: 'var(--cp-c-bg-elv, #161616)',
        border: '1px solid var(--cp-c-border, #2a2a2a)',
        font: '12px/1 ui-monospace, SFMono-Regular, Menlo, monospace',
        color: 'var(--cp-c-text-1, #f5f5f5)',
      }}
    >
      <span style={{ opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Phase
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        {phases.map((p) => {
          const active = p === phase
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPhase(p)}
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                border: '1px solid var(--cp-c-border, #2a2a2a)',
                background: match(active)
                  .with(true, () => 'var(--cp-c-brand-1, #dc2626)')
                  .otherwise(() => 'transparent'),
                color: match(active)
                  .with(true, () => 'var(--cp-c-brand-fg, #ffffff)')
                  .otherwise(() => 'var(--cp-c-text-2, #f5f5f5)'),
                cursor: 'pointer',
                font: 'inherit',
              }}
            >
              {p}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Filler content rendered inside the preview frame so reviewers can
 * verify the backdrop actually covers underlying content.
 *
 * @private
 * @returns Hidden content layer
 */
function Backdrop(): React.ReactElement {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Hidden content</h1>
      <p>
        This text sits inside the preview frame and is covered by the loader backdrop. Flip the
        phase toggle below to fade it in.
      </p>
    </div>
  )
}

/**
 * Default — apple loader visible, controls live. Switch loader style
 * with the toolbar or theme palette in the top picker.
 *
 * @returns Loader harness with full control surface
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Default: Story = () => <LoaderHarness initial="visible" initialStyle="apple" />

/**
 * Classic dots loader — the opt-in `loader: 'classic'` variant.
 * Same lifecycle controls as the apple story.
 *
 * @returns Loader harness pinned to classic style
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Classic: Story = () => <LoaderHarness initial="visible" initialStyle="classic" />

/**
 * Apple loader captured mid-fade — opacity 0 but still painted.
 *
 * @returns Apple loader pinned to `fading`
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const AppleFading: Story = () => <LoaderHarness initial="fading" initialStyle="apple" />

/**
 * Classic loader captured mid-fade.
 *
 * @returns Classic loader pinned to `fading`
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const ClassicFading: Story = () => <LoaderHarness initial="fading" initialStyle="classic" />

/**
 * Ready state — `data-cp-ready` set on the preview container. The
 * loader is hard-hidden via `display: none`. Flip back to `visible`
 * via the controls to bring it back. Either loader style behaves the
 * same in this phase.
 *
 * @returns Loader harness pinned to `ready`
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const Ready: Story = () => <LoaderHarness initial="ready" initialStyle="apple" />

/**
 * Apple loader without the control panel — what an end user actually
 * sees during cold start.
 *
 * @returns Apple loader, controls disabled
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const NoControlsApple: Story = () => (
  <LoaderHarness initial="visible" initialStyle="apple" controls={false} />
)

/**
 * Classic loader without the control panel.
 *
 * @returns Classic loader, controls disabled
 */
// oxlint-disable-next-line func-style -- Ladle stories use `export const`
export const NoControlsClassic: Story = () => (
  <LoaderHarness initial="visible" initialStyle="classic" controls={false} />
)
