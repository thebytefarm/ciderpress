/* oxlint-disable no-expression-statements -- Canvas 2D and ResizeObserver are imperative browser APIs. */
import React, { useEffect, useRef } from 'react'

const FLICKER_CHANCE = 0.12
const FLICKER_DELAY_MS = 1000
const FLICKER_FADE_IN_MS = 600
const FLICKER_FRAME_MS = 100
const FLICKER_TARGET_MS = 420

/** Props provided to the runtime Ciderpress hero background. */
export interface CiderpressHeroBackgroundProps {
  /** Active site color variant. */
  readonly variant: 'light' | 'dark'
}

interface Palette {
  readonly background: string
  readonly olive: string
  readonly orange: string
}

interface DrawCellParams {
  readonly context: CanvasRenderingContext2D
  readonly x: number
  readonly y: number
  readonly size: number
  readonly color: string
  readonly alpha: number
}

interface DrawFieldParams {
  readonly context: CanvasRenderingContext2D
  readonly width: number
  readonly height: number
  readonly palette: Palette
  readonly flickerElapsed: number
}

/**
 * Procedural halftone hero field with softly fading edge color.
 *
 * @param props - Active color variant used to select the canvas palette.
 * @returns Responsive decorative canvas.
 */
export function CiderpressHeroBackground(props: CiderpressHeroBackgroundProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) {
      return
    }

    function draw(flickerElapsed: number): void {
      if (canvas === null) {
        return
      }
      return drawCanvas({ canvas, variant: props.variant, flickerElapsed })
    }
    function redraw(): void {
      return draw(0)
    }
    function animate(time: number, startedAt: number, lastDrawnAt: number): void {
      if (controller.signal.aborted) {
        return
      }
      if (!isVisible(canvas)) {
        animationFrameRef.current = null
        return
      }
      const elapsed = time - startedAt
      if (elapsed < FLICKER_DELAY_MS || time - lastDrawnAt < FLICKER_FRAME_MS) {
        animationFrameRef.current = requestAnimationFrame((nextTime) =>
          animate(nextTime, startedAt, lastDrawnAt)
        )
        return
      }
      draw(elapsed - FLICKER_DELAY_MS)
      animationFrameRef.current = requestAnimationFrame((nextTime) =>
        animate(nextTime, startedAt, time)
      )
    }
    function startAnimation(): void {
      if (animationFrameRef.current !== null) {
        return
      }
      animationFrameRef.current = requestAnimationFrame((time) => animate(time, time, time))
    }
    const controller = new AbortController()
    const shouldAnimate = !globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
    const observer = new ResizeObserver(redraw)
    const visibilityObserver = new IntersectionObserver((entries) => {
      const isIntersecting = entries.some((entry) => entry.isIntersecting)
      if (isIntersecting && shouldAnimate) {
        startAnimation()
      }
    })
    observer.observe(canvas)
    visibilityObserver.observe(canvas)
    redraw()
    if (shouldAnimate && isVisible(canvas)) {
      startAnimation()
    }

    return () => {
      controller.abort()
      observer.disconnect()
      visibilityObserver.disconnect()
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      animationFrameRef.current = null
    }
  }, [props.variant])

  return <canvas ref={canvasRef} aria-hidden="true" className="cp-site-hero-background" />
}

interface DrawCanvasParams {
  readonly canvas: HTMLCanvasElement
  readonly variant: 'light' | 'dark'
  readonly flickerElapsed: number
}

/**
 * Paint the canvas at its rendered size.
 *
 * @private
 * @param params - Canvas and active color variant.
 * @returns Nothing.
 */
function drawCanvas(params: DrawCanvasParams): void {
  const bounds = params.canvas.getBoundingClientRect()
  const width = Math.max(1, Math.round(bounds.width))
  const height = Math.max(1, Math.round(bounds.height))
  const pixelRatio = Math.min(globalThis.devicePixelRatio || 1, 2)
  const context = params.canvas.getContext('2d')
  if (context === null) {
    return
  }

  const canvasWidth = Math.round(width * pixelRatio)
  const canvasHeight = Math.round(height * pixelRatio)
  if (params.canvas.width !== canvasWidth || params.canvas.height !== canvasHeight) {
    params.canvas.width = canvasWidth
    params.canvas.height = canvasHeight
  }
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  drawField({
    context,
    width,
    height,
    palette: paletteFor(params.variant),
    flickerElapsed: params.flickerElapsed,
  })
}

/**
 * Paint the grain field from deterministic square particles.
 *
 * @private
 * @param params - Drawing context, dimensions, and palette.
 * @returns Nothing.
 */
function drawField(params: DrawFieldParams): void {
  const { context, width, height, palette } = params
  const step = Math.max(5, Math.min(8, width / 210))
  const columns = Math.ceil(width / step)
  const rows = Math.ceil(height / step)

  context.fillStyle = palette.background
  context.fillRect(0, 0, width, height)

  const paintedContext = Array.from({ length: columns * rows }, (_, index) => index).reduce(
    (activeContext, index) => {
      const column = index % columns
      const row = Math.floor(index / columns)
      const x = column * step
      const y = row * step
      const grain = hash({ x: column, y: row, seed: 17 })
      const topFade = edgeField({ position: y, extent: height, depth: 0.48 })
      const bottomFade = edgeField({ position: height - y, extent: height, depth: 0.42 })
      const orangeField = Math.max(
        topFade * radial({ x, y, centerX: width * 0.88, centerY: 0, radius: width * 0.78 }),
        bottomFade * radial({ x, y, centerX: width * 0.16, centerY: height, radius: width * 0.72 })
      )
      const oliveField =
        topFade *
        radial({
          x,
          y,
          centerX: width * 0.42,
          centerY: 0,
          radius: width * 0.68,
        })
      const fieldStrength = clamp(Math.max(orangeField, oliveField) * 0.88)

      if (grain < fieldStrength) {
        drawCell({
          context,
          x,
          y,
          size: step * (0.22 + grain * 0.34),
          color: fieldColor({ orangeField, oliveField, palette }),
          alpha: clamp(
            (0.22 + fieldStrength * 0.5) *
              flickerOpacity({ column, row, elapsed: params.flickerElapsed })
          ),
        })
      }

      return activeContext
    },
    context
  )

  paintedContext.globalAlpha = 1
}

