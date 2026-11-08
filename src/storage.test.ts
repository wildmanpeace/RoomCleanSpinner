import { describe, expect, it } from 'vitest'
import { parsePicked } from './storage'

describe('parsePicked', () => {
  it('returns [] when nothing is stored yet', () => {
    expect(parsePicked(null)).toEqual([])
  })

  it('parses a valid list of room ids in order', () => {
    expect(parsePicked('["kitchen","loft"]')).toEqual(['kitchen', 'loft'])
  })

  it.each([
    ['not json', '{oops'],
    ['not an array', '{"a":1}'],
    ['non-string entry', '["kitchen",3]'],
    ['unknown room', '["kitchen","garage"]'],
    ['duplicate room', '["kitchen","kitchen"]'],
  ])('falls back to [] for %s', (_label, raw) => {
    expect(parsePicked(raw)).toEqual([])
  })
})
