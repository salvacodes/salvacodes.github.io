import { afterEach, expect, it, vi } from 'vitest'
import './desktop-shell'
import type { DesktopShell } from './desktop-shell'

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
