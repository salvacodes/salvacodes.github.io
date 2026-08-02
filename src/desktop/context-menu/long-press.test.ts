import { expect, it } from 'vitest'
import { isWithinTolerance } from './long-press'

it('accepts a pointer that has not moved', () => {
  expect(isWithinTolerance({ x: 100, y: 100 }, { x: 100, y: 100 })).toBe(true)
})

it('accepts movement inside the tolerance radius', () => {
  expect(isWithinTolerance({ x: 100, y: 100 }, { x: 106, y: 108 })).toBe(true)
})

it('rejects movement beyond the tolerance radius', () => {
  expect(isWithinTolerance({ x: 100, y: 100 }, { x: 109, y: 109 })).toBe(false)
})
