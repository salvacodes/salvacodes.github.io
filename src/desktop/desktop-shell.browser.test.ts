import { afterEach, expect, it, vi } from 'vitest'
import type { ActivitiesOverview } from './activities-overview'
import type { ContextMenuLayer } from './context-menu/context-menu-layer'
import { CONTEXT_MENU_EVENT, type ContextMenuDetail } from './context-menu/context-menu-request'
import './desktop-shell'
import type { DesktopShell } from './desktop-shell'
import type { QuickSettingsPanel } from './quick-settings/quick-settings-panel'
import {
  BOOT_COMPLETE_EVENT,
  POWER_ON_REQUESTED_EVENT,
  type SessionScreen,
  SHUTDOWN_FADE_COMPLETE_EVENT
} from './session/session-screen'
import type { ShutdownDialog } from './session/shutdown-dialog'
import type { TopBar } from './top-bar'

const mount = () => {
  const desktop = document.createElement('sc-desktop') as DesktopShell
  document.body.append(desktop)
  return desktop
}

const activate = (desktop: DesktopShell, appId: string) => {
  desktop.shadowRoot
    ?.querySelector('sc-dock')
    ?.dispatchEvent(new CustomEvent('app-activate', { bubbles: true, composed: true, detail: { appId } }))
}

afterEach(() => {
  for (const element of document.querySelectorAll('sc-desktop')) {
    element.remove()
  }
})

it('boots with the terminal window already open', () => {
  const desktop = mount()
  const windows = desktop.shadowRoot?.querySelectorAll('sc-window')
  expect(windows).toHaveLength(1)
  expect(windows?.[0]?.querySelector('sc-terminal-app')).not.toBeNull()
  const title = windows?.[0]?.shadowRoot?.querySelector('#title')
  expect(title?.textContent).toBe('user@salva.codes: ~')
})

it('does not reopen a closed terminal window when reconnected', () => {
  const desktop = mount()
  desktop.shadowRoot?.querySelector('sc-window')?.shadowRoot?.querySelector<HTMLButtonElement>('#close')?.click()
  desktop.remove()
  document.body.append(desktop)
  expect(desktop.shadowRoot?.querySelectorAll('sc-window')).toHaveLength(0)
})

it('composes the shell chrome', () => {
  const desktop = mount()
  expect(desktop.shadowRoot?.querySelector('sc-wallpaper')).not.toBeNull()
  expect(desktop.shadowRoot?.querySelector('sc-top-bar')).not.toBeNull()
  expect(desktop.shadowRoot?.querySelector('sc-dock')).not.toBeNull()
  expect(desktop.shadowRoot?.querySelector('sc-overview')).not.toBeNull()
})

it('opens a window with the app content when an app is activated', () => {
  const desktop = mount()
  activate(desktop, 'terminal')
  const windowElement = desktop.shadowRoot?.querySelector('sc-window')
  expect(windowElement).not.toBeNull()
  expect(windowElement?.querySelector('sc-terminal-app')).not.toBeNull()
})

it('re-activating a running app focuses it instead of opening a duplicate', () => {
  const desktop = mount()
  activate(desktop, 'terminal')
  activate(desktop, 'terminal')
  expect(desktop.shadowRoot?.querySelectorAll('sc-window')).toHaveLength(1)
})

it('activating a minimized app restores it', () => {
  const desktop = mount()
  activate(desktop, 'terminal')
  const windowElement = desktop.shadowRoot!.querySelector('sc-window')!
  windowElement.shadowRoot?.querySelector<HTMLButtonElement>('#minimize')?.click()
  expect(windowElement.hasAttribute('hidden')).toBe(true)
  activate(desktop, 'terminal')
  expect(windowElement.hasAttribute('hidden')).toBe(false)
})

it('closing a window removes its element', () => {
  const desktop = mount()
  activate(desktop, 'terminal')
  desktop.shadowRoot?.querySelector('sc-window')?.shadowRoot?.querySelector<HTMLButtonElement>('#close')?.click()
  expect(desktop.shadowRoot?.querySelectorAll('sc-window')).toHaveLength(0)
})

it('activities-toggle toggles the overview', () => {
  const desktop = mount()
  const topBar = desktop.shadowRoot!.querySelector('sc-top-bar')!
  topBar.dispatchEvent(new CustomEvent('activities-toggle', { bubbles: true, composed: true }))
  const overview = desktop.shadowRoot!.querySelector('sc-overview')!
  expect(overview.hasAttribute('open')).toBe(true)
  topBar.dispatchEvent(new CustomEvent('activities-toggle', { bubbles: true, composed: true }))
  expect(overview.hasAttribute('open')).toBe(false)
})

