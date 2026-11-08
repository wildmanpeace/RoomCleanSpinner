export type RoomId =
  | 'loft'
  | 'ben'
  | 'charlie'
  | 'della'
  | 'parents'
  | 'living'
  | 'dining'
  | 'kitchen'

export type Room = Readonly<{
  id: RoomId
  /** Full name for the result banner. */
  name: string
  /** Short label that fits on a wheel slice. */
  label: string
  emoji: string
  colour: string
}>

export const ROOMS: readonly Room[] = Object.freeze([
  { id: 'loft', name: 'The Loft', label: 'Loft', emoji: '🪜', colour: '#ff5d73' },
  { id: 'ben', name: "Ben's Bedroom", label: "Ben's", emoji: '🚀', colour: '#ff9f1c' },
  { id: 'charlie', name: "Charlie's Bedroom", label: "Charlie's", emoji: '🦖', colour: '#ffd23f' },
  { id: 'della', name: "Della's Bedroom", label: "Della's", emoji: '🦄', colour: '#3bceac' },
  { id: 'parents', name: "Mom & Dad's Bedroom", label: 'Mom & Dad', emoji: '💖', colour: '#0ead69' },
  { id: 'living', name: 'Living Room', label: 'Living', emoji: '🛋️', colour: '#3a86ff' },
  { id: 'dining', name: 'Dining Room', label: 'Dining', emoji: '🍽️', colour: '#8338ec' },
  { id: 'kitchen', name: 'Kitchen', label: 'Kitchen', emoji: '🍳', colour: '#ff006e' },
] as const)

const ROOM_IDS: ReadonlySet<string> = new Set(ROOMS.map((r) => r.id))

export const isRoomId = (value: unknown): value is RoomId =>
  typeof value === 'string' && ROOM_IDS.has(value)
