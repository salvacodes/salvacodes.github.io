import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { LONG_PRESS_DURATION_MS, observeLongPress } from './long-press'

const touch = (type: string, x: number, y: number): PointerEvent =>
  new PointerEvent(type, { pointerType: 'touch', clientX: x, clientY: y, bubbles: true })

const mouse = (type: string, x: number, y: number): PointerEvent =>
  new PointerEvent(type, { pointerType: 'mouse', clientX: x, clientY: y, bubbles: true })

let target: HTMLElement
let teardown: () => void

beforeEach(() => {
  vi.useFakeTimers()
  target = document.createElement('div')
  document.body.append(target)
})

afterEach(() => {
  teardown?.()
  target.remove()
  vi.useRealTimers()
})

it('reports the press origin after the hold duration', () => {
  const onLongPress = vi.fn()
  teardown = observeLongPress(target, onLongPress)
  target.dispatchEvent(touch('pointerdown', 120, 240))
  vi.advanceTimersByTime(LONG_PRESS_DURATION_MS)
  expect(onLongPress).toHaveBeenCalledWith({ x: 120, y: 240 })
})

it('does not fire before the hold duration elapses', () => {
  const onLongPress = vi.fn()
  teardown = observeLongPress(target, onLongPress)
  target.dispatchEvent(touch('pointerdown', 120, 240))
  vi.advanceTimersByTime(LONG_PRESS_DURATION_MS - 50)
  expect(onLongPress).not.toHaveBeenCalled()
})

it('ignores mouse pointers so it never fights window dragging', () => {
  const onLongPress = vi.fn()
  teardown = observeLongPress(target, onLongPress)
  target.dispatchEvent(mouse('pointerdown', 120, 240))
  vi.advanceTimersByTime(LONG_PRESS_DURATION_MS)
  expect(onLongPress).not.toHaveBeenCalled()
})

it('cancels when the pointer moves beyond tolerance', () => {
  const onLongPress = vi.fn()
  teardown = observeLongPress(target, onLongPress)
  target.dispatchEvent(touch('pointerdown', 120, 240))
  target.dispatchEvent(touch('pointermove', 200, 240))
  vi.advanceTimersByTime(LONG_PRESS_DURATION_MS)
  expect(onLongPress).not.toHaveBeenCalled()
})

it('cancels when the pointer lifts early', () => {
  const onLongPress = vi.fn()
  teardown = observeLongPress(target, onLongPress)
  target.dispatchEvent(touch('pointerdown', 120, 240))
  target.dispatchEvent(touch('pointerup', 120, 240))
  vi.advanceTimersByTime(LONG_PRESS_DURATION_MS)
  expect(onLongPress).not.toHaveBeenCalled()
})

it('stops observing after teardown', () => {
  const onLongPress = vi.fn()
  teardown = observeLongPress(target, onLongPress)
  teardown()
  target.dispatchEvent(touch('pointerdown', 120, 240))
  vi.advanceTimersByTime(LONG_PRESS_DURATION_MS)
  expect(onLongPress).not.toHaveBeenCalled()
})
