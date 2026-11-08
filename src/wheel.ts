import type { Room } from './rooms'

const TAU = Math.PI * 2
export const WHEEL_FONT = '"Fredoka Variable", system-ui, sans-serif'

/** Largest font size (px) at which `text` fits in `maxWidth`, capped at `max`. */
const fitFont = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, max: number): number => {
  ctx.font = `700 ${max}px ${WHEEL_FONT}`
  const width = ctx.measureText(text).width
  return width <= maxWidth ? max : Math.max(10, Math.floor((max * maxWidth) / width))
}

/**
 * Draws the wheel unrotated: slice 0 starts at 12 o'clock and slices run clockwise.
 * Spinning is a CSS rotation of the canvas, so this only runs when the room list or size changes.
 */
export const drawWheel = (canvas: HTMLCanvasElement, rooms: readonly Room[]): void => {
  const dpr = window.devicePixelRatio || 1
  const cssSize = canvas.clientWidth
  // Not laid out yet (hidden tab, before first layout): the ResizeObserver redraws once it has a size.
  if (cssSize <= 0) return
  canvas.width = Math.round(cssSize * dpr)
  canvas.height = Math.round(cssSize * dpr)

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const c = cssSize / 2
  const rim = Math.max(8, cssSize * 0.035)
  const r = c - rim
  ctx.clearRect(0, 0, cssSize, cssSize)

  // Rim
  ctx.beginPath()
  ctx.arc(c, c, c, 0, TAU)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  if (rooms.length === 0) return

  const segment = TAU / rooms.length
  rooms.forEach((room, i) => {
    const start = -Math.PI / 2 + i * segment
    const centre = start + segment / 2

    ctx.beginPath()
    ctx.moveTo(c, c)
    ctx.arc(c, c, r, start, start + segment)
    ctx.closePath()
    ctx.fillStyle = room.colour
    ctx.fill()
    if (rooms.length > 1) {
      ctx.lineWidth = 3
      ctx.strokeStyle = '#ffffff'
      ctx.stroke()
    }

    // Soft highlight on the outer half of each slice for a glossy, toy-like look
    ctx.beginPath()
    ctx.arc(c, c, r, start, start + segment)
    ctx.arc(c, c, r * 0.72, start + segment, start, true)
    ctx.closePath()
    ctx.fillStyle = 'rgb(255 255 255 / 0.12)'
    ctx.fill()

    ctx.save()
    ctx.translate(c, c)
    ctx.rotate(centre)
    ctx.textBaseline = 'middle'

    ctx.textAlign = 'center'
    ctx.font = `${Math.round(r * 0.17)}px ${WHEEL_FONT}`
    ctx.fillStyle = '#000000' // colour emoji ignore the hue but inherit the alpha, so it must be opaque
    ctx.fillText(room.emoji, r * 0.82, 0)

    const labelEnd = r * 0.68
    const labelStart = r * 0.27
    const size = fitFont(ctx, room.label, labelEnd - labelStart, Math.round(r * 0.105))
    ctx.font = `700 ${size}px ${WHEEL_FONT}`
    ctx.textAlign = 'right'
    ctx.lineJoin = 'round'
    ctx.lineWidth = Math.max(3, size * 0.22)
    ctx.strokeStyle = 'rgb(43 22 96 / 0.45)'
    ctx.strokeText(room.label, labelEnd, 0)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(room.label, labelEnd, 0)
    ctx.restore()
  })

  // Light bulbs around the rim
  const bulbs = 24
  for (let i = 0; i < bulbs; i++) {
    const a = (i / bulbs) * TAU
    ctx.beginPath()
    ctx.arc(c + Math.cos(a) * (c - rim / 2), c + Math.sin(a) * (c - rim / 2), rim * 0.28, 0, TAU)
    ctx.fillStyle = i % 2 === 0 ? '#ffd23f' : '#ff7eb3'
    ctx.fill()
  }
}
