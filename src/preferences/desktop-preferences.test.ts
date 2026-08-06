import { expect, it, vi } from 'vitest'
import { fakePreferenceStorage } from '../test-support/fake-preference-storage'
import { createDesktopPreferences, STYLE_KEY, WALLPAPER_KEY } from './desktop-preferences'

it('defaults to the dark style and the default wallpaper', () => {
  const preferences = createDesktopPreferences({ storage: fakePreferenceStorage() })
  expect(preferences.getStyle()).toBe('dark')
  expect(preferences.getWallpaper()).toBe('signal')
})

it('seeds the style from the operating system when nothing is stored', () => {
  const preferences = createDesktopPreferences({ storage: fakePreferenceStorage(), prefersLight: () => true })
  expect(preferences.getStyle()).toBe('light')
})

it('prefers an explicit stored choice over the operating system', () => {
  const preferences = createDesktopPreferences({
    storage: fakePreferenceStorage({ [STYLE_KEY]: 'dark' }),
    prefersLight: () => true
  })
  expect(preferences.getStyle()).toBe('dark')
})

it('falls back to defaults when the stored values are not in the allowlist', () => {
  const preferences = createDesktopPreferences({
    storage: fakePreferenceStorage({ [STYLE_KEY]: 'solarized', [WALLPAPER_KEY]: 'url(https://evil.example/x.png)' })
  })
  expect(preferences.getStyle()).toBe('dark')
  expect(preferences.getWallpaper()).toBe('signal')
})

it('persists a new style so a later store reads it back', () => {
  const storage = fakePreferenceStorage()
  createDesktopPreferences({ storage }).setStyle('light')
  expect(createDesktopPreferences({ storage }).getStyle()).toBe('light')
})

it('persists a new wallpaper so a later store reads it back', () => {
  const storage = fakePreferenceStorage()
  createDesktopPreferences({ storage }).setWallpaper('grid')
  expect(createDesktopPreferences({ storage }).getWallpaper()).toBe('grid')
})

it('notifies subscribers when a preference changes', () => {
  const preferences = createDesktopPreferences({ storage: fakePreferenceStorage() })
  const listener = vi.fn()
  preferences.subscribe(listener)
  preferences.setStyle('light')
  preferences.setWallpaper('grid')
  expect(listener).toHaveBeenCalledTimes(2)
})

it('stops notifying after unsubscribe', () => {
  const preferences = createDesktopPreferences({ storage: fakePreferenceStorage() })
  const listener = vi.fn()
  preferences.subscribe(listener)()
  preferences.setStyle('light')
  expect(listener).not.toHaveBeenCalled()
})

it('does not notify when the value is unchanged', () => {
  const preferences = createDesktopPreferences({ storage: fakePreferenceStorage() })
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