it('maximizes new windows and marks them compact under the breakpoint', () => {
  const matchMediaSpy = vi.spyOn(window, 'matchMedia').mockReturnValue({
    matches: true,
    addEventListener: () => undefined,
    removeEventListener: () => undefined
  } as unknown as MediaQueryList)
  const desktop = mount()
  activate(desktop, 'terminal')
  const windowElement = desktop.shadowRoot!.querySelector('sc-window')!
  expect(desktop.hasAttribute('compact')).toBe(true)
  expect(windowElement.hasAttribute('compact')).toBe(true)
  expect(windowElement.hasAttribute('maximized')).toBe(true)
  matchMediaSpy.mockRestore()
})

const activateWith = (desktop: DesktopShell, detail: Record<string, unknown>) => {
  desktop.shadowRoot
    ?.querySelector('sc-dock')
    ?.dispatchEvent(new CustomEvent('app-activate', { bubbles: true, composed: true, detail }))
}

it('opens separate windows for different params', () => {
  const desktop = mount()
  activateWith(desktop, { appId: 'case-study', params: { 'study-id': 'alpha' }, title: 'Alpha' })
  activateWith(desktop, { appId: 'case-study', params: { 'study-id': 'beta' }, title: 'Beta' })
  expect(desktop.shadowRoot?.querySelectorAll('sc-window')).toHaveLength(3)
})

it('focuses the existing window when the same params are requested again', () => {
  const desktop = mount()
  activateWith(desktop, { appId: 'case-study', params: { 'study-id': 'alpha' }, title: 'Alpha' })
  activateWith(desktop, { appId: 'case-study', params: { 'study-id': 'alpha' }, title: 'Alpha' })
  expect(desktop.shadowRoot?.querySelectorAll('sc-window')).toHaveLength(2)
})

it('passes params to the app element as attributes', () => {
  const desktop = mount()
  activateWith(desktop, { appId: 'case-study', params: { 'study-id': 'alpha' }, title: 'Alpha' })
  const studyWindow = [...desktop.shadowRoot!.querySelectorAll('sc-window')].find((element) =>
    element.querySelector('sc-case-study-app')
  )!
  expect(studyWindow.querySelector('sc-case-study-app')?.getAttribute('study-id')).toBe('alpha')
})

it('titles the window with the requested title', () => {
  const desktop = mount()
  activateWith(desktop, { appId: 'case-study', params: { 'study-id': 'alpha' }, title: 'Alpha' })
  const titles = [...desktop.shadowRoot!.querySelectorAll('sc-window')].map(
    (element) => element.shadowRoot?.querySelector('#title')?.textContent
  )
  expect(titles).toContain('Alpha')
})

it('prints a fragment dispatched as a print-document event', () => {
  const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined)
  const desktop = mount()
  const fragment = document.createDocumentFragment()
  fragment.append(document.createElement('p'))
  try {
    desktop.shadowRoot!.dispatchEvent(
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

it('mounts a context menu layer', () => {
  const desktop = mount()
  expect(desktop.shadowRoot?.querySelector('sc-context-menu')).not.toBeNull()
})

it('opens the layer when a surface requests a menu', () => {
  const desktop = mount()
  const layer = desktop.shadowRoot?.querySelector<ContextMenuLayer>('sc-context-menu')
  desktop.shadowRoot?.dispatchEvent(
    new CustomEvent<ContextMenuDetail>(CONTEXT_MENU_EVENT, {
      bubbles: true,
      composed: true,
      detail: { anchor: { x: 50, y: 80 }, entries: [{ id: 'open', label: 'Open' }] }
    })
  )
  expect(layer?.isOpen).toBe(true)
})

const openMenuLayer = (desktop: DesktopShell): ContextMenuLayer | null | undefined => {
  desktop.shadowRoot?.dispatchEvent(
    new CustomEvent<ContextMenuDetail>(CONTEXT_MENU_EVENT, {
      bubbles: true,
      composed: true,
      detail: { anchor: { x: 50, y: 80 }, entries: [{ id: 'open', label: 'Open' }] }
    })
  )
  return desktop.shadowRoot?.querySelector<ContextMenuLayer>('sc-context-menu')
}

it('closes the layer when the window manager notifies a change', () => {
  const desktop = mount()
  const layer = openMenuLayer(desktop)
  expect(layer?.isOpen).toBe(true)
  activate(desktop, 'resume')
  expect(layer?.isOpen).toBe(false)
})

it('closes the layer when a window it describes is closed', () => {
  const desktop = mount()
  const layer = openMenuLayer(desktop)
  expect(layer?.isOpen).toBe(true)
  desktop.shadowRoot?.querySelector('sc-window')?.shadowRoot?.querySelector<HTMLButtonElement>('#close')?.click()
  expect(layer?.isOpen).toBe(false)
})

it('suppresses the native context menu everywhere', () => {
  mount()
  const event = new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true })
  document.body.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(true)
})

it('synthesises a contextmenu event on the focused element for Shift+F10', () => {
  const desktop = mount()
  const probe = document.createElement('button')
  document.body.append(probe)
  probe.focus()
  let anchored = false
  probe.addEventListener(
    'contextmenu',
    () => {
      anchored = true
    },
    { once: true }
  )
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true }))
  expect(anchored).toBe(true)
  probe.remove()
  expect(desktop.isConnected).toBe(true)
})

