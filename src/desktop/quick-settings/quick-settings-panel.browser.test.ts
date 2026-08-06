import { expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { createDesktopPreferences } from '../../preferences/desktop-preferences'
import { fakePreferenceStorage } from '../../test-support/fake-preference-storage'
import { mount } from '../../test-support/mount'
import './quick-settings-panel'
import type { QuickSettingsPanel } from './quick-settings-panel'
import { QUICK_SETTINGS_ACTION_EVENT, QUICK_SETTINGS_DISMISSED_EVENT } from './quick-settings-panel'

const mountPanel = (): QuickSettingsPanel =>
  mount<QuickSettingsPanel>('sc-quick-settings', {
    preferences: createDesktopPreferences({ storage: fakePreferenceStorage() })
  })

const openPanel = (returnFocusTo?: HTMLElement): QuickSettingsPanel => {
  const panel = mountPanel()
  panel.open(returnFocusTo)
  return panel
}

const systemMenu = () => page.getByRole('dialog', { name: 'System menu' })

const control = (name: string) => systemMenu().getByRole('button', { name })

const styleTile = () => systemMenu().getByRole('button', { name: /Style$/ })

const clickAnyway = (name: string) => (control(name).element() as HTMLElement).click()

it('starts closed', () => {
  expect(mountPanel().isOpen).toBe(false)
})

it('exposes itself as a labelled dialog', () => {
  openPanel()
  expect(systemMenu().elements()).toHaveLength(1)
})

it('disables the sliders natively so they cannot be dragged', () => {
  openPanel()
  const sliders = systemMenu().getByRole('slider').elements() as HTMLInputElement[]
  expect(sliders.length).toBeGreaterThan(0)
  for (const slider of sliders) {
    expect(slider.disabled).toBe(true)
  }
})

it('marks the unimplemented tiles as disabled but keeps them reachable', () => {
  openPanel()
  const wired = control('Wired').element()
  expect(wired.getAttribute('aria-disabled')).toBe('true')
  expect((wired as HTMLElement).tabIndex).toBe(0)
})

it('reflects the current style on the style tile', () => {
  openPanel()
  expect(styleTile().element().getAttribute('aria-pressed')).toBe('true')
})

it('switches to the light style when the style tile is clicked', async () => {
  const panel = openPanel()

  await styleTile().click()

  expect(panel.preferences.getStyle()).toBe('light')
  expect(styleTile().element().getAttribute('aria-pressed')).toBe('false')
})

it('names the style the tile is currently showing', async () => {
  openPanel()
  expect(styleTile().element().textContent).toContain('Dark Style')

  await styleTile().click()
  expect(styleTile().element().textContent).toContain('Light Style')

  await styleTile().click()
  expect(styleTile().element().textContent).toContain('Dark Style')
})

it('does nothing when a disabled tile is clicked', () => {
  const panel = openPanel()

  clickAnyway('Airplane Mode')

  expect(panel.isOpen).toBe(true)
  expect(panel.preferences.getStyle()).toBe('dark')
})

it('announces an enabled footer action and closes', async () => {
  const seen: string[] = []
  document.addEventListener(
    QUICK_SETTINGS_ACTION_EVENT,
    (event) => seen.push((event as CustomEvent<{ actionId: string }>).detail.actionId),
    { once: true }
  )
  const panel = openPanel()

  await control('Settings').click()

  expect(seen).toEqual(['settings'])
  expect(panel.isOpen).toBe(false)
})

it('does not announce a disabled footer action', () => {
  const listener = vi.fn()
  document.addEventListener(QUICK_SETTINGS_ACTION_EVENT, listener)
  const panel = openPanel()

  clickAnyway('Lock Screen')

  document.removeEventListener(QUICK_SETTINGS_ACTION_EVENT, listener)
  expect(listener).not.toHaveBeenCalled()
  expect(panel.isOpen).toBe(true)
})

it('focuses the first enabled control on open', () => {
  const panel = openPanel()
  expect(panel.shadowRoot?.activeElement).toBe(styleTile().element())
})

it('closes on escape, returns focus and announces the dismissal', () => {
  const trigger = mount<HTMLButtonElement>('button')
  const seen: Event[] = []
  document.addEventListener(QUICK_SETTINGS_DISMISSED_EVENT, (event) => seen.push(event), { once: true })
  const panel = openPanel(trigger)

  systemMenu()
    .element()
    .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

  expect(panel.isOpen).toBe(false)
  expect(document.activeElement).toBe(trigger)
  expect(seen).toHaveLength(1)
})

it('closes on a pointerdown outside the panel', () => {
  const panel = openPanel()

  document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }))

  expect(panel.isOpen).toBe(false)
})
