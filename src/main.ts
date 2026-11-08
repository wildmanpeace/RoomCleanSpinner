import '@fontsource-variable/fredoka'
import './style.css'
import { createSounds } from './audio'
import { burstConfetti } from './confetti'
import { ROOMS, type Room, type RoomId } from './rooms'
import { indexAtPointer, pickIndex, remainingRooms, targetRotation, withPick } from './spinner'
import { loadMuted, loadPicked, saveMuted, savePicked } from './storage'
import { WHEEL_FONT, drawWheel } from './wheel'

const byId = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id)
  if (!el) throw new Error(`Missing element #${id}`)
  return el as T
}

const els = {
  wheel: byId<HTMLCanvasElement>('wheel'),
  pointer: byId<HTMLDivElement>('pointer'),
  done: byId<HTMLDivElement>('done'),
  status: byId<HTMLParagraphElement>('status'),
  spin: byId<HTMLButtonElement>('spin'),
  reset: byId<HTMLButtonElement>('reset'),
  mute: byId<HTMLButtonElement>('mute'),
  pickedList: byId<HTMLOListElement>('picked-list'),
  pickedEmpty: byId<HTMLParagraphElement>('picked-empty'),
  result: byId<HTMLDialogElement>('result'),
  resultEmoji: byId<HTMLDivElement>('result-emoji'),
  resultName: byId<HTMLParagraphElement>('result-name'),
  confirmReset: byId<HTMLDialogElement>('confirm-reset'),
  confetti: byId<HTMLCanvasElement>('confetti'),
}

type State = Readonly<{
  picked: readonly RoomId[]
  rotation: number
  spinning: boolean
  muted: boolean
}>

let state: State = { picked: loadPicked(), rotation: 0, spinning: false, muted: loadMuted() }

const setState = (patch: Partial<State>): void => {
  state = { ...state, ...patch }
  render()
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const sounds = createSounds(() => state.muted)

/** Uniform random number in [0, 1) from the platform CSPRNG. */
const random = (): number => crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32

const easeOutQuart = (t: number): number => 1 - (1 - t) ** 4

const statusText = (left: number): string =>
  left === 0 ? 'All done! 🎉' : left === 1 ? 'Last room! 🏁' : `${left} rooms to go!`

const chip = (room: Room, n: number): HTMLLIElement => {
  const li = document.createElement('li')
  li.style.setProperty('--room', room.colour)
  const num = document.createElement('span')
  num.className = 'num'
  num.textContent = String(n)
  li.append(num, `${room.emoji} ${room.name}`)
  return li
}

const roomById = (id: RoomId): Room => {
  const room = ROOMS.find((r) => r.id === id)
  if (!room) throw new Error(`Unknown room id: ${id}`)
  return room
}

let drawnFor = ''
const redrawWheel = (force = false): void => {
  const remaining = remainingRooms(state.picked)
  const key = remaining.map((r) => r.id).join()
  if (!force && key === drawnFor) return
  drawnFor = key
  drawWheel(els.wheel, remaining)
}

function render(): void {
  const remaining = remainingRooms(state.picked)
  els.status.textContent = statusText(remaining.length)
  els.spin.disabled = state.spinning || remaining.length === 0
  els.reset.disabled = state.spinning || state.picked.length === 0
  els.done.hidden = remaining.length > 0
  els.mute.textContent = state.muted ? '🔇' : '🔊'
  els.mute.setAttribute('aria-pressed', String(state.muted))
  els.mute.setAttribute('aria-label', state.muted ? 'Unmute sounds' : 'Mute sounds')
  els.pickedList.replaceChildren(...state.picked.map((id, i) => chip(roomById(id), i + 1)))
  els.pickedEmpty.hidden = state.picked.length > 0
  els.wheel.style.transform = `rotate(${state.rotation}rad)`
}

const animateTo = (from: number, to: number, durationMs: number, count: number): Promise<void> =>
  new Promise((resolve) => {
    const started = performance.now()
    let lastIndex = indexAtPointer(from, count)
    const frame = (now: number) => {
      const t = Math.min(1, (now - started) / durationMs)
      const rotation = from + (to - from) * easeOutQuart(t)
      els.wheel.style.transform = `rotate(${rotation}rad)`

      const index = indexAtPointer(rotation, count)
      if (index !== lastIndex && count > 1) {
        lastIndex = index
        sounds.tick()
        els.pointer.classList.remove('tick')
        void els.pointer.offsetWidth // restart the CSS animation
        els.pointer.classList.add('tick')
      }
      if (t < 1) requestAnimationFrame(frame)
      else resolve()
    }
    requestAnimationFrame(frame)
  })

const showResult = (room: Room): Promise<void> =>
  new Promise((resolve) => {
    els.resultEmoji.textContent = room.emoji
    els.resultName.textContent = `${room.name}!`
    els.result.addEventListener('close', () => resolve(), { once: true })
    els.result.showModal()
  })

const spin = async (): Promise<void> => {
  const remaining = remainingRooms(state.picked)
  if (state.spinning || remaining.length === 0) return
  sounds.unlock()

  const reduced = prefersReducedMotion()
  const index = pickIndex(remaining.length, random())
  const room = remaining[index]!
  const to = targetRotation({
    current: state.rotation,
    index,
    count: remaining.length,
    turns: reduced ? 1 : 5,
    offset: (random() - 0.5) * 0.7, // land somewhere natural inside the slice, never on a line
  })

  setState({ spinning: true })
  await animateTo(state.rotation, to, reduced ? 900 : 4500, remaining.length)

  // Persist straight away so a reload mid-celebration doesn't lose the pick.
  const picked = withPick(state.picked, room.id)
  savePicked(picked)
  state = { ...state, rotation: to }

  sounds.cheer()
  const celebration = showResult(room)
  void burstConfetti(els.confetti, ROOMS.map((r) => r.colour), reduced ? 40 : 160)
  await celebration

  // Remove the room from the wheel only after the family has seen where it landed.
  setState({ picked, spinning: false })
  redrawWheel()
}

const reset = (): void => {
  if (state.spinning || state.picked.length === 0) return
  els.confirmReset.returnValue = ''
  els.confirmReset.addEventListener(
    'close',
    () => {
      if (els.confirmReset.returnValue !== 'reset') return
      savePicked([])
      setState({ picked: [] })
      redrawWheel()
    },
    { once: true },
  )
  els.confirmReset.showModal()
}

els.spin.addEventListener('click', () => void spin())
els.reset.addEventListener('click', reset)
els.mute.addEventListener('click', () => {
  const muted = !state.muted
  saveMuted(muted)
  setState({ muted })
})

new ResizeObserver(() => redrawWheel(true)).observe(els.wheel)
render()
// Canvas text doesn't wait for web fonts, so redraw once Fredoka is ready.
void document.fonts.load(`700 20px ${WHEEL_FONT}`).then(() => redrawWheel(true))
