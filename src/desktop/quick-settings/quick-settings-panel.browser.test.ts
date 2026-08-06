import { afterEach, expect, it, vi } from 'vitest'
import { createDesktopPreferences } from '../../preferences/desktop-preferences'
import type { PreferenceStorage } from '../../preferences/preference-storage'
import './quick-settings-panel'
import { QUICK_SETTINGS_FOOTER, QUICK_SETTINGS_SLIDERS } from './quick-settings-model'
import type { QuickSettingsPanel } from './quick-settings-panel'
import { QUICK_SETTINGS_ACTION_EVENT, QUICK_SETTINGS_DISMISSED_EVENT } from './quick-settings-panel'

const fakeStorage = (): PreferenceStorage => {
  const entries = new Map<string, string>()
  return {
    read: (key) => entries.get(key),
    write: (key, value) => {
      entries.set(key, value)
    }
  }
}

const mount = (): QuickSettingsPanel => {
  const panel = document.createElement('sc-quick-settings') as QuickSettingsPanel
  panel.preferences = createDesktopPreferences({ storage: fakeStorage() })
  document.body.append(panel)
  return panel
}

afterEach(() => {
  for (const element of document.querySelectorAll('sc-quick-settings')) {
    element.remove()
  }
})

it('starts closed', () => {
  expect(mount().isOpen).toBe(false)
})

it('renders four tiles, two sliders and three footer actions when open', () => {
  const panel = mount()
  panel.open()
  expect(panel.shadowRoot?.querySelectorAll('[data-tile-id]')).toHaveLength(4)
  expect(panel.shadowRoot?.querySelectorAll('input[type="range"]')).toHaveLength(2)
  expect(panel.shadowRoot?.querySelectorAll('[data-action-id]')).toHaveLength(3)
})

it('disables the sliders natively so they cannot be dragged', () => {
  const panel = mount()
  panel.open()
  for (const slider of panel.shadowRoot?.querySelectorAll<HTMLInputElement>('input[type="range"]') ?? []) {
    expect(slider.disabled).toBe(true)
  }
})

it('marks the unimplemented tiles as disabled but keeps them reachable', () => {
  const panel = mount()
  panel.open()
  const wired = panel.shadowRoot?.querySelector<HTMLElement>('[data-tile-id="wired"]')
  expect(wired?.getAttribute('aria-disabled')).toBe('true')
  expect(wired?.tabIndex).toBe(0)
})

it('reflects the current style on the dark style tile', () => {
  const panel = mount()
  panel.open()
  const tile = panel.shadowRoot?.querySelector<HTMLElement>('[data-tile-id="dark-style"]')
  expect(tile?.getAttribute('aria-pressed')).toBe('true')
})

it('switches to the light style when the dark style tile is clicked', () => {
  const panel = mount()
  panel.open()
  panel.shadowRoot?.querySelector<HTMLElement>('[data-tile-id="dark-style"]')?.click()
  expect(panel.preferences.getStyle()).toBe('light')
  expect(panel.shadowRoot?.querySelector('[data-tile-id="dark-style"]')?.getAttribute('aria-pressed')).toBe('false')
})

it('names the style the tile is currently showing', () => {
  const panel = mount()
  panel.open()
  const tile = panel.shadowRoot?.querySelector<HTMLElement>('[data-tile-id="dark-style"]')
  expect(tile?.textContent).toContain('Dark Style')
  tile?.click()
  expect(tile?.textContent).toContain('Light Style')
  tile?.click()
  expect(tile?.textContent).toContain('Dark Style')
})

it('does nothing when a disabled tile is clicked', () => {
  const panel = mount()
  panel.open()
  panel.shadowRoot?.querySelector<HTMLElement>('[data-tile-id="airplane"]')?.click()
  expect(panel.isOpen).toBe(true)
  expect(panel.preferences.getStyle()).toBe('dark')
})

it('announces an enabled footer action and closes', () => {
  const panel = mount()
  const seen: string[] = []
  document.addEventListener(
    QUICK_SETTINGS_ACTION_EVENT,
    (event) => seen.push((event as CustomEvent<{ actionId: string }>).detail.actionId),
    { once: true }
  )
  panel.open()
  panel.shadowRoot?.querySelector<HTMLElement>('[data-action-id="settings"]')?.click()
  expect(seen).toEqual(['settings'])
  expect(panel.isOpen).toBe(false)
})

it('does not announce a disabled footer action', () => {
  const panel = mount()
  const listener = vi.fn()
  document.addEventListener(QUICK_SETTINGS_ACTION_EVENT, listener)
  panel.open()
  panel.shadowRoot?.querySelector<HTMLElement>('[data-action-id="lock"]')?.click()
  document.removeEventListener(QUICK_SETTINGS_ACTION_EVENT, listener)
  expect(listener).not.toHaveBeenCalled()
  expect(panel.isOpen).toBe(true)
})

it('focuses the first enabled control on open', () => {
  const panel = mount()
  panel.open()
  expect(panel.shadowRoot?.activeElement?.getAttribute('data-tile-id')).toBe('dark-style')
})

it('closes on escape, returns focus and announces the dismissal', () => {
  const trigger = document.createElement('button')
  document.body.append(trigger)
  const panel = mount()
  const seen: Event[] = []
  document.addEventListener(QUICK_SETTINGS_DISMISSED_EVENT, (event) => seen.push(event), { once: true })
  panel.open(trigger)
  panel.shadowRoot
    ?.querySelector('[role="dialog"]')
    ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  expect(panel.isOpen).toBe(false)
  expect(document.activeElement).toBe(trigger)
  expect(seen).toHaveLength(1)
  trigger.remove()
})

it('closes on a pointerdown outside the panel', () => {
  const panel = mount()
  panel.open()
  document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }))
  expect(panel.isOpen).toBe(false)
})

it('exposes itself as a labelled dialog', () => {
  const panel = mount()
  panel.open()
  const dialog = panel.shadowRoot?.querySelector('[role="dialog"]')
  expect(dialog?.getAttribute('aria-label')).toBe('System menu')
})

it('renders an icon for every slider and every footer action', () => {
  const panel = mount()
  panel.open()
  const sliderIcons = panel.shadowRoot?.querySelectorAll('.slider svg')
  const actionIcons = panel.shadowRoot?.querySelectorAll('.action svg')
  expect(sliderIcons).toHaveLength(QUICK_SETTINGS_SLIDERS.length)
  expect(actionIcons).toHaveLength(QUICK_SETTINGS_FOOTER.length)
})
