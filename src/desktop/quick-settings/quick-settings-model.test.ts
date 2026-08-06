import { expect, it } from 'vitest'
import {
  BATTERY_LABEL,
  DARK_STYLE_TILE_ID,
  POWER_ACTION_ID,
  QUICK_SETTINGS_FOOTER,
  QUICK_SETTINGS_SLIDERS,
  QUICK_SETTINGS_TILES,
  SETTINGS_ACTION_ID
} from './quick-settings-model'

it('lays out a two by two tile grid', () => {
  expect(QUICK_SETTINGS_TILES).toHaveLength(4)
})

it('enables exactly one tile, and it is dark style', () => {
  const enabled = QUICK_SETTINGS_TILES.filter((tile) => !tile.disabled)
  expect(enabled.map((tile) => tile.id)).toEqual([DARK_STYLE_TILE_ID])
})

it('marks the network tiles as having a submenu', () => {
  const withSubmenu = QUICK_SETTINGS_TILES.filter((tile) => tile.hasSubmenu).map((tile) => tile.id)
  expect(withSubmenu).toEqual(['wired', 'bluetooth'])
})

it('offers two disabled sliders', () => {
  expect(QUICK_SETTINGS_SLIDERS.map((slider) => slider.id)).toEqual(['volume', 'brightness'])
})

it('enables only settings and power in the footer', () => {
  const enabled = QUICK_SETTINGS_FOOTER.filter((action) => !action.disabled).map((action) => action.id)
  expect(enabled).toEqual([SETTINGS_ACTION_ID, POWER_ACTION_ID])
})

it('keeps the lock action disabled', () => {
  expect(QUICK_SETTINGS_FOOTER.find((action) => action.id === 'lock')?.disabled).toBe(true)
})

it('gives every control a unique id and a label', () => {
  const controls = [...QUICK_SETTINGS_SLIDERS, ...QUICK_SETTINGS_TILES, ...QUICK_SETTINGS_FOOTER]
  expect(new Set(controls.map((control) => control.id)).size).toBe(controls.length)
  for (const control of controls) {
    expect(control.label.length).toBeGreaterThan(0)
  }
})

it('shows a battery reading', () => {
  expect(BATTERY_LABEL).toMatch(/^\d+%$/)
})
