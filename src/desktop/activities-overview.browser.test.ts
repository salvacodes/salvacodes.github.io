import { afterEach, expect, it } from 'vitest'
import { createAppRegistry } from '../apps'
import { SETTINGS_ICON_MARKUP } from '../apps/settings/settings-icon'
import { WindowManager } from '../windowing/window-manager'
import './activities-overview'
import type { ActivitiesOverview } from './activities-overview'
import { CONTEXT_MENU_EVENT, type ContextMenuDetail } from './context-menu/context-menu-request'
import { createIconSvg } from './icon-svg'

const mount = () => {
  const overview = document.createElement('sc-overview') as ActivitiesOverview
  overview.registry = createAppRegistry()
  overview.manager = new WindowManager({ width: 1280, height: 800 })
  document.body.append(overview)
  return overview
}

afterEach(() => {
  for (const element of document.querySelectorAll('sc-overview')) {
    element.remove()
  }
})

it('is hidden until opened', () => {
  const overview = mount()
  expect(overview.hasAttribute('open')).toBe(false)
  overview.open = true
  expect(overview.hasAttribute('open')).toBe(true)
})

it('renders a grid entry per app when open', () => {
  const overview = mount()
  overview.open = true
  expect(overview.shadowRoot?.querySelectorAll('button[data-app-id]')).toHaveLength(
    createAppRegistry().listLaunchable().length
  )
  const terminalButton = overview.shadowRoot?.querySelector<HTMLButtonElement>('[data-app-id="terminal"]')
  expect(terminalButton?.querySelector('.glyph')?.textContent).toBe('>_')
  expect(terminalButton?.querySelector('span:not(.glyph)')?.textContent).toBe('Terminal')
})

it('activating an app dispatches app-activate and closes', () => {
  const overview = mount()
  overview.open = true
  let detail: { appId: string } | undefined
  document.addEventListener(
    'app-activate',
    (event) => {
      detail = (event as CustomEvent<{ appId: string }>).detail
    },
    { once: true }
  )
  overview.shadowRoot?.querySelector<HTMLButtonElement>('[data-app-id="writings"]')?.click()
  expect(detail).toEqual({ appId: 'writings' })
  expect(overview.open).toBe(false)
})

it('escape closes the overview', () => {
  const overview = mount()
  overview.open = true
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  expect(overview.open).toBe(false)
})

it('requests an app menu when a grid entry is right-clicked', () => {
  const overview = mount()
  overview.open = true
  let detail: ContextMenuDetail | undefined
  document.addEventListener(
    CONTEXT_MENU_EVENT,
    (event) => {
      detail = (event as CustomEvent<ContextMenuDetail>).detail
    },
    { once: true }
  )
  overview.shadowRoot
    ?.querySelector('[data-app-id="terminal"]')
    ?.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true, clientX: 15, clientY: 25 })
    )
  expect(detail?.anchor).toEqual({ x: 15, y: 25 })
  expect(detail?.entries.map((entry) => ('label' in entry ? entry.label : '---'))).toEqual([
    'Open',
    'New Window',
    'Show All Windows',
    'Pin to Dash',
    '---',
    'Quit'
  ])
})

it('gives the settings app the same cogwheel the quick settings footer uses', () => {
  const overview = mount()
  const glyph = overview.shadowRoot?.querySelector<HTMLElement>('button[data-app-id="settings"] .glyph')
  expect(glyph?.querySelector('svg')?.outerHTML).toBe(createIconSvg(SETTINGS_ICON_MARKUP)?.outerHTML)
})
