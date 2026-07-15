// NOTE: This file is copied raw to dist/ and compiled by Rspress's internal
// webpack — NOT by Rslib. Only import packages resolvable in Rspress's webpack
// context (react, mermaid, CSS). Do NOT import ts-pattern, es-toolkit, or other
// workspace dependencies here — they will cause "factory is undefined" runtime
// errors. See packages/ui/AGENTS.md for details.
//
// MERMAID v11: works fine here — no pin needed. The earlier v10 pin blamed
// langium/lazy-loading, but mermaid.render() actually resolves correctly. The
// real bug was local: `config` defaults to a fresh {} each render, so keying
// renderMermaid on it re-created the callback every render and re-fired the
// render effect in a loop. Each loop iteration called mermaid.render() into the
// same element id, clobbering the just-injected SVG — the diagram went blank
// until an unrelated re-render happened to run last. Fixed by keying on a stable
// serialized config value (see configKey below).

// oxlint-disable no-ternary

import elkLayouts from '@mermaid-js/layout-elk'
import mermaid from 'mermaid'
import type { MermaidConfig } from 'mermaid'
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import './mermaid.css'

// ELK layout support. Diagrams that opt in with `layout: elk` (via frontmatter or
// `%%{init: {'layout': 'elk'}}%%`) need the ELK loaders registered before render,
// or mermaid.render() throws and the diagram silently blanks. `elkLayouts` is an
// array of lazy loaders (`() => import(...)`), so elkjs — and its web worker —
// only load client-side when a diagram actually uses ELK, never at build/SSR time.
// Registration itself is a cheap, edge-safe registry push. We guard on a module
// flag so React re-mounts / StrictMode double-invokes register exactly once.
const elkState = { registered: false }

/**
 * Register the ELK layout loaders with mermaid, exactly once per module load.
 *
 * @private
 */
function ensureElkRegistered(): void {
  if (elkState.registered) {
    return
  }
  elkState.registered = true
  mermaid.registerLayoutLoaders(elkLayouts)
}

interface MermaidRendererProps {
  readonly code: string
  readonly config?: MermaidConfig
}

interface Transform {
  readonly x: number
  readonly y: number
  readonly scale: number
}

type Tab = 'preview' | 'code'

const DIAGRAM_TYPE_MAP: Record<string, string> = {
  graph: 'Flowchart',
  flowchart: 'Flowchart',
  sequenceDiagram: 'Sequence',
  classDiagram: 'Class',
  stateDiagram: 'State',
  'stateDiagram-v2': 'State',
  erDiagram: 'ER',
  gantt: 'Gantt',
  journey: 'User Journey',
  pie: 'Pie',
  gitGraph: 'Git Graph',
  mindmap: 'Mindmap',
  timeline: 'Timeline',
  quadrantChart: 'Quadrant',
  sankey: 'Sankey',
  xychart: 'XY Chart',
  block: 'Block',
  c4Context: 'C4 Context',
  c4Container: 'C4 Container',
  c4Component: 'C4 Component',
  c4Dynamic: 'C4 Dynamic',
  c4Deployment: 'C4 Deployment',
}

const MERMAID_KEYWORDS = [
  'graph',
  'flowchart',
  'sequenceDiagram',
  'classDiagram',
  'stateDiagram',
  'stateDiagram-v2',
  'erDiagram',
  'gantt',
  'journey',
  'pie',
  'gitGraph',
  'mindmap',
  'timeline',
  'quadrantChart',
  'sankey',
  'xychart',
  'block',
  'c4Context',
  'c4Container',
  'c4Component',
  'c4Dynamic',
  'c4Deployment',
  'subgraph',
  'end',
  'participant',
  'actor',
  'activate',
  'deactivate',
  'note',
  'loop',
  'alt',
  'else',
  'opt',
  'par',
  'critical',
  'break',
  'rect',
  'class',
  'state',
  'direction',
  'section',
  'title',
  'dateFormat',
  'axisFormat',
  'excludes',
  'includes',
  'todayMarker',
  'TB',
  'TD',
  'BT',
  'RL',
  'LR',
]

// oxlint-disable-next-line security/detect-non-literal-regexp -- constructed from hardcoded keyword array
const KEYWORD_PATTERN = new RegExp(`\\b(${MERMAID_KEYWORDS.join('|')})\\b`, 'g')

const COMMENT_PATTERN = /%%.*$/gm
const ARROW_PATTERN = /--&gt;|-->|==>|-.->|--x|--o|&lt;--|<--|===|---|~~~|\|&gt;|\|>/g
const STRING_PATTERN = /"[^"]*"|'[^']*'/g

