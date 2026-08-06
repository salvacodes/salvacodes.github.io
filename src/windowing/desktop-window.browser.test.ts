import { expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import type { MenuAction } from '../desktop/context-menu/context-menu-model'
import { CONTEXT_MENU_EVENT, type ContextMenuDetail } from '../desktop/context-menu/context-menu-request'
import { LONG_PRESS_DURATION_MS } from '../desktop/context-menu/long-press'
import { mount } from '../test-support/mount'
import './desktop-window'
import type { DesktopWindow } from './desktop-window'
import { WindowManager } from './window-manager'

const TITLE = 'Welcome'

const openWindow = (title = TITLE) => {
  const manager = new WindowManager({ width: 1280, height: 800 })
  const opened = manager.open({ appId: 'welcome', title })
  const element = mount<DesktopWindow>('sc-window', { manager, windowId: opened.id })
  return { manager, element, id: opened.id, geometry: () => manager.list().find((w) => w.id === opened.id)!.geometry }
}

const control = (label: string, title = TITLE) =>
  page.getByRole('dialog', { name: title }).getByRole('button', { name: label })

const titleBarOf = (element: DesktopWindow): Element => element.shadowRoot!.querySelector('header')!

const resizeHandle = (element: DesktopWindow, direction: string): Element =>
  element.shadowRoot!.querySelector(`[data-direction="${direction}"]`)!

it('names itself with the window title', () => {
  openWindow()
  expect(page.getByRole('dialog', { name: TITLE }).elements()).toHaveLength(1)
})

it('positions and sizes itself from manager state', () => {
  const { manager, element, id, geometry } = openWindow()

  manager.move(id, 100, 120)

  const { x, y, width, height } = geometry()
  expect(element.style.transform).toBe(`translate(${x}px, ${y}px)`)
  expect(element.style.width).toBe(`${width}px`)
  expect(element.style.height).toBe(`${height}px`)
})

it('closes through the manager', async () => {
  const { manager, id } = openWindow()

  await control('Close').click()

  expect(manager.list().find((w) => w.id === id)).toBeUndefined()
})

it('minimizes through the manager and hides itself', async () => {
  const { manager, element } = openWindow()

  await control('Minimize').click()

  expect(manager.list()[0]!.isMinimized).toBe(true)
  expect(element.hasAttribute('hidden')).toBe(true)
})

it('toggles maximize through the manager', async () => {
  const { manager } = openWindow()

  await control('Maximize').click()
  expect(manager.list()[0]!.isMaximized).toBe(true)

  await control('Maximize').click()
  expect(manager.list()[0]!.isMaximized).toBe(false)
})

it('focuses through the manager on pointerdown', () => {
  const manager = new WindowManager({ width: 1280, height: 800 })
  const first = manager.open({ appId: 'welcome', title: TITLE })
  const second = manager.open({ appId: 'readme', title: 'Readme' })
  const firstElement = mount<DesktopWindow>('sc-window', { manager, windowId: first.id })

  firstElement.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))

  expect(manager.list().find((w) => w.id === first.id)?.isFocused).toBe(true)
  expect(manager.list().find((w) => w.id === second.id)?.isFocused).toBe(false)
})

it('reflects focus state as an attribute', () => {
  expect(openWindow().element.hasAttribute('focused')).toBe(true)
})

it('receives keyboard focus when opened', () => {
  const { element } = openWindow()
  expect(document.activeElement).toBe(element)
})

it('shows no focus outline around the window', () => {
  const { element } = openWindow()
  expect(document.activeElement).toBe(element)
  expect(getComputedStyle(element).outlineStyle).toBe('none')
})

it('hides itself and stops responding after its window is closed', async () => {
  const { manager, element, id } = openWindow()

  manager.close(id)

  expect(element.hasAttribute('hidden')).toBe(true)
  element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  expect(manager.list()).toHaveLength(0)
})

it('does not steal keyboard focus when reconnected while unfocused', () => {
  const manager = new WindowManager({ width: 1280, height: 800 })
  const first = manager.open({ appId: 'welcome', title: TITLE })
  const firstElement = mount<DesktopWindow>('sc-window', { manager, windowId: first.id })
  manager.open({ appId: 'readme', title: 'Readme' })

  firstElement.remove()
  document.body.append(firstElement)

  expect(document.activeElement).not.toBe(firstElement)
})

const dragBetween = (target: Element, from: { x: number; y: number }, to: { x: number; y: number }) => {
  target.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, clientX: from.x, clientY: from.y, pointerId: 1 })
  )
  target.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: to.x, clientY: to.y, pointerId: 1 }))
  target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: to.x, clientY: to.y, pointerId: 1 }))
}

it('commits a drag to the manager on pointerup', () => {
  const { element, geometry } = openWindow()
  const before = { ...geometry() }

  dragBetween(titleBarOf(element), { x: 400, y: 200 }, { x: 460, y: 250 })

  expect(geometry().x).toBe(before.x + 60)
  expect(geometry().y).toBe(before.y + 50)
})

it('keeps the window on screen while a drag is still in progress', () => {
  const { element, geometry } = openWindow()
  const titleBar = titleBarOf(element)

  titleBar.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 400, clientY: 200, pointerId: 1 }))
  titleBar.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 5000, clientY: 5000, pointerId: 1 }))

  const { x, y, width } = geometry()
  expect(element.style.transform).toBe(`translate(${x}px, ${y}px)`)
  expect(x + width, 'part of the window stays inside the viewport').toBeGreaterThanOrEqual(96)
  expect(y, 'the title bar stays inside the viewport').toBeLessThan(800)
})

