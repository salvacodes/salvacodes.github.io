import { afterEach, expect, it, vi } from 'vitest'
import type { ContextMenuLayer } from './context-menu-layer'
import './context-menu-layer'

const mount = (): ContextMenuLayer => {
  const layer = document.createElement('sc-context-menu') as ContextMenuLayer
  document.body.append(layer)
  return layer
}

afterEach(() => {
  for (const element of document.querySelectorAll('sc-context-menu')) {
    element.remove()
  }
})

it('renders one menuitem per action and a separator between them', () => {
  const layer = mount()
  layer.open({
    anchor: { x: 40, y: 60 },
    entries: [{ id: 'open', label: 'Open' }, { separator: true }, { id: 'quit', label: 'Quit' }]
  })
  const items = layer.shadowRoot?.querySelectorAll('[role="menuitem"]')
  expect(items).toHaveLength(2)
  expect(items?.[0]?.textContent).toBe('Open')
  expect(layer.shadowRoot?.querySelectorAll('[role="separator"]')).toHaveLength(1)
})

it('marks disabled entries with aria-disabled and does not perform them', () => {
  const layer = mount()
  const perform = vi.fn()
  layer.open({ anchor: { x: 40, y: 60 }, entries: [{ id: 'pin', label: 'Pin to Dash', disabled: true, perform }] })
  const item = layer.shadowRoot?.querySelector<HTMLElement>('[data-item-id="pin"]')
  expect(item?.getAttribute('aria-disabled')).toBe('true')
  item?.click()
  expect(perform).not.toHaveBeenCalled()
  expect(layer.isOpen).toBe(true)
})

it('performs an enabled entry and closes', () => {
  const layer = mount()
  const perform = vi.fn()
  layer.open({ anchor: { x: 40, y: 60 }, entries: [{ id: 'open', label: 'Open', perform }] })
  layer.shadowRoot?.querySelector<HTMLElement>('[data-item-id="open"]')?.click()
  expect(perform).toHaveBeenCalledTimes(1)
  expect(layer.isOpen).toBe(false)
})

it('positions the menu using the placement model', () => {
  const layer = mount()
  layer.open({ anchor: { x: 40, y: 90 }, entries: [{ id: 'open', label: 'Open' }] })
  const menu = layer.shadowRoot?.querySelector<HTMLElement>('[role="menu"]')
  expect(menu?.style.left).toBe('40px')
  expect(menu?.style.top).toBe('90px')
})

it('closes on a pointerdown outside the menu', () => {
  const layer = mount()
  layer.open({ anchor: { x: 40, y: 60 }, entries: [{ id: 'open', label: 'Open' }] })
  document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }))
  expect(layer.isOpen).toBe(false)
})

it('stays open on a pointerdown inside the menu', () => {
  const layer = mount()
  layer.open({ anchor: { x: 40, y: 60 }, entries: [{ id: 'open', label: 'Open' }] })
  layer.shadowRoot
    ?.querySelector('[data-item-id="open"]')
    ?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }))
  expect(layer.isOpen).toBe(true)
})

it('replaces the previous menu when opened again', () => {
  const layer = mount()
  layer.open({ anchor: { x: 40, y: 60 }, entries: [{ id: 'open', label: 'Open' }] })
  layer.open({ anchor: { x: 40, y: 60 }, entries: [{ id: 'quit', label: 'Quit' }] })
  expect(layer.shadowRoot?.querySelectorAll('[role="menuitem"]')).toHaveLength(1)
  expect(layer.shadowRoot?.querySelector('[role="menuitem"]')?.textContent).toBe('Quit')
})

it('closes on viewport resize', () => {
  const layer = mount()
  layer.open({ anchor: { x: 40, y: 60 }, entries: [{ id: 'open', label: 'Open' }] })
  window.dispatchEvent(new Event('resize'))
  expect(layer.isOpen).toBe(false)
})

const press = (layer: ContextMenuLayer, key: string): void => {
  layer.shadowRoot?.querySelector('[role="menu"]')?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
}

const focusedItemId = (layer: ContextMenuLayer): string | undefined =>
  (layer.shadowRoot?.activeElement as HTMLElement | null)?.dataset.itemId

const openThreeEntryMenu = (): ContextMenuLayer => {
  const layer = mount()
  layer.open({
    anchor: { x: 40, y: 60 },
    entries: [
      { id: 'open', label: 'Open' },
      { id: 'pin', label: 'Pin to Dash', disabled: true },
      { separator: true },
      { id: 'quit', label: 'Quit' }
    ]
  })
  return layer
}

it('focuses the first item on open', () => {
  expect(focusedItemId(openThreeEntryMenu())).toBe('open')
})

const hover = (layer: ContextMenuLayer, itemId: string): void => {
  layer.shadowRoot
    ?.querySelector(`[data-item-id="${itemId}"]`)
    ?.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, composed: true }))
}

it('moves focus to the item under the pointer', () => {
  const layer = openThreeEntryMenu()
  hover(layer, 'quit')
  expect(focusedItemId(layer)).toBe('quit')
})

it('moves focus to a disabled item under the pointer', () => {
  const layer = openThreeEntryMenu()
  hover(layer, 'pin')
  expect(focusedItemId(layer)).toBe('pin')
})

it('moves focus down and reaches disabled entries', () => {
  const layer = openThreeEntryMenu()
  press(layer, 'ArrowDown')
  expect(focusedItemId(layer)).toBe('pin')
})

it('skips separators when moving down', () => {
  const layer = openThreeEntryMenu()
  press(layer, 'ArrowDown')
  press(layer, 'ArrowDown')
  expect(focusedItemId(layer)).toBe('quit')
})

it('wraps from the last item to the first', () => {
  const layer = openThreeEntryMenu()
  press(layer, 'End')
  press(layer, 'ArrowDown')
  expect(focusedItemId(layer)).toBe('open')
})

it('jumps to the last item with End and the first with Home', () => {
  const layer = openThreeEntryMenu()
  press(layer, 'End')
  expect(focusedItemId(layer)).toBe('quit')
  press(layer, 'Home')
  expect(focusedItemId(layer)).toBe('open')
})

it('closes when the window loses focus', () => {
  const layer = mount()
  layer.open({ anchor: { x: 40, y: 60 }, entries: [{ id: 'open', label: 'Open' }] })
  window.dispatchEvent(new Event('blur'))
  expect(layer.isOpen).toBe(false)
})

it('keeps an Escape inside the menu from reaching listeners outside it', () => {
  const layer = mount()
  layer.open({ anchor: { x: 40, y: 60 }, entries: [{ id: 'open', label: 'Open' }] })
  let observedOutside = false
  const listener = (): void => {
    observedOutside = true
  }
  window.addEventListener('keydown', listener)
  layer.shadowRoot
    ?.querySelector('[role="menu"]')
    ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }))
  window.removeEventListener('keydown', listener)
  expect(observedOutside).toBe(false)
})

it('closes on Escape and returns focus to the originating element', () => {
  const origin = document.createElement('button')
  document.body.append(origin)
  const layer = mount()
  layer.open({ anchor: { x: 40, y: 60 }, entries: [{ id: 'open', label: 'Open' }] }, origin)
  press(layer, 'Escape')
  expect(layer.isOpen).toBe(false)
  expect(document.activeElement).toBe(origin)
  origin.remove()
})