// Placeholder sentinel — uses a Unicode private-use-area character to avoid
// triggering the no-control-regex lint rule.
const PLACEHOLDER = '\uE000'
const PLACEHOLDER_PATTERN = new RegExp(`${PLACEHOLDER}(\\d+)${PLACEHOLDER}`, 'g')

/**
 * Detect the mermaid diagram type from the first line of code.
 *
 * @param code - Raw mermaid source
 * @returns Human-readable diagram type label
 */
function detectDiagramType(code: string): string {
  const firstLine = code.trim().split('\n')[0].trim()
  const entries = Object.entries(DIAGRAM_TYPE_MAP)
  const found = entries.find(([key]) => firstLine.startsWith(key))
  if (found) {
    return found[1]
  }
  return 'Diagram'
}

/**
 * Escape HTML special characters for safe insertion via dangerouslySetInnerHTML.
 *
 * @param text - Raw text
 * @returns HTML-escaped text
 */
function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/**
 * Apply lightweight syntax highlighting to mermaid source code.
 * Returns an HTML string with span-wrapped tokens.
 *
 * @param code - Raw mermaid source
 * @returns HTML string with syntax highlighting spans
 */
function highlightMermaid(code: string): string {
  const escaped = escapeHtml(code)

  const placeholders: string[] = []
  function placeholder(html: string): string {
    const idx = placeholders.length
    placeholders.push(html)
    return `${PLACEHOLDER}${String(idx)}${PLACEHOLDER}`
  }

  const result = escaped
    .replace(COMMENT_PATTERN, (m) => placeholder(`<span class="zm-comment">${m}</span>`))
    .replace(STRING_PATTERN, (m) => placeholder(`<span class="zm-string">${m}</span>`))
    .replace(ARROW_PATTERN, (m) => placeholder(`<span class="zm-arrow">${m}</span>`))
    .replace(KEYWORD_PATTERN, (m) => placeholder(`<span class="zm-keyword">${m}</span>`))
    .replace(PLACEHOLDER_PATTERN, (_match, idx) => placeholders[Number(idx)])

  return result
}

const INITIAL_TRANSFORM: Transform = { x: 0, y: 0, scale: 1 }
const MIN_SCALE = 0.25
const MAX_SCALE = 4
const ZOOM_STEP = 0.1

/**
 * Render a mermaid diagram as an interactive SVG with pan, zoom,
 * fullscreen, and a code view toggle with syntax highlighting.
 *
 * @param props - Mermaid code string and optional mermaid config
 * @returns React element
 */
