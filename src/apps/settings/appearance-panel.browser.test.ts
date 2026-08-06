import { expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { createDesktopPreferences } from '../../preferences/desktop-preferences'
import { WALLPAPERS } from '../../preferences/wallpaper-catalog'
import { fakePreferenceStorage } from '../../test-support/fake-preference-storage'
import { mount } from '../../test-support/mount'
import './appearance-panel'
import type { AppearancePanel } from './appearance-panel'

const mountPanel = (): AppearancePanel =>
  mount<AppearancePanel>('sc-appearance-panel', {
    preferences: createDesktopPreferences({ storage: fakePreferenceStorage() })
  })

const styleGroup = () => page.getByRole('radiogroup', { name: 'Style' })

const style = (name: string) => styleGroup().getByRole('radio', { name })

const wallpaper = (name: string) => page.getByRole('button', { name })

it('offers every style as a radio in a labelled group', () => {
  mountPanel()
  expect(styleGroup().getByRole('radio').elements().length).toBe(2)
})

it('marks the current style as checked', () => {
  mountPanel()
  expect(style('Dark').element().getAttribute('aria-checked')).toBe('true')
  expect(style('Light').element().getAttribute('aria-checked')).toBe('false')
})

it('changes the style when a swatch is chosen', async () => {
  const panel = mountPanel()

  await style('Light').click()

  expect(panel.preferences.getStyle()).toBe('light')
  expect(style('Light').element().getAttribute('aria-checked')).toBe('true')
})

it('offers every wallpaper in the catalog', () => {
  mountPanel()
  for (const candidate of WALLPAPERS) {
    expect(wallpaper(candidate.label).elements(), `${candidate.label} should be offered`).toHaveLength(1)
  }
})

it('marks the current wallpaper as pressed', () => {
  mountPanel()
  expect(wallpaper('Signal').element().getAttribute('aria-pressed')).toBe('true')
})

it('changes the wallpaper when a thumbnail is chosen', async () => {
  const panel = mountPanel()

  await wallpaper('Grid').click()

  expect(panel.preferences.getWallpaper()).toBe('grid')
  expect(wallpaper('Grid').element().getAttribute('aria-pressed')).toBe('true')
  expect(wallpaper('Signal').element().getAttribute('aria-pressed')).toBe('false')
})

it('follows a change made elsewhere', () => {
  const panel = mountPanel()

  panel.preferences.setStyle('light')

  expect(style('Light').element().getAttribute('aria-checked')).toBe('true')
})
