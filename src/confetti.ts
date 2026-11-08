type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  spin: number
  colour: string
}

const DURATION_MS = 3200

/** Fires a confetti burst from the top-centre of the screen. Resolves when it has finished. */
export const burstConfetti = (canvas: HTMLCanvasElement, colours: readonly string[], count: number): Promise<void> =>
  new Promise((resolve) => {
    const ctx = canvas.getContext('2d')
    if (!ctx || colours.length === 0) return resolve()

    // Popover puts the canvas in the top layer, above an open modal dialog.
    if ('showPopover' in canvas && !canvas.matches(':popover-open')) canvas.showPopover()

    const dpr = window.devicePixelRatio || 1
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const particles: Particle[] = Array.from({ length: count }, (_, i) => ({
      x: w / 2 + (Math.random() - 0.5) * w * 0.3,
      y: h * 0.3,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 14 - 4,
      size: 6 + Math.random() * 8,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.4,
      colour: colours[i % colours.length]!,
    }))

    const started = performance.now()
    const frame = (now: number) => {
      const elapsed = now - started
      ctx.clearRect(0, 0, w, h)
      ctx.globalAlpha = Math.max(0, 1 - elapsed / DURATION_MS)
      for (const p of particles) {
        p.vy += 0.35
        p.vx *= 0.99
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.spin
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.colour
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      }
      if (elapsed < DURATION_MS) {
        requestAnimationFrame(frame)
      } else {
        ctx.clearRect(0, 0, w, h)
        if ('hidePopover' in canvas && canvas.matches(':popover-open')) canvas.hidePopover()
        resolve()
      }
    }
    requestAnimationFrame(frame)
  })
