import { afterEach, expect, it } from 'vitest'
import { createDesktopPreferences } from '../../preferences/desktop-preferences'
import type { PreferenceStorage } from '../../preferences/preference-storage'
import './appearance-panel'
import type { AppearancePanel } from './appearance-panel'

const fakeStorage = (): PreferenceStorage => {
  const entries = new Map<string, string>()
  return {
    read: (key) => entries.get(key),
    write: (key, value) => {
      entries.set(key, value)
    }
  }
}

const mount = (): AppearancePanel => {
  const panel = document.createElement('sc-appearance-panel') as AppearancePanel
  panel.preferences = createDesktopPreferences({ storage: fakeStorage() })
  document.body.append(panel)
  return panel
}

afterEach(() => {
  for (const element of document.querySelectorAll('sc-appearance-panel')) {
    element.remove()
  }
})

it('offers the two styles as a radio group', () => {
  const panel = mount()
  const group = panel.shadowRoot?.querySelector('[role="radiogroup"]')
  expect(group?.getAttribute('aria-label')).toBe('Style')
  expect(panel.shadowRoot?.querySelectorAll('[role="radio"]')).toHaveLength(2)
})

it('marks the current style as checked', () => {
  const panel = mount()
  expect(panel.shadowRoot?.querySelector('[data-style-id="dark"]')?.getAttribute('aria-checked')).toBe('true')
  expect(panel.shadowRoot?.querySelector('[data-style-id="light"]')?.getAttribute('aria-checked')).toBe('false')
})

it('changes the style when a swatch is chosen', () => {
  const panel = mount()
  panel.shadowRoot?.querySelector<HTMLElement>('[data-style-id="light"]')?.click()
  expect(panel.preferences.getStyle()).toBe('light')
  expect(panel.shadowRoot?.querySelector('[data-style-id="light"]')?.getAttribute('aria-checked')).toBe('true')
})

it('offers every wallpaper in the catalog', () => {
  const panel = mount()
  expect(panel.shadowRoot?.querySelectorAll('[data-wallpaper-id]')).toHaveLength(4)
})

it('renders each thumbnail as the real wallpaper surface', () => {
  const panel = mount()
  const thumbnail = panel.shadowRoot?.querySelector('[data-wallpaper-id="dragon"] .surface') as HTMLElement
  expect(thumbnail.dataset.variant).toBe('dragon')
})

it('marks the current wallpaper as pressed', () => {
  const panel = mount()
  expect(panel.shadowRoot?.querySelector('[data-wallpaper-id="signal"]')?.getAttribute('aria-pressed')).toBe('true')
})

it('changes the wallpaper when a thumbnail is chosen', () => {
  const panel = mount()
  panel.shadowRoot?.querySelector<HTMLElement>('[data-wallpaper-id="grid"]')?.click()
  expect(panel.preferences.getWallpaper()).toBe('grid')
  expect(panel.shadowRoot?.querySelector('[data-wallpaper-id="grid"]')?.getAttribute('aria-pressed')).toBe('true')
  expect(panel.shadowRoot?.querySelector('[data-wallpaper-id="signal"]')?.getAttribute('aria-pressed')).toBe('false')
})

it('follows a change made elsewhere', () => {
  const panel = mount()
  panel.preferences.setStyle('light')
  expect(panel.shadowRoot?.querySelector('[data-style-id="light"]')?.getAttribute('aria-checked')).toBe('true')
})
