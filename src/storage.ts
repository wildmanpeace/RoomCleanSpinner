import { isRoomId, type RoomId } from './rooms'

const PICKED_KEY = 'room-spinner:picked:v1'
const MUTED_KEY = 'room-spinner:muted:v1'

/**
 * Parses the stored list of picked rooms. Anything malformed (hand-edited storage,
 * an old schema) deliberately falls back to "nothing picked": the only consequence
 * is a fresh wheel, which is exactly what Reset would do anyway.
 */
export const parsePicked = (raw: string | null): readonly RoomId[] => {
  if (raw === null) return []
  try {
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value) || !value.every(isRoomId)) return []
    return new Set(value).size === value.length ? value : []
  } catch {
    // Invalid JSON: same recovery as any other malformed value (see above).
    return []
  }
}

/** localStorage can throw (private mode, blocked storage); the app still works, it just won't remember. */
const safely = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn()
  } catch (error) {
    console.warn('Room spinner: storage unavailable', error)
    return fallback
  }
}

export const loadPicked = (): readonly RoomId[] =>
  safely(() => parsePicked(localStorage.getItem(PICKED_KEY)), [])

export const savePicked = (picked: readonly RoomId[]): void =>
  safely(() => localStorage.setItem(PICKED_KEY, JSON.stringify(picked)), undefined)

export const loadMuted = (): boolean => safely(() => localStorage.getItem(MUTED_KEY) === 'true', false)

export const saveMuted = (muted: boolean): void =>
  safely(() => localStorage.setItem(MUTED_KEY, String(muted)), undefined)
