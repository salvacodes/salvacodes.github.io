import { expect, it } from 'vitest'
import { DEFAULT_STYLE, isDesktopStyle, toDesktopStyle } from './style-catalog'

it('recognises the two known styles', () => {
  expect(isDesktopStyle('dark')).toBe(true)
  expect(isDesktopStyle('light')).toBe(true)
})

it('rejects anything outside the allowlist', () => {
  expect(isDesktopStyle('solarized')).toBe(false)
  expect(isDesktopStyle('')).toBe(false)
  expect(isDesktopStyle(null)).toBe(false)
  expect(isDesktopStyle(7)).toBe(false)
  expect(isDesktopStyle({ toString: () => 'dark' })).toBe(false)
})

it('falls back to the default style for unknown values', () => {
  expect(toDesktopStyle('nonsense')).toBe(DEFAULT_STYLE)
  expect(toDesktopStyle(undefined)).toBe(DEFAULT_STYLE)
})

it('keeps a known style', () => {
  expect(toDesktopStyle('light')).toBe('light')
})

it('uses the supplied fallback when nothing is stored', () => {
  expect(toDesktopStyle(undefined, 'light')).toBe('light')
})

it('ignores the supplied fallback when a known style is stored', () => {
  expect(toDesktopStyle('dark', 'light')).toBe('dark')
})
