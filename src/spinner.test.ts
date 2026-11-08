import { describe, expect, it } from 'vitest'
import { ROOMS } from './rooms'
import {
  indexAtPointer,
  pickIndex,
  remainingRooms,
  targetRotation,
  withPick,
} from './spinner'

const TAU = Math.PI * 2

describe('remainingRooms', () => {
  it('returns every room when nothing has been picked', () => {
    expect(remainingRooms([])).toEqual(ROOMS)
  })

  it('excludes picked rooms and keeps original order', () => {
    const remaining = remainingRooms(['kitchen', 'loft'])
    expect(remaining.map((r) => r.id)).toEqual([
      'ben',
      'charlie',
      'della',
      'parents',
      'living',
      'dining',
    ])
  })

  it('is empty when every room has been picked', () => {
    expect(remainingRooms(ROOMS.map((r) => r.id))).toEqual([])
  })
})

describe('withPick', () => {
  it('appends the pick without mutating the input', () => {
    const before = Object.freeze(['loft'] as const)
    const after = withPick(before, 'kitchen')
    expect(after).toEqual(['loft', 'kitchen'])
    expect(before).toEqual(['loft'])
  })

  it('throws when the room was already picked', () => {
    expect(() => withPick(['loft'], 'loft')).toThrow(/already picked: loft/)
  })
})

describe('pickIndex', () => {
  it.each([
    [0, 8, 0],
    [0.999999, 8, 7],
    [0.5, 8, 4],
    [0.49, 3, 1],
    [0, 1, 0],
    [0.99, 1, 0],
  ])('random %f over %i slices → %i', (random, count, expected) => {
    expect(pickIndex(count, random)).toBe(expected)
  })

  it('throws when there is nothing to pick', () => {
    expect(() => pickIndex(0, 0.5)).toThrow(RangeError)
  })

  it('throws on a random value outside [0, 1)', () => {
    expect(() => pickIndex(8, 1)).toThrow(RangeError)
    expect(() => pickIndex(8, -0.1)).toThrow(RangeError)
  })
})

describe('indexAtPointer', () => {
  // Slices are laid out clockwise from 12 o'clock; positive rotation turns the
  // wheel clockwise, so the slice just counter-clockwise of the top moves under
  // the pointer. Hand-derived for 4 slices of 90° each.
  it.each([
    [0, 0], // unrotated: slice 0 starts at the top
    [Math.PI / 4, 3], // 45° clockwise: slice 3 (270°–360°) now under pointer
    [Math.PI / 2 + 0.01, 2], // just past 90°: original 269.4° point → slice 2
    [Math.PI + 0.01, 1], // just past 180°: original 179.4° point → slice 1
    [-Math.PI / 4, 0], // 45° counter-clockwise: middle of slice 0
    [-(Math.PI / 2 + 0.01), 1],
    [TAU * 5 + Math.PI / 4, 3], // whole turns don't matter
  ])('rotation %f over 4 slices → %i', (rotation, expected) => {
    expect(indexAtPointer(rotation, 4)).toBe(expected)
  })

  it('always returns 0 for a single slice', () => {
    expect(indexAtPointer(1.234, 1)).toBe(0)
  })
})

describe('targetRotation', () => {
  it('lands on every slice for every wheel size', () => {
    for (let count = 1; count <= 8; count++) {
      for (let index = 0; index < count; index++) {
        for (const offset of [-0.4, 0, 0.4]) {
          const r = targetRotation({ current: 1.7, index, count, turns: 5, offset })
          expect(indexAtPointer(r, count), `count=${count} index=${index} offset=${offset}`).toBe(index)
        }
      }
    }
  })

  it('spins forward by at least the requested number of turns, but less than one extra', () => {
    const current = 3
    const r = targetRotation({ current, index: 2, count: 8, turns: 5, offset: 0 })
    expect(r - current).toBeGreaterThanOrEqual(5 * TAU)
    expect(r - current).toBeLessThan(6 * TAU)
  })

  it('centres the slice under the pointer when offset is 0 (hand-derived, 4 slices)', () => {
    // Slice 1 spans 90°–180°; its centre is 135°. Turning the wheel clockwise by
    // 360° − 135° = 225° brings that centre to the top.
    const r = targetRotation({ current: 0, index: 1, count: 4, turns: 0, offset: 0 })
    expect(r).toBeCloseTo((225 * Math.PI) / 180)
  })

  it('rejects an offset that would leave the slice', () => {
    expect(() => targetRotation({ current: 0, index: 0, count: 4, turns: 1, offset: 0.5 })).toThrow(RangeError)
  })
})
