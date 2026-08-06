export interface QuickSettingsSlider {
  id: string
  label: string
  value: number
}

export interface QuickSettingsTile {
  id: string
  label: string
  disabled: boolean
  hasSubmenu: boolean
}

export interface QuickSettingsFooterAction {
  id: string
  label: string
  disabled: boolean
}

export const DARK_STYLE_TILE_ID = 'dark-style'
export const SETTINGS_ACTION_ID = 'settings'
export const POWER_ACTION_ID = 'power'

export const BATTERY_LABEL = '87%'

export const QUICK_SETTINGS_SLIDERS: readonly QuickSettingsSlider[] = [
  { id: 'volume', label: 'Volume', value: 65 },
  { id: 'brightness', label: 'Brightness', value: 40 }
]

export const QUICK_SETTINGS_TILES: readonly QuickSettingsTile[] = [
  { id: 'wired', label: 'Wired', disabled: true, hasSubmenu: true },
  { id: 'bluetooth', label: 'Bluetooth', disabled: true, hasSubmenu: true },
  { id: DARK_STYLE_TILE_ID, label: 'Dark Style', disabled: false, hasSubmenu: false },
  { id: 'airplane', label: 'Airplane Mode', disabled: true, hasSubmenu: false }
]

export const QUICK_SETTINGS_FOOTER: readonly QuickSettingsFooterAction[] = [
  { id: SETTINGS_ACTION_ID, label: 'Settings', disabled: false },
  { id: 'lock', label: 'Lock Screen', disabled: true },
  { id: POWER_ACTION_ID, label: 'Power Off', disabled: false }
]
