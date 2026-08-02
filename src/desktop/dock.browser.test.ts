import { afterEach, expect, it } from 'vitest'
import { createAppRegistry } from '../apps'
import { WindowManager } from '../windowing/window-manager'
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
  const { dock } = mount()
  const buttons = dock.shadowRoot?.querySelectorAll('button[data-app-id]')
  expect(buttons).toHaveLength(3)
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
