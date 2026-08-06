import { expect, it, vi } from 'vitest'
import { mountDesktop } from '../test-support/desktop-driver'
import { CONTEXT_MENU_EVENT, type ContextMenuDetail } from './context-menu/context-menu-request'
import {
  BOOT_COMPLETE_EVENT,
  POWER_ON_REQUESTED_EVENT,
  type SessionScreen,
  SHUTDOWN_FADE_COMPLETE_EVENT
} from './session/session-screen'
import type { TopBar } from './top-bar'

const TERMINAL = 'user@salva.codes: ~'

it('boots with the terminal window already open', () => {
  expect(mountDesktop().openWindowTitles()).toEqual([TERMINAL])
})

it('does not reopen a closed terminal window when reconnected', async () => {
  const desktop = mountDesktop()
  await desktop.window(TERMINAL).close()

  desktop.element.remove()
  document.body.append(desktop.element)

  expect(desktop.openWindowTitles()).toEqual([])
})

it('opens a window with the app content when an app is activated', async () => {
  const desktop = mountDesktop()

  await desktop.launch('Resume++')

  expect(desktop.window('Resume++').contains('sc-resume-app')).toBe(true)
})

it('re-activating a running app focuses it instead of opening a duplicate', async () => {
  const desktop = mountDesktop()

  await desktop.launch('Terminal')

  expect(desktop.openWindowTitles()).toEqual([TERMINAL])
})

it('activating a minimized app restores it', async () => {
  const desktop = mountDesktop()

  await desktop.window(TERMINAL).minimize()
  expect(desktop.window(TERMINAL).isMinimized()).toBe(true)

  await desktop.launch('Terminal')
  expect(desktop.window(TERMINAL).isMinimized()).toBe(false)
})

it('closing a window removes it from the desktop', async () => {
  const desktop = mountDesktop()

  await desktop.window(TERMINAL).close()

  expect(desktop.openWindowTitles()).toEqual([])
})

it('the activities button toggles the overview', async () => {
  const desktop = mountDesktop()

  await desktop.toggleActivities()
  expect(desktop.isOverviewOpen()).toBe(true)

  await desktop.toggleActivities()
  expect(desktop.isOverviewOpen()).toBe(false)
})

it('maximizes new windows and marks them compact under the breakpoint', async () => {
  const matchMediaSpy = vi.spyOn(window, 'matchMedia').mockReturnValue({
    matches: true,
    addEventListener: () => undefined,
    removeEventListener: () => undefined
  } as unknown as MediaQueryList)
  const desktop = mountDesktop()

  expect(desktop.element.hasAttribute('compact')).toBe(true)
  expect(desktop.window(TERMINAL).isMaximized()).toBe(true)

  matchMediaSpy.mockRestore()
})

it('opens separate windows for different params', () => {
  const desktop = mountDesktop()

  desktop.activate({ appId: 'case-study', params: { 'study-id': 'alpha' }, title: 'Alpha' })
  desktop.activate({ appId: 'case-study', params: { 'study-id': 'beta' }, title: 'Beta' })

  expect(desktop.openWindowTitles()).toEqual([TERMINAL, 'Alpha', 'Beta'])
})

it('focuses the existing window when the same params are requested again', () => {
  const desktop = mountDesktop()

  desktop.activate({ appId: 'case-study', params: { 'study-id': 'alpha' }, title: 'Alpha' })
  desktop.activate({ appId: 'case-study', params: { 'study-id': 'alpha' }, title: 'Alpha' })

  expect(desktop.openWindowTitles()).toEqual([TERMINAL, 'Alpha'])
})

it('passes params to the app element as attributes', () => {
  const desktop = mountDesktop()

  desktop.activate({ appId: 'case-study', params: { 'study-id': 'alpha' }, title: 'Alpha' })

  expect(desktop.window('Alpha').attributeOf('sc-case-study-app', 'study-id')).toBe('alpha')
})

it('prints a fragment dispatched as a print-document event', () => {
  const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined)
  const desktop = mountDesktop()
  const fragment = document.createDocumentFragment()
  fragment.append(document.createElement('p'))
  try {
    desktop.element.shadowRoot?.dispatchEvent(
      new CustomEvent('print-document', { bubbles: true, composed: true, detail: { fragment } })
    )
    expect(document.getElementById('print-surface')).not.toBeNull()
    expect(printSpy).toHaveBeenCalledOnce()
  } finally {
    document.getElementById('print-surface')?.remove()
    delete document.documentElement.dataset.printing
    printSpy.mockRestore()
  }
})

const requestMenu = (desktop: ReturnType<typeof mountDesktop>) => {
  desktop.element.shadowRoot?.dispatchEvent(
    new CustomEvent<ContextMenuDetail>(CONTEXT_MENU_EVENT, {
      bubbles: true,
      composed: true,
      detail: { anchor: { x: 50, y: 80 }, entries: [{ id: 'open', label: 'Open' }] }
    })
  )
}

it('opens the menu layer when a surface requests a menu', () => {
  const desktop = mountDesktop()

  requestMenu(desktop)

  expect(desktop.isMenuOpen()).toBe(true)
})

it('closes the menu when the window manager notifies a change', async () => {
  const desktop = mountDesktop()
  requestMenu(desktop)

  await desktop.launch('Resume++')

  expect(desktop.isMenuOpen()).toBe(false)
})

it('closes the menu when a window it describes is closed', async () => {
  const desktop = mountDesktop()
  requestMenu(desktop)

  await desktop.window(TERMINAL).close()

  expect(desktop.isMenuOpen()).toBe(false)
})

it('suppresses the native context menu everywhere', () => {
  mountDesktop()
  const event = new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true })

  document.body.dispatchEvent(event)

  expect(event.defaultPrevented).toBe(true)
})

