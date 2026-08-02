import { expect, it } from 'vitest'
import { formatClock } from './top-bar'

it('formats the date gnome-style', () => {
  expect(formatClock(new Date(2026, 6, 25, 14, 32))).toBe('Jul 25 14:32')
})

it('zero-pads minutes and hours', () => {
  expect(formatClock(new Date(2026, 0, 3, 9, 5))).toBe('Jan 3 09:05')
})
