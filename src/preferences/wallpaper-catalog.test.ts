import { expect, it } from 'vitest'
import { DEFAULT_WALLPAPER, isWallpaperId, toWallpaperId, WALLPAPERS } from './wallpaper-catalog'

it('offers four wallpapers, each with a label', () => {
  expect(WALLPAPERS).toHaveLength(4)
  for (const wallpaper of WALLPAPERS) {
    expect(wallpaper.label.length).toBeGreaterThan(0)
  }
})

it('has no duplicate ids', () => {
  expect(new Set(WALLPAPERS.map((wallpaper) => wallpaper.id)).size).toBe(WALLPAPERS.length)
})

it('defaults to a wallpaper that is in the catalog', () => {
  expect(isWallpaperId(DEFAULT_WALLPAPER)).toBe(true)
})

it('rejects ids outside the allowlist', () => {
  expect(isWallpaperId('../../etc/passwd')).toBe(false)
  expect(isWallpaperId('url(https://evil.example/x.png)')).toBe(false)
  expect(isWallpaperId(null)).toBe(false)
})

it('falls back to the default for unknown ids', () => {
  expect(toWallpaperId('url(https://evil.example/x.png)')).toBe(DEFAULT_WALLPAPER)
})

it('keeps a known id', () => {
  expect(toWallpaperId('grid')).toBe('grid')
})