it.each([
  ['Shift+F10', { key: 'F10', shiftKey: true }],
  ['the ContextMenu key', { key: 'ContextMenu' }]
])('synthesises a contextmenu event on the focused element for %s', (_name, keyInit) => {
  mountDesktop()
  const probe = document.createElement('button')
  document.body.append(probe)
  probe.focus()
  let anchored = false
  probe.addEventListener('contextmenu', () => {
    anchored = true
  })

  window.dispatchEvent(new KeyboardEvent('keydown', { ...keyInit, bubbles: true }))

  expect(anchored).toBe(true)
  probe.remove()
})

it('opens the quick settings panel from the status button', async () => {
  const desktop = mountDesktop()

  await desktop.openSystemMenu()

  expect(desktop.isSystemMenuOpen()).toBe(true)
  expect(desktop.isSystemMenuExpanded()).toBe(true)
})

it('clears the status button state when the panel dismisses itself', async () => {
  const desktop = mountDesktop()
  await desktop.openSystemMenu()

  document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }))

  expect(desktop.isSystemMenuOpen()).toBe(false)
  expect(desktop.isSystemMenuExpanded()).toBe(false)
})

it('opens the settings app from the quick settings gear', async () => {
  const desktop = mountDesktop()
  await desktop.openSystemMenu()

  await desktop.chooseSystemMenuAction('Settings')

  expect(desktop.window('Settings').contains('sc-settings-app')).toBe(true)
  expect(desktop.isSystemMenuExpanded()).toBe(false)
})

const requestShutdown = async (desktop: ReturnType<typeof mountDesktop>) => {
  await desktop.openSystemMenu()
  await desktop.chooseSystemMenuAction('Power Off')
}

it('opens the shutdown dialog from the quick settings power button', async () => {
  const desktop = mountDesktop()

  await requestShutdown(desktop)

  expect(desktop.isShutdownDialogOpen()).toBe(true)
  expect(desktop.isSystemMenuExpanded()).toBe(false)
})

it('leaves the desktop untouched when the shutdown is cancelled', async () => {
  const desktop = mountDesktop()
  const before = desktop.openWindowTitles()

  await requestShutdown(desktop)
  expect(desktop.sessionPhase()).toBe('confirming')

  await desktop.cancelShutdown()

  expect(desktop.sessionPhase()).toBe('running')
  expect(desktop.openWindowTitles()).toEqual(before)
})

it('closes every window when the shutdown is confirmed', async () => {
  const desktop = mountDesktop()

  await requestShutdown(desktop)
  await desktop.confirmShutdown()

  expect(desktop.sessionPhase()).toBe('shutting-down')
  expect(desktop.openWindowTitles()).toEqual([])
})

const powerOff = async (desktop: ReturnType<typeof mountDesktop>): Promise<SessionScreen> => {
  await requestShutdown(desktop)
  await desktop.confirmShutdown()
  const screen = desktop.surface<SessionScreen>('sc-session-screen')
  screen.dispatchEvent(new CustomEvent(SHUTDOWN_FADE_COMPLETE_EVENT, { bubbles: true, composed: true }))
  return screen
}

it('reopens the terminal on a fresh boot', async () => {
  const desktop = mountDesktop()
  const screen = await powerOff(desktop)
  expect(desktop.sessionPhase()).toBe('off')

  screen.dispatchEvent(new CustomEvent(POWER_ON_REQUESTED_EVENT, { bubbles: true, composed: true }))
  expect(desktop.sessionPhase()).toBe('booting')

  screen.dispatchEvent(new CustomEvent(BOOT_COMPLETE_EVENT, { bubbles: true, composed: true }))
  expect(desktop.sessionPhase()).toBe('running')
  expect(desktop.openWindowTitles()).toEqual([TERMINAL])
})

const layerOf = (element: Element): number => Number(getComputedStyle(element).zIndex)

it('paints the session screen above every other overlay', () => {
  const desktop = mountDesktop()
  const screen = desktop.surface('sc-session-screen')
  desktop.surface('sc-overview').setAttribute('open', '')

  for (const covered of ['sc-overview', 'sc-context-menu', 'sc-shutdown-dialog']) {
    expect(layerOf(screen), `session screen should paint above ${covered}`).toBeGreaterThan(
      layerOf(desktop.surface(covered))
    )
  }
})

it('makes the rest of the desktop inert while powered off', async () => {
  const desktop = mountDesktop()

  const screen = await powerOff(desktop)

  expect(desktop.surface('sc-overview').inert).toBe(true)
  expect(desktop.surface('sc-top-bar').inert).toBe(true)
  expect(screen.inert).toBe(false)
})

it('keeps the shutdown dialog interactive while the confirmation is open', async () => {
  const desktop = mountDesktop()

  await requestShutdown(desktop)

  expect(desktop.surface('sc-shutdown-dialog').inert).toBe(false)
  expect(desktop.surface('sc-top-bar').inert).toBe(false)
})

it('releases the desktop again once the boot completes', async () => {
  const desktop = mountDesktop()
  const screen = await powerOff(desktop)

  screen.dispatchEvent(new CustomEvent(POWER_ON_REQUESTED_EVENT, { bubbles: true, composed: true }))
  screen.dispatchEvent(new CustomEvent(BOOT_COMPLETE_EVENT, { bubbles: true, composed: true }))

  expect(desktop.surface('sc-top-bar').inert).toBe(false)
})

it('takes the status button out of the focus order while powered off', async () => {
  const desktop = mountDesktop()

  await powerOff(desktop)
  const topBar = desktop.surface<TopBar>('sc-top-bar')
  topBar.statusButton.focus()

  expect(topBar.shadowRoot?.activeElement).toBeNull()
})
