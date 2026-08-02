import { afterEach, expect, it, vi } from 'vitest'
import type { MenuAction } from '../desktop/context-menu/context-menu-model'
import { CONTEXT_MENU_EVENT, type ContextMenuDetail } from '../desktop/context-menu/context-menu-request'
import { LONG_PRESS_DURATION_MS } from '../desktop/context-menu/long-press'
import './desktop-window'
import type { DesktopWindow } from './desktop-window'
import { WindowManager } from './window-manager'

const mount = () => {
  const manager = new WindowManager({ width: 1280, height: 800 })
  const opened = manager.open({ appId: 'welcome', title: 'Welcome' })
  const element = document.createElement('sc-window') as DesktopWindow
  element.manager = manager
  element.windowId = opened.id
  document.body.append(element)
  return { manager, element, id: opened.id }
}

afterEach(() => {
  for (const element of document.querySelectorAll('sc-window')) {
    element.remove()
  }
})

it('renders the window title', () => {
  const { element } = mount()
  expect(element.shadowRoot?.querySelector('#title')?.textContent).toBe('Welcome')
})

it('positions and sizes itself from manager state', () => {
  const { manager, element, id } = mount()
  manager.move(id, 100, 120)
  expect(element.style.transform).toBe('translate(100px, 120px)')
  expect(element.style.width).toBe('640px')
  expect(element.style.height).toBe('480px')
})

it('closes through the manager', () => {
  const { manager, element, id } = mount()
  element.shadowRoot?.querySelector<HTMLButtonElement>('#close')?.click()
  expect(manager.list().find((w) => w.id === id)).toBeUndefined()
})

it('minimizes through the manager and hides itself', () => {
  const { manager, element } = mount()
  element.shadowRoot?.querySelector<HTMLButtonElement>('#minimize')?.click()
  expect(manager.list()[0]!.isMinimized).toBe(true)
  expect(element.hasAttribute('hidden')).toBe(true)
})

it('toggles maximize through the manager', () => {
  const { manager, element } = mount()
  const maximizeButton = element.shadowRoot?.querySelector<HTMLButtonElement>('#maximize')
  maximizeButton?.click()
  expect(manager.list()[0]!.isMaximized).toBe(true)
  maximizeButton?.click()
  expect(manager.list()[0]!.isMaximized).toBe(false)
})

it('focuses through the manager on pointerdown', () => {
  const manager = new WindowManager({ width: 1280, height: 800 })
  const first = manager.open({ appId: 'welcome', title: 'Welcome' })
  const second = manager.open({ appId: 'readme', title: 'Readme' })
  const firstElement = document.createElement('sc-window') as DesktopWindow
  firstElement.manager = manager
  firstElement.windowId = first.id
  document.body.append(firstElement)
  firstElement.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  expect(manager.list().find((w) => w.id === first.id)?.isFocused).toBe(true)
  expect(manager.list().find((w) => w.id === second.id)?.isFocused).toBe(false)
})

it('reflects focus state as an attribute', () => {
  const { element } = mount()
  expect(element.hasAttribute('focused')).toBe(true)
})

it('receives keyboard focus when opened', () => {
  const { element } = mount()
  expect(document.activeElement).toBe(element)
})

it('shows no focus outline around the window', () => {
  const { element } = mount()
  expect(document.activeElement).toBe(element)
  expect(getComputedStyle(element).outlineStyle).toBe('none')
})

it('hides itself and stops throwing after its window is closed', () => {
  const { manager, element, id } = mount()
  manager.close(id)
  expect(element.hasAttribute('hidden')).toBe(true)
  expect(() => {
    element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    element.shadowRoot?.querySelector<HTMLButtonElement>('#close')?.click()
    element.shadowRoot?.querySelector<HTMLButtonElement>('#minimize')?.click()
    element.shadowRoot?.querySelector<HTMLButtonElement>('#maximize')?.click()
  }).not.toThrow()
})