function MermaidRenderer(props: MermaidRendererProps): React.ReactElement | null {
  const { code, config = {} } = props

  const id = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    dragging: boolean
    startX: number
    startY: number
    originX: number
    originY: number
  }>({
    dragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  })

  const [svg, setSvg] = useState('')
  const [renderError, setRenderError] = useState(false)
  // Monotonic counter for per-render element ids. mermaid.render() renders into a
  // node keyed by the id we pass; reusing one id across calls (React StrictMode
  // double-invokes the mount effect) lets a later call clobber the SVG an earlier
  // call already injected. A fresh id per call makes every render self-contained.
  const renderSeq = useRef(0)
  const [transform, setTransform] = useState<Transform>(INITIAL_TRANSFORM)
  const transformRef = useRef<Transform>(INITIAL_TRANSFORM)
  const [fullscreen, setFullscreen] = useState(false)
  const [tab, setTab] = useState<Tab>('preview')

  const highlightedCode = useMemo(() => highlightMermaid(code), [code])

  // Stable value-key for the config object. `config` defaults to a fresh {} on
  // every render, so depending on it directly re-creates renderMermaid each
  // render, which re-fires the render effect in a loop. Each re-render calls
  // mermaid.render() into the same element id — which clobbers the SVG we just
  // injected, leaving the diagram blank until an unrelated re-render happens to
  // land last. Keying on the serialized value keeps renderMermaid stable.
  const configKey = JSON.stringify(config)

  transformRef.current = transform

  const isPreview = tab === 'preview'

  const renderMermaid = useCallback(async () => {
    ensureElkRegistered()

    const hasDarkClass = document.documentElement.classList.contains('dark')

    const mermaidConfig: MermaidConfig = {
      securityLevel: 'loose',
      startOnLoad: false,
      theme: hasDarkClass ? 'dark' : 'default',
      ...config,
    }

    const renderId = `${id.replaceAll(':', '')}-${(renderSeq.current += 1)}`
    try {
      mermaid.initialize(mermaidConfig)
      const result = await mermaid.render(renderId, code as string)
      setSvg(result.svg)
    } catch {
      setRenderError(true)
    }
  }, [code, configKey, id])

  useEffect(() => {
    renderMermaid()
  }, [renderMermaid])

  useEffect(() => {
    const observer = new MutationObserver(() => {
      renderMermaid()
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      observer.disconnect()
    }
  }, [renderMermaid])

  useEffect(() => {
    const el = containerRef.current
    if (!el || !isPreview) {
      return
    }

    function handleWheel(e: WheelEvent) {
      e.preventDefault()
      const direction = e.deltaY < 0 ? 1 : -1
      setTransform((prev) => {
        const nextScale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, prev.scale + direction * ZOOM_STEP)
        )
        return { ...prev, scale: nextScale }
      })
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleWheel)
    }
  }, [isPreview])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isPreview) {
        return
      }
      if (e.button !== 0) {
        return
      }
      const target = e.target as HTMLElement
      if (
        target.closest('.ciderpress-mermaid-controls') ||
        target.closest('.ciderpress-mermaid-footer')
      ) {
        return
      }

      const current = transformRef.current
      dragRef.current = {
        dragging: true,
        startX: e.clientX,
        startY: e.clientY,
        originX: current.x,
        originY: current.y,
      }
      const container = e.currentTarget as HTMLElement
      container.setPointerCapture(e.pointerId)
    },
    [isPreview]
  )

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag.dragging) {
      return
    }
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    setTransform((prev) => ({ ...prev, x: drag.originX + dx, y: drag.originY + dy }))
  }, [])

  const handlePointerUp = useCallback(() => {
    dragRef.current = { ...dragRef.current, dragging: false }
  }, [])

  const zoomIn = useCallback(() => {
    setTransform((prev) => ({ ...prev, scale: Math.min(MAX_SCALE, prev.scale + ZOOM_STEP) }))
  }, [])

  const zoomOut = useCallback(() => {
    setTransform((prev) => ({ ...prev, scale: Math.max(MIN_SCALE, prev.scale - ZOOM_STEP) }))
  }, [])

  const resetView = useCallback(() => {
    setTransform(INITIAL_TRANSFORM)
  }, [])

  const toggleFullscreen = useCallback(() => {
    setFullscreen((prev) => !prev)
    setTab('preview')
    setTransform(INITIAL_TRANSFORM)
  }, [])

  useEffect(() => {
    if (!fullscreen) {
      return
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setFullscreen(false)
        setTransform(INITIAL_TRANSFORM)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [fullscreen])

  useEffect(() => {
    if (!fullscreen) {
      return
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [fullscreen])

  if (renderError) {
    return null
  }

  const transformStyle = `translate(${String(transform.x)}px, ${String(transform.y)}px) scale(${String(transform.scale)})`

  const containerClasses = [
    'ciderpress-mermaid',
    fullscreen ? 'ciderpress-mermaid-fullscreen' : '',
    isPreview ? '' : 'ciderpress-mermaid-no-pan',
  ]
    .filter(Boolean)
    .join(' ')

  const fullscreenTitle = fullscreen ? 'Exit fullscreen' : 'Fullscreen'
  const fullscreenIcon = fullscreen ? '✕' : '⛶'

  const previewTabClass = isPreview
    ? 'ciderpress-mermaid-tab ciderpress-mermaid-tab-active'
    : 'ciderpress-mermaid-tab'

  const codeTabClass = isPreview
    ? 'ciderpress-mermaid-tab'
    : 'ciderpress-mermaid-tab ciderpress-mermaid-tab-active'

  const body = isPreview ? (
    <div
      ref={innerRef}
      className="ciderpress-mermaid-inner"
      style={{ transform: transformStyle }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  ) : (
    <div className="ciderpress-mermaid-code">
      <pre>
        <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      </pre>
    </div>
  )

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {isPreview && (
        <div className="ciderpress-mermaid-controls">
          <button type="button" className="ciderpress-mermaid-btn" onClick={zoomIn} title="Zoom in">
            +
          </button>
          <button
            type="button"
            className="ciderpress-mermaid-btn"
            onClick={zoomOut}
            title="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            className="ciderpress-mermaid-btn"
            onClick={resetView}
            title="Reset view"
          >
            ⟲
          </button>
          <button
            type="button"
            className="ciderpress-mermaid-btn"
            onClick={toggleFullscreen}
            title={fullscreenTitle}
          >
            {fullscreenIcon}
          </button>
        </div>
      )}

      {body}

      {!fullscreen && (
        <div className="ciderpress-mermaid-footer">
          <span className="ciderpress-mermaid-type">{detectDiagramType(code)}</span>
          <div className="ciderpress-mermaid-tabs">
            <button type="button" className={previewTabClass} onClick={() => setTab('preview')}>
              Preview
            </button>
            <button type="button" className={codeTabClass} onClick={() => setTab('code')}>
              Code
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MermaidRenderer
