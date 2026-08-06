import { expect, it } from 'vitest'
import { fakePreferenceStorage } from '../test-support/fake-preference-storage'
import { createDesktopPreferences } from './desktop-preferences'

it('writes the current preferences onto a root element as data attributes', () => {
  const root = document.createElement('div')
  createDesktopPreferences({ storage: fakePreferenceStorage() }).applyTo(root)
  expect(root.dataset.style).toBe('dark')
  expect(root.dataset.wallpaper).toBe('signal')
})

it('keeps the root in sync when a preference changes', () => {
  const root = document.createElement('div')
  const preferences = createDesktopPreferences({ storage: fakePreferenceStorage() })
  preferences.applyTo(root)
  preferences.setStyle('light')
  preferences.setWallpaper('dragon')
  expect(root.dataset.style).toBe('light')
  expect(root.dataset.wallpaper).toBe('dragon')
})
