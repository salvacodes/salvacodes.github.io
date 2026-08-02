import { expect, it, vi } from 'vitest'
import type { AppDefinition } from '../../apps/app-registry'
import { WindowManager } from '../../windowing/window-manager'
import { appIconMenuEntries } from './app-icon-menu'
import type { MenuAction } from './context-menu-model'

const TERMINAL: AppDefinition = {
  id: 'terminal',
  name: 'Terminal',
  iconGlyph: '>_',
  elementTag: 'sc-terminal-app'
}

const labels = (entries: ReturnType<typeof appIconMenuEntries>): string[] =>
  entries.map((entry) => ('label' in entry ? entry.label : '---'))

it('offers the app actions in gnome order', () => {
  const manager = new WindowManager({ width: 1280, height: 800 })
  expect(labels(appIconMenuEntries(TERMINAL, manager, vi.fn()))).toEqual([
    'Open',
    'New Window',
    'Show All Windows',
    'Pin to Dash',
    '---',
    'Quit'
  ])
})

it('greys out the app actions that have no implementation yet', () => {
  const manager = new WindowManager({ width: 1280, height: 800 })
  const disabledIds = appIconMenuEntries(TERMINAL, manager, vi.fn())
    .filter((entry): entry is MenuAction => 'disabled' in entry && entry.disabled === true)
    .map((entry) => entry.id)
  expect(disabledIds).toEqual(['new-window', 'show-all-windows', 'pin-to-dash', 'quit'])
})

it('enables quit once the app has a window', () => {
  const manager = new WindowManager({ width: 1280, height: 800 })
  manager.open({ appId: 'terminal', title: 'Terminal' })
  const quit = appIconMenuEntries(TERMINAL, manager, vi.fn()).find((entry) => 'id' in entry && entry.id === 'quit')
  expect(quit && 'disabled' in quit ? quit.disabled : undefined).toBe(false)
})

it('quit closes every window belonging to the app and leaves others alone', () => {
  const manager = new WindowManager({ width: 1280, height: 800 })
  manager.open({ appId: 'terminal', title: 'Terminal' })
  manager.open({ appId: 'terminal', title: 'Terminal', params: { path: '/etc' } })
  manager.open({ appId: 'resume', title: 'Resume++' })
  const entries = appIconMenuEntries(TERMINAL, manager, vi.fn())
  const quit = entries.find((entry) => 'id' in entry && entry.id === 'quit')
  if (quit && 'perform' in quit) {
    quit.perform?.()
  }
  expect(manager.list().map((window) => window.appId)).toEqual(['resume'])
})

it('open delegates to the supplied activation callback', () => {
  const manager = new WindowManager({ width: 1280, height: 800 })
  const activate = vi.fn()
  const entries = appIconMenuEntries(TERMINAL, manager, activate)
  const open = entries.find((entry) => 'id' in entry && entry.id === 'open')
  if (open && 'perform' in open) {
    open.perform?.()
  }
  expect(activate).toHaveBeenCalledTimes(1)
})