interface FlickerOpacityParams {
  readonly column: number
  readonly row: number
  readonly elapsed: number
}

/**
 * Pulse a small deterministic subset of cells once animation begins.
 *
 * @private
 * @param params - Grid coordinate and elapsed animation time.
 * @returns Opacity multiplier centered around one.
 */
function flickerOpacity(params: FlickerOpacityParams): number {
  if (params.elapsed <= 0) {
    return 1
  }
  const target = Math.floor(params.elapsed / FLICKER_TARGET_MS)
  const progress = (params.elapsed % FLICKER_TARGET_MS) / FLICKER_TARGET_MS
  const easedProgress = progress * progress * (3 - 2 * progress)
  const currentOpacity = flickerTarget({ ...params, target })
  const nextOpacity = flickerTarget({ ...params, target: target + 1 })
  const opacity = currentOpacity + (nextOpacity - currentOpacity) * easedProgress
  const envelope = clamp(params.elapsed / FLICKER_FADE_IN_MS)
  return 1 + (opacity - 1) * envelope
}

interface FlickerTargetParams extends FlickerOpacityParams {
  readonly target: number
}

/**
 * Generate one independent opacity target for a grid cell.
 *
 * @private
 * @param params - Grid coordinate and target frame.
 * @returns Opacity multiplier for the target frame.
 */
function flickerTarget(params: FlickerTargetParams): number {
  const selected = hash({ x: params.column, y: params.row, seed: params.target * 17 + 101 })
  if (selected >= FLICKER_CHANCE) {
    return 1
  }
  return 0.18 + hash({ x: params.column, y: params.row, seed: params.target * 23 + 211 }) * 0.62
}

/**
 * Check whether repainting the canvas can affect the current viewport.
 *
 * @private
 * @param canvas - Hero canvas element.
 * @returns Whether the canvas intersects the viewport.
 */
function isVisible(canvas: HTMLCanvasElement): boolean {
  const bounds = canvas.getBoundingClientRect()
  return bounds.bottom >= 0 && bounds.top <= globalThis.innerHeight
}

interface CoordinateParams {
  readonly x: number
  readonly y: number
}

interface EdgeFieldParams {
  readonly position: number
  readonly extent: number
  readonly depth: number
}

/**
 * Fade a particle field gradually from a canvas edge toward its center.
 *
 * @private
 * @param params - Distance from the edge, canvas extent, and fade depth.
 * @returns Density from zero to one.
 */
function edgeField(params: EdgeFieldParams): number {
  return clamp(1 - params.position / (params.extent * params.depth))
}

interface RadialParams extends CoordinateParams {
  readonly centerX: number
  readonly centerY: number
  readonly radius: number
}

/**
 * Compute a soft radial field.
 *
 * @private
 * @param params - Point, center, and radius.
 * @returns Density from zero to one.
 */
function radial(params: RadialParams): number {
  const distance = Math.hypot(params.x - params.centerX, params.y - params.centerY)
  return clamp(1 - distance / params.radius)
}

interface HashParams extends CoordinateParams {
  readonly seed: number
}

/**
 * Produce deterministic pseudo-random grain for one grid coordinate.
 *
 * @private
 * @param params - Integer grid coordinate and seed.
 * @returns Value from zero to one.
 */
function hash(params: HashParams): number {
  const value = Math.sin(params.x * 127.1 + params.y * 311.7 + params.seed * 74.7) * 43_758.5453
  return value - Math.floor(value)
}

/**
 * Clamp a value to the unit interval.
 *
 * @private
 * @param value - Numeric value.
 * @returns Value from zero to one.
 */
function clamp(value: number): number {
  return Math.max(0, Math.min(1, value))
}

interface FieldColorParams {
  readonly orangeField: number
  readonly oliveField: number
  readonly palette: Palette
}

/**
 * Select the dominant background field color.
 *
 * @private
 * @param params - Field strengths and active palette.
 * @returns CSS color.
 */
function fieldColor(params: FieldColorParams): string {
  if (params.oliveField > params.orangeField) {
    return params.palette.olive
  }
  return params.palette.orange
}

/**
 * Draw one square particle centered on a grid point.
 *
 * @private
 * @param params - Drawing context and particle paint.
 * @returns Nothing.
 */
function drawCell(params: DrawCellParams): void {
  params.context.globalAlpha = params.alpha
  params.context.fillStyle = params.color
  params.context.fillRect(
    params.x - params.size / 2,
    params.y - params.size / 2,
    params.size,
    params.size
  )
}

/**
 * Select canvas colors for the active site variant.
 *
 * @private
 * @param variant - Active site color variant.
 * @returns Canvas palette.
 */
function paletteFor(variant: 'light' | 'dark'): Palette {
  if (variant === 'light') {
    return {
      background: '#f7f5f0',
      olive: '#8c8a43',
      orange: '#c65a35',
    }
  }
  return {
    background: '#080806',
    olive: '#55552a',
    orange: '#71301b',
  }
}