it('does not steal keyboard focus when reconnected while unfocused', () => {
  const manager = new WindowManager({ width: 1280, height: 800 })
  const first = manager.open({ appId: 'welcome', title: 'Welcome' })
  const firstElement = document.createElement('sc-window') as DesktopWindow
  firstElement.manager = manager
  firstElement.windowId = first.id
  document.body.append(firstElement)
  manager.open({ appId: 'readme', title: 'Readme' })
  firstElement.remove()
  document.body.append(firstElement)
  expect(document.activeElement).not.toBe(firstElement)
  firstElement.remove()
})

const dragBetween = (target: Element, from: { x: number; y: number }, to: { x: number; y: number }) => {
  target.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, clientX: from.x, clientY: from.y, pointerId: 1 })
  )
  target.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: to.x, clientY: to.y, pointerId: 1 }))
  target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: to.x, clientY: to.y, pointerId: 1 }))
}

it('commits a drag to the manager on pointerup', () => {
  const { manager, element, id } = mount()
  const before = manager.list()[0]!.geometry
  const titleBar = element.shadowRoot!.querySelector('#title-bar')!
  dragBetween(titleBar, { x: 400, y: 200 }, { x: 460, y: 250 })
  const after = manager.list().find((w) => w.id === id)!.geometry
  expect(after.x).toBe(before.x + 60)
  expect(after.y).toBe(before.y + 50)
})

it('keeps the window partially visible while a drag is still in progress', () => {
  const { element } = mount()
  const titleBar = element.shadowRoot!.querySelector('#title-bar')!
  titleBar.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 400, clientY: 200, pointerId: 1 }))
  titleBar.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 5000, clientY: 5000, pointerId: 1 }))
  expect(element.style.transform).toBe('translate(1184px, 760px)')
})

it('ends the drag when the pointer gesture is cancelled', () => {
  const { element } = mount()
  const titleBar = element.shadowRoot!.querySelector('#title-bar')!
  titleBar.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 400, clientY: 200, pointerId: 1 }))
  titleBar.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 460, clientY: 250, pointerId: 1 }))
  titleBar.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 1 }))
  const transformAtCancel = element.style.transform
  titleBar.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 900, clientY: 600, pointerId: 1 }))
  expect(element.style.transform).toBe(transformAtCancel)
})

it('commits a south-east resize to the manager on pointerup', () => {
  const { manager, element, id } = mount()
  const before = manager.list()[0]!.geometry
  const handle = element.shadowRoot!.querySelector('[data-direction="se"]')!
  dragBetween(handle, { x: 800, y: 700 }, { x: 880, y: 760 })
  const after = manager.list().find((w) => w.id === id)!.geometry
  expect(after.width).toBe(before.width + 80)
  expect(after.height).toBe(before.height + 60)
})

it('a west resize moves the left edge and shrinks the width', () => {
  const { manager, element, id } = mount()
  const before = manager.list()[0]!.geometry
  const handle = element.shadowRoot!.querySelector('[data-direction="w"]')!
  dragBetween(handle, { x: 320, y: 400 }, { x: 370, y: 400 })
  const after = manager.list().find((w) => w.id === id)!.geometry
  expect(after.x).toBe(before.x + 50)
  expect(after.width).toBe(before.width - 50)
})

it('double-clicking the title bar toggles maximize', () => {
  const { manager, element } = mount()
  const titleBar = element.shadowRoot!.querySelector('#title-bar')!
  titleBar.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, detail: 2, pointerId: 1 }))
  expect(manager.list()[0]!.isMaximized).toBe(true)
  titleBar.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, detail: 2, pointerId: 1 }))
  expect(manager.list()[0]!.isMaximized).toBe(false)
})

it('drag is disabled while maximized', () => {
  const { manager, element } = mount()
  const titleBar = element.shadowRoot!.querySelector('#title-bar')!
  titleBar.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, detail: 2, pointerId: 1 }))
  const before = manager.list()[0]!.geometry
  dragBetween(titleBar, { x: 400, y: 10 }, { x: 700, y: 300 })
  expect(manager.list()[0]!.geometry).toEqual(before)
})

it('a dblclick bubbling up from a control button does not toggle maximize', () => {
  const { manager, element } = mount()
  const maximizeButton = element.shadowRoot!.querySelector('#maximize')!
  maximizeButton.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
  expect(manager.list()[0]!.isMaximized).toBe(false)
})

