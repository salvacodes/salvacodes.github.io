import { expect, it } from 'vitest'
import { createDesktopPreferences } from './desktop-preferences'
import type { PreferenceStorage } from './preference-storage'

const fakeStorage = (): PreferenceStorage => {
  const entries = new Map<string, string>()
  return {
    read: (key) => entries.get(key),
    write: (key, value) => {
      entries.set(key, value)
    }
  }
}

it('writes the current preferences onto a root element as data attributes', () => {
  const root = document.createElement('div')
  createDesktopPreferences({ storage: fakeStorage() }).applyTo(root)
  expect(root.dataset.style).toBe('dark')
  expect(root.dataset.wallpaper).toBe('signal')
})

it('keeps the root in sync when a preference changes', () => {
  const root = document.createElement('div')
  const preferences = createDesktopPreferences({ storage: fakeStorage() })
  preferences.applyTo(root)
  preferences.setStyle('light')
  preferences.setWallpaper('dragon')
  expect(root.dataset.style).toBe('light')
  expect(root.dataset.wallpaper).toBe('dragon')
})
