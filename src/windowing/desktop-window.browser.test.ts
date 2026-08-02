import { afterEach, expect, it } from 'vitest'
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