it('synthesises a contextmenu event on the focused element for the ContextMenu key', () => {
  const desktop = mount()
  const probe = document.createElement('button')
  document.body.append(probe)
  probe.focus()
  let anchored = false
  probe.addEventListener(
    'contextmenu',
    () => {
      anchored = true
    },
    { once: true }
  )
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ContextMenu', bubbles: true }))
  expect(anchored).toBe(true)
  probe.remove()
  expect(desktop.isConnected).toBe(true)
})

it('opens and closes the quick settings panel from the status button', () => {
  const shell = mount()
  const topBar = shell.shadowRoot?.querySelector('sc-top-bar') as TopBar
  const panel = shell.shadowRoot?.querySelector('sc-quick-settings') as QuickSettingsPanel
  topBar.statusButton.click()
  expect(panel.isOpen).toBe(true)
  expect(topBar.statusButton.getAttribute('aria-expanded')).toBe('true')
  topBar.statusButton.click()
  expect(panel.isOpen).toBe(false)
  expect(topBar.statusButton.getAttribute('aria-expanded')).toBe('false')
})

it('clears the status button state when the panel dismisses itself', () => {
  const shell = mount()
  const topBar = shell.shadowRoot?.querySelector('sc-top-bar') as TopBar
  const panel = shell.shadowRoot?.querySelector('sc-quick-settings') as QuickSettingsPanel
  topBar.statusButton.click()
  document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }))
  expect(panel.isOpen).toBe(false)
  expect(topBar.statusButton.getAttribute('aria-expanded')).toBe('false')
})

it('opens the settings app from the quick settings gear', () => {
  const shell = mount()
  const topBar = shell.shadowRoot?.querySelector('sc-top-bar') as TopBar
  const panel = shell.shadowRoot?.querySelector('sc-quick-settings') as QuickSettingsPanel
  topBar.statusButton.click()
  panel.shadowRoot?.querySelector<HTMLElement>('[data-action-id="settings"]')?.click()
  expect(shell.shadowRoot?.querySelector('sc-settings-app')).not.toBeNull()
  expect(topBar.statusButton.getAttribute('aria-expanded')).toBe('false')
})

const requestShutdown = (desktop: DesktopShell): ShutdownDialog => {
  const topBar = desktop.shadowRoot?.querySelector('sc-top-bar') as TopBar
  const panel = desktop.shadowRoot?.querySelector('sc-quick-settings') as QuickSettingsPanel
  topBar.statusButton.click()
  panel.shadowRoot?.querySelector<HTMLElement>('[data-action-id="power"]')?.click()
  return desktop.shadowRoot?.querySelector('sc-shutdown-dialog') as ShutdownDialog
}

it('opens the shutdown dialog from the quick settings power button', () => {
  const shell = mount()
  const topBar = shell.shadowRoot?.querySelector('sc-top-bar') as TopBar
  expect(requestShutdown(shell).isOpen).toBe(true)
  expect(topBar.statusButton.getAttribute('aria-expanded')).toBe('false')
})

it('leaves the desktop untouched when the shutdown is cancelled', () => {
  const shell = mount()
  const screen = shell.shadowRoot?.querySelector('sc-session-screen') as SessionScreen
  const windowsBefore = shell.shadowRoot?.querySelectorAll('sc-window').length
  const dialog = requestShutdown(shell)
  expect(screen.getAttribute('data-phase')).toBe('confirming')
  dialog.shadowRoot?.querySelector<HTMLButtonElement>('#cancel')?.click()
  expect(screen.getAttribute('data-phase')).toBe('running')
  expect(shell.shadowRoot?.querySelectorAll('sc-window')).toHaveLength(windowsBefore ?? 0)
})

