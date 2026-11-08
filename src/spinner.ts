import { ROOMS, type Room, type RoomId } from './rooms'

const TAU = Math.PI * 2

/** Always-positive modulo, so negative rotations wrap correctly. */
const mod = (n: number, m: number): number => ((n % m) + m) % m

export const remainingRooms = (picked: readonly RoomId[]): readonly Room[] =>
  ROOMS.filter((room) => !picked.includes(room.id))

export const withPick = (picked: readonly RoomId[], id: RoomId): readonly RoomId[] => {
  if (picked.includes(id)) throw new Error(`Room already picked: ${id}`)
  return [...picked, id]
}

/** Maps a uniform random number in [0, 1) to a slice index. */
export const pickIndex = (count: number, random: number): number => {
  if (!Number.isInteger(count) || count < 1) throw new RangeError(`Nothing to pick from (count=${count})`)
  if (!(random >= 0 && random < 1)) throw new RangeError(`random must be in [0, 1), got ${random}`)
  return Math.floor(random * count)
}

/**
 * Which slice sits under the 12 o'clock pointer.
 * Slices are laid out clockwise from the top; positive rotation turns the wheel clockwise.
 */
export const indexAtPointer = (rotation: number, count: number): number => {
  const segment = TAU / count
  // Clamp guards the float edge where mod(...) returns a value a hair under TAU.
  return Math.min(count - 1, Math.floor(mod(-rotation, TAU) / segment))
}

export type SpinTarget = Readonly<{
  current: number
  index: number
  count: number
  /** Minimum whole turns before landing. */
  turns: number
  /** Where in the slice to land, as a fraction of a slice from its centre; must be in (-0.5, 0.5). */
  offset: number
}>

/** The final rotation that lands `index` under the pointer after at least `turns` full turns. */
export const targetRotation = ({ current, index, count, turns, offset }: SpinTarget): number => {
  if (!(Math.abs(offset) < 0.5)) throw new RangeError(`offset must be in (-0.5, 0.5), got ${offset}`)
  const segment = TAU / count
  const landing = mod(-(index + 0.5 + offset) * segment, TAU)
  const base = current + turns * TAU
  return base + mod(landing - base, TAU)
}
