import { expect, it } from 'vitest'
import { isSeparator, placeMenu } from './context-menu-model'

const MENU = { width: 200, height: 300 }
const VIEWPORT = { width: 1280, height: 800 }

it('places the menu at the anchor when it fits', () => {
  expect(placeMenu({ x: 100, y: 100 }, MENU, VIEWPORT)).toEqual({ x: 100, y: 100 })
})

it('flips left when the menu would overflow the right edge', () => {
  expect(placeMenu({ x: 1200, y: 100 }, MENU, VIEWPORT)).toEqual({ x: 1000, y: 100 })
})

it('flips up when the menu would overflow the bottom edge', () => {
  expect(placeMenu({ x: 100, y: 700 }, MENU, VIEWPORT)).toEqual({ x: 100, y: 400 })
})

it('flips both ways in a corner', () => {
  expect(placeMenu({ x: 1200, y: 700 }, MENU, VIEWPORT)).toEqual({ x: 1000, y: 400 })
})

it('never places the menu under the top bar', () => {
  expect(placeMenu({ x: 100, y: 4 }, MENU, VIEWPORT).y).toBe(32)
})

it('clamps a menu taller than the work area to the top of it', () => {
  expect(placeMenu({ x: 100, y: 100 }, { width: 200, height: 900 }, VIEWPORT).y).toBe(32)
})

it('clamps a menu wider than the viewport to the left edge', () => {
  expect(placeMenu({ x: 100, y: 100 }, { width: 1400, height: 300 }, VIEWPORT).x).toBe(0)
})

it('recognises separators', () => {
  expect(isSeparator({ separator: true })).toBe(true)
  expect(isSeparator({ id: 'close', label: 'Close' })).toBe(false)
})
