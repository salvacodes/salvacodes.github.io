import { expect, it, vi } from 'vitest'
import { createDesktopPreferences, STYLE_KEY, WALLPAPER_KEY } from './desktop-preferences'
import type { PreferenceStorage } from './preference-storage'

const fakeStorage = (seed: Record<string, string> = {}): PreferenceStorage => {
  const entries = new Map(Object.entries(seed))
  return {
    read: (key) => entries.get(key),
    write: (key, value) => {
      entries.set(key, value)
    }
  }
}

it('defaults to the dark style and the default wallpaper', () => {
  const preferences = createDesktopPreferences({ storage: fakeStorage() })
  expect(preferences.getStyle()).toBe('dark')
  expect(preferences.getWallpaper()).toBe('signal')
})

it('seeds the style from the operating system when nothing is stored', () => {
  const preferences = createDesktopPreferences({ storage: fakeStorage(), prefersLight: () => true })
  expect(preferences.getStyle()).toBe('light')
})

it('prefers an explicit stored choice over the operating system', () => {
  const preferences = createDesktopPreferences({
    storage: fakeStorage({ [STYLE_KEY]: 'dark' }),
    prefersLight: () => true
  })
  expect(preferences.getStyle()).toBe('dark')
})

it('falls back to defaults when the stored values are not in the allowlist', () => {
  const preferences = createDesktopPreferences({
    storage: fakeStorage({ [STYLE_KEY]: 'solarized', [WALLPAPER_KEY]: 'url(https://evil.example/x.png)' })
  })
  expect(preferences.getStyle()).toBe('dark')
  expect(preferences.getWallpaper()).toBe('signal')
})

it('persists a new style so a later store reads it back', () => {
  const storage = fakeStorage()
  createDesktopPreferences({ storage }).setStyle('light')
  expect(createDesktopPreferences({ storage }).getStyle()).toBe('light')
})

it('persists a new wallpaper so a later store reads it back', () => {
  const storage = fakeStorage()
  createDesktopPreferences({ storage }).setWallpaper('grid')
  expect(createDesktopPreferences({ storage }).getWallpaper()).toBe('grid')
})

it('notifies subscribers when a preference changes', () => {
  const preferences = createDesktopPreferences({ storage: fakeStorage() })
  const listener = vi.fn()
  preferences.subscribe(listener)
  preferences.setStyle('light')
  preferences.setWallpaper('grid')
  expect(listener).toHaveBeenCalledTimes(2)
})

it('stops notifying after unsubscribe', () => {
  const preferences = createDesktopPreferences({ storage: fakeStorage() })
  const listener = vi.fn()
  preferences.subscribe(listener)()
  preferences.setStyle('light')
  expect(listener).not.toHaveBeenCalled()
})

it('does not notify when the value is unchanged', () => {
  const preferences = createDesktopPreferences({ storage: fakeStorage() })
  const listener = vi.fn()
  preferences.subscribe(listener)
  preferences.setStyle('dark')
  preferences.setWallpaper('signal')
  expect(listener).not.toHaveBeenCalled()
})

it('keeps working in memory when persistence silently fails', () => {
  const preferences = createDesktopPreferences({
    storage: { read: () => undefined, write: () => undefined }
  })
  preferences.setStyle('light')
  expect(preferences.getStyle()).toBe('light')
})
