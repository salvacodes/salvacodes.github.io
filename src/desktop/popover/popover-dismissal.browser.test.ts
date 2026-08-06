import { afterEach, expect, it, vi } from 'vitest'

import { observePopoverDismissal } from './popover-dismissal'

const releases: Array<() => void> = []

const observe = (element: HTMLElement, onDismiss: () => void): void => {
  releases.push(observePopoverDismissal({ element, onDismiss }))
}

afterEach(() => {
  for (const release of releases.splice(0)) {
    release()
  }
  for (const element of document.querySelectorAll('.popover-probe')) {
    element.remove()
  }
})

const probe = (): HTMLElement => {
  const element = document.createElement('div')
  element.className = 'popover-probe'
  document.body.append(element)
  return element
}

it('dismisses on a pointerdown outside the element', () => {
  const onDismiss = vi.fn()
  observe(probe(), onDismiss)
  document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }))
  expect(onDismiss).toHaveBeenCalledTimes(1)
})

it('ignores a pointerdown inside the element', () => {
  const onDismiss = vi.fn()
  const element = probe()
  observe(element, onDismiss)
  element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }))
  expect(onDismiss).not.toHaveBeenCalled()
})

it('ignores a pointerdown inside the element shadow root', () => {
  const onDismiss = vi.fn()
  const element = probe()
  const inner = element.attachShadow({ mode: 'open' }).appendChild(document.createElement('button'))
  observe(element, onDismiss)
  inner.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }))
  expect(onDismiss).not.toHaveBeenCalled()
})

it('dismisses when the window is resized', () => {
  const onDismiss = vi.fn()
  observe(probe(), onDismiss)
  window.dispatchEvent(new Event('resize'))
  expect(onDismiss).toHaveBeenCalledTimes(1)
})

it('dismisses when the window loses focus', () => {
  const onDismiss = vi.fn()
  observe(probe(), onDismiss)
  window.dispatchEvent(new Event('blur'))
  expect(onDismiss).toHaveBeenCalledTimes(1)
})

it('stops listening once released', () => {
  const onDismiss = vi.fn()
  const release = observePopoverDismissal({ element: probe(), onDismiss })
  release()
  document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }))
  window.dispatchEvent(new Event('resize'))
  expect(onDismiss).not.toHaveBeenCalled()
})