it('closes every window when the shutdown is confirmed', () => {
  const shell = mount()
  const screen = shell.shadowRoot?.querySelector('sc-session-screen') as SessionScreen
  const dialog = requestShutdown(shell)
  dialog.shadowRoot?.querySelector<HTMLButtonElement>('#confirm')?.click()
  expect(screen.getAttribute('data-phase')).toBe('shutting-down')
  expect(shell.shadowRoot?.querySelectorAll('sc-window')).toHaveLength(0)
})

it('reopens the terminal on a fresh boot', () => {
  const shell = mount()
  const screen = shell.shadowRoot?.querySelector('sc-session-screen') as SessionScreen
  const dialog = requestShutdown(shell)
  dialog.shadowRoot?.querySelector<HTMLButtonElement>('#confirm')?.click()
  screen.dispatchEvent(new CustomEvent(SHUTDOWN_FADE_COMPLETE_EVENT, { bubbles: true, composed: true }))
  expect(screen.getAttribute('data-phase')).toBe('off')
  screen.dispatchEvent(new CustomEvent(POWER_ON_REQUESTED_EVENT, { bubbles: true, composed: true }))
  expect(screen.getAttribute('data-phase')).toBe('booting')
  screen.dispatchEvent(new CustomEvent(BOOT_COMPLETE_EVENT, { bubbles: true, composed: true }))
  expect(screen.getAttribute('data-phase')).toBe('running')
  expect(shell.shadowRoot?.querySelectorAll('sc-window')).toHaveLength(1)
  expect(shell.shadowRoot?.querySelector('sc-terminal-app')).not.toBeNull()
})

const layerOf = (element: Element): number => Number(getComputedStyle(element).zIndex)

const powerOff = (desktop: DesktopShell): SessionScreen => {
  const screen = desktop.shadowRoot?.querySelector('sc-session-screen') as SessionScreen
  const dialog = requestShutdown(desktop)
  dialog.shadowRoot?.querySelector<HTMLButtonElement>('#confirm')?.click()
  screen.dispatchEvent(new CustomEvent(SHUTDOWN_FADE_COMPLETE_EVENT, { bubbles: true, composed: true }))
  return screen
}

it('paints the session screen above every other overlay', () => {
  const shell = mount()
  const screen = shell.shadowRoot?.querySelector('sc-session-screen') as SessionScreen
  const overview = shell.shadowRoot?.querySelector('sc-overview') as ActivitiesOverview
  const menuLayer = shell.shadowRoot?.querySelector('sc-context-menu') as HTMLElement
  const dialog = shell.shadowRoot?.querySelector('sc-shutdown-dialog') as HTMLElement
  overview.open = true
  expect(layerOf(screen)).toBeGreaterThan(layerOf(overview))
  expect(layerOf(screen)).toBeGreaterThan(layerOf(menuLayer))
  expect(layerOf(screen)).toBeGreaterThan(layerOf(dialog))
})

it('makes the rest of the desktop inert while powered off', () => {
  const shell = mount()
  const screen = powerOff(shell)
  const overview = shell.shadowRoot?.querySelector('sc-overview') as HTMLElement
  const topBar = shell.shadowRoot?.querySelector('sc-top-bar') as TopBar
  expect(overview.inert).toBe(true)
  expect(topBar.inert).toBe(true)
  expect(screen.inert).toBe(false)
})

it('keeps the shutdown dialog interactive while the confirmation is open', () => {
  const shell = mount()
  const dialog = requestShutdown(shell)
  const topBar = shell.shadowRoot?.querySelector('sc-top-bar') as TopBar
  expect(dialog.inert).toBe(false)
  expect(topBar.inert).toBe(false)
})

it('releases the desktop again once the boot completes', () => {
  const shell = mount()
  const screen = powerOff(shell)
  screen.dispatchEvent(new CustomEvent(POWER_ON_REQUESTED_EVENT, { bubbles: true, composed: true }))
  screen.dispatchEvent(new CustomEvent(BOOT_COMPLETE_EVENT, { bubbles: true, composed: true }))
  const topBar = shell.shadowRoot?.querySelector('sc-top-bar') as TopBar
  expect(topBar.inert).toBe(false)
})

it('takes the status button out of the focus order while powered off', () => {
  const shell = mount()
  powerOff(shell)
  const topBar = shell.shadowRoot?.querySelector('sc-top-bar') as TopBar
  topBar.statusButton.focus()
  expect(topBar.shadowRoot?.activeElement).toBeNull()
})