it('ends the drag when the pointer gesture is cancelled', () => {
  const { element, geometry } = openWindow()
  const titleBar = titleBarOf(element)

  titleBar.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 400, clientY: 200, pointerId: 1 }))
  titleBar.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 460, clientY: 250, pointerId: 1 }))
  titleBar.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 1 }))
  const atCancel = { ...geometry() }
  titleBar.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 900, clientY: 600, pointerId: 1 }))

  expect(geometry()).toEqual(atCancel)
})

it('commits a south-east resize to the manager on pointerup', () => {
  const { element, geometry } = openWindow()
  const before = { ...geometry() }

  dragBetween(resizeHandle(element, 'se'), { x: 800, y: 700 }, { x: 880, y: 760 })

  expect(geometry().width).toBe(before.width + 80)
  expect(geometry().height).toBe(before.height + 60)
})

it('a west resize moves the left edge and shrinks the width', () => {
  const { element, geometry } = openWindow()
  const before = { ...geometry() }

  dragBetween(resizeHandle(element, 'w'), { x: 320, y: 400 }, { x: 370, y: 400 })

  expect(geometry().x).toBe(before.x + 50)
  expect(geometry().width).toBe(before.width - 50)
})

it('double-clicking the title bar toggles maximize', () => {
  const { manager, element } = openWindow()
  const titleBar = titleBarOf(element)

  titleBar.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, detail: 2, pointerId: 1 }))
  expect(manager.list()[0]!.isMaximized).toBe(true)

  titleBar.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, detail: 2, pointerId: 1 }))
  expect(manager.list()[0]!.isMaximized).toBe(false)
})

it('drag is disabled while maximized', () => {
  const { element, geometry } = openWindow()
  const titleBar = titleBarOf(element)
  titleBar.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, detail: 2, pointerId: 1 }))
  const before = { ...geometry() }

  dragBetween(titleBar, { x: 400, y: 10 }, { x: 700, y: 300 })

  expect(geometry()).toEqual(before)
})

it('a dblclick bubbling up from a control button does not toggle maximize', async () => {
  const { manager } = openWindow()

  control('Maximize')
    .element()
    .dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))

  expect(manager.list()[0]!.isMaximized).toBe(false)
})

it.each([
  ['the title bar', (element: DesktopWindow) => titleBarOf(element), { x: 400, y: 200 }, { x: 460, y: 250 }],
  ['a resize handle', (element: DesktopWindow) => resizeHandle(element, 'se'), { x: 800, y: 700 }, { x: 880, y: 760 }]
])('ignores a secondary-button press on %s', (_name, surfaceOf, from, to) => {
  const { element, geometry } = openWindow()
  const before = { ...geometry() }
  const surface = surfaceOf(element)

  surface.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, button: 2, clientX: from.x, clientY: from.y, pointerId: 1 })
  )
  surface.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: to.x, clientY: to.y, pointerId: 1 }))

  expect(geometry()).toEqual(before)
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
  titleBarOf(element).dispatchEvent(
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
  const labels = openTitleBarMenu(openWindow().element).entries.map((entry) => ('label' in entry ? entry.label : '---'))
  expect(labels).toEqual(['Minimize', 'Maximize', '---', 'Always on Top', 'Move', 'Resize', '---', 'Close'])
})

it('greys out the window actions that have no implementation yet', () => {
  const disabledIds = openTitleBarMenu(openWindow().element)
    .entries.filter((entry): entry is MenuAction => 'disabled' in entry && entry.disabled === true)
    .map((entry) => entry.id)
  expect(disabledIds).toEqual(['always-on-top', 'move', 'resize'])
})

it('labels the maximize entry Restore when the window is maximized', () => {
  const { element, manager, id } = openWindow()
  manager.maximize(id)
  expect(actionById(openTitleBarMenu(element), 'maximize').label).toBe('Restore')
})

it('minimizes through the menu', () => {
  const { element, manager, id } = openWindow()
  actionById(openTitleBarMenu(element), 'minimize').perform?.()
  expect(manager.list().find((window) => window.id === id)?.isMinimized).toBe(true)
})

it('closes through the menu', () => {
  const { element, manager } = openWindow()
  actionById(openTitleBarMenu(element), 'close').perform?.()
  expect(manager.list()).toHaveLength(0)
})

it('does not claim right-clicks on window content', () => {
  const { element } = openWindow()
  let requested = false
  document.addEventListener(
    CONTEXT_MENU_EVENT,
    () => {
      requested = true
    },
    { once: true }
  )

  element
    .shadowRoot!.querySelector('slot')!
    .dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true }))

  expect(requested).toBe(false)
})

it('re-arms the long-press menu after a disconnect and reconnect', () => {
  vi.useFakeTimers()
  try {
    const { element } = openWindow()
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

    titleBarOf(element).dispatchEvent(
      new PointerEvent('pointerdown', { pointerType: 'touch', clientX: 10, clientY: 20, bubbles: true, pointerId: 1 })
    )
    vi.advanceTimersByTime(LONG_PRESS_DURATION_MS)

    expect(detail).toBeDefined()
  } finally {
    vi.useRealTimers()
  }
})
