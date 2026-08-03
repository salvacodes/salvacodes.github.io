import { afterEach, expect, it } from 'vitest'
import { createAppRegistry } from '../apps'
import { WindowManager } from '../windowing/window-manager'
import { CONTEXT_MENU_EVENT, type ContextMenuDetail } from './context-menu/context-menu-request'
import './dock'
import type { Dock } from './dock'

const mount = () => {
  const manager = new WindowManager({ width: 1280, height: 800 })
  const registry = createAppRegistry()
  const dock = document.createElement('sc-dock') as Dock
  dock.manager = manager
  dock.registry = registry
  document.body.append(dock)
  return { manager, registry, dock }
}

afterEach(() => {
  for (const element of document.querySelectorAll('sc-dock')) {
    element.remove()
  }
})

it('renders one launcher button per registered app', () => {
  const { dock, registry } = mount()
  const buttons = dock.shadowRoot?.querySelectorAll('button[data-app-id]')
  expect(buttons).toHaveLength(registry.listLaunchable().length)
  expect(buttons?.[0]?.getAttribute('data-app-id')).toBe('terminal')
  expect(buttons?.[0]?.getAttribute('title')).toBe('Terminal')
})

it('marks apps with open windows as running', () => {
  const { manager, dock } = mount()
  const before = dock.shadowRoot?.querySelector('[data-app-id="terminal"]')
  expect(before?.classList.contains('running')).toBe(false)
  manager.open({ appId: 'terminal', title: 'user@salva.codes: ~' })
  const after = dock.shadowRoot?.querySelector('[data-app-id="terminal"]')
  expect(after?.classList.contains('running')).toBe(true)
})

it('dispatches app-activate on click', () => {
  const { dock } = mount()
  let detail: { appId: string } | undefined
  document.addEventListener(
    'app-activate',
    (event) => {
      detail = (event as CustomEvent<{ appId: string }>).detail
    },
    { once: true }
  )
  dock.shadowRoot?.querySelector<HTMLButtonElement>('[data-app-id="terminal"]')?.click()
  expect(detail).toEqual({ appId: 'terminal' })
})

it('requests an app menu when a launcher is right-clicked', () => {
  const { dock } = mount()
  let detail: ContextMenuDetail | undefined
  document.addEventListener(
    CONTEXT_MENU_EVENT,
    (event) => {
      detail = (event as CustomEvent<ContextMenuDetail>).detail
    },
    { once: true }
  )
  dock.shadowRoot
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
