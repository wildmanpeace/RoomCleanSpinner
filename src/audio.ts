/** Tiny synthesised sound effects — no audio files, so nothing extra to cache offline. */
export type Sounds = Readonly<{
  /** Must be called from a user gesture (iOS only unlocks audio inside one). */
  unlock: () => void
  tick: () => void
  cheer: () => void
}>

export const createSounds = (isMuted: () => boolean): Sounds => {
  let ctx: AudioContext | undefined

  const tone = (freq: number, start: number, duration: number, type: OscillatorType, volume: number) => {
    if (!ctx || isMuted()) return
    const t = ctx.currentTime + start
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(volume, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + duration + 0.02)
  }

  return {
    unlock: () => {
      ctx ??= new AudioContext()
      if (ctx.state === 'suspended') void ctx.resume()
    },
    tick: () => tone(1400, 0, 0.035, 'square', 0.04),
    cheer: () =>
      // C major arpeggio up to a high C
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.11, 0.35, 'triangle', 0.18)),
  }
}