it('ignores a secondary-button press on the title bar', () => {
  const { manager, element } = mount()
  const before = manager.list()[0]!.geometry
  const titleBar = element.shadowRoot!.querySelector('#title-bar')!
  titleBar.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, button: 2, clientX: 400, clientY: 200, pointerId: 1 })
  )
  titleBar.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 460, clientY: 250, pointerId: 1 }))
  expect(manager.list()[0]!.geometry).toEqual(before)
})

it('ignores a secondary-button press on a resize handle', () => {
  const { manager, element } = mount()
  const before = manager.list()[0]!.geometry
  const handle = element.shadowRoot!.querySelector('[data-direction="se"]')!
  handle.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, button: 2, clientX: 800, clientY: 700, pointerId: 1 })
  )
  handle.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 880, clientY: 760, pointerId: 1 }))
  expect(manager.list()[0]!.geometry).toEqual(before)
})

const openTitleBarMenu = (element: DesktopWindow): ContextMenuDetail => {
  let detail: ContextMenuDetail | undefined
  document.addEventListener(
    CONTEXT_MENU_EVENT,
    (event) => {
      detail = (event as CustomEvent<ContextMenuDetail>).detail
    },
    { once: true }
  )
  element.shadowRoot
    ?.querySelector('#title-bar')
    ?.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true, clientX: 10, clientY: 20 })
    )
  if (!detail) {
    throw new Error('title bar dispatched no context menu request')
  }
  return detail
}

const actionById = (detail: ContextMenuDetail, id: string): MenuAction =>
  detail.entries.find((entry) => 'id' in entry && entry.id === id) as MenuAction

it('offers the window actions on the title bar', () => {
  const { element } = mount()
  const labels = openTitleBarMenu(element).entries.map((entry) => ('label' in entry ? entry.label : '---'))
  expect(labels).toEqual(['Minimize', 'Maximize', '---', 'Always on Top', 'Move', 'Resize', '---', 'Close'])
})

it('greys out the window actions that have no implementation yet', () => {
  const { element } = mount()
  const disabledIds = openTitleBarMenu(element)
    .entries.filter((entry): entry is MenuAction => 'disabled' in entry && entry.disabled === true)
    .map((entry) => entry.id)
  expect(disabledIds).toEqual(['always-on-top', 'move', 'resize'])
})

it('labels the maximize entry Restore when the window is maximized', () => {
  const { element, manager, id } = mount()
  manager.maximize(id)
  expect(actionById(openTitleBarMenu(element), 'maximize').label).toBe('Restore')
})

it('minimizes through the menu', () => {
  const { element, manager, id } = mount()
  actionById(openTitleBarMenu(element), 'minimize').perform?.()
  expect(manager.list().find((window) => window.id === id)?.isMinimized).toBe(true)
})

it('closes through the menu', () => {
  const { element, manager } = mount()
  actionById(openTitleBarMenu(element), 'close').perform?.()
  expect(manager.list()).toHaveLength(0)
})

it('does not claim right-clicks on window content', () => {
  const { element } = mount()
  let requested = false
  document.addEventListener(
    CONTEXT_MENU_EVENT,
    () => {
      requested = true
    },
    { once: true }
  )
  element.shadowRoot
    ?.querySelector('#content')
    ?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true }))
  expect(requested).toBe(false)
})

it('re-arms the long-press menu after a disconnect and reconnect', () => {
  vi.useFakeTimers()
  try {
    const { element } = mount()
    element.remove()
    document.body.append(element)
    let detail: ContextMenuDetail | undefined
    document.addEventListener(
      CONTEXT_MENU_EVENT,
      (event) => {
        detail = (event as CustomEvent<ContextMenuDetail>).detail
      },
      { once: true }
    )
    const titleBar = element.shadowRoot?.querySelector('#title-bar')
    titleBar?.dispatchEvent(
      new PointerEvent('pointerdown', { pointerType: 'touch', clientX: 10, clientY: 20, bubbles: true, pointerId: 1 })
    )
    vi.advanceTimersByTime(LONG_PRESS_DURATION_MS)
    expect(detail).toBeDefined()
  } finally {
    vi.useRealTimers()
  }
})
