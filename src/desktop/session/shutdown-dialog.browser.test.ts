import { afterEach, expect, it, vi } from 'vitest'
import './shutdown-dialog'
import {
  SHUTDOWN_CANCELLED_EVENT,
  SHUTDOWN_CONFIRMED_EVENT,
  SHUTDOWN_COUNTDOWN_SECONDS,
  type ShutdownDialog
} from './shutdown-dialog'

const mount = (): ShutdownDialog => {
  const dialog = document.createElement('sc-shutdown-dialog') as ShutdownDialog
  document.body.append(dialog)
  return dialog
}

afterEach(() => {
  for (const element of document.querySelectorAll('sc-shutdown-dialog')) {
    element.remove()
  }
  vi.useRealTimers()
})

it('starts closed', () => {
  expect(mount().isOpen).toBe(false)
})

it('presents itself as a modal alert dialog', () => {
  const dialog = mount()
  dialog.open()
  const alert = dialog.shadowRoot?.querySelector('[role="alertdialog"]')
  expect(alert?.getAttribute('aria-modal')).toBe('true')
  expect(alert?.getAttribute('aria-label')).toBe('Power Off')
})

it('counts down from sixty seconds', () => {
  vi.useFakeTimers()
  const dialog = mount()
  dialog.open()
  expect(dialog.shadowRoot?.querySelector('#countdown')?.textContent).toContain(String(SHUTDOWN_COUNTDOWN_SECONDS))
  vi.advanceTimersByTime(3000)
  expect(dialog.shadowRoot?.querySelector('#countdown')?.textContent).toContain('57')
})

it('confirms automatically when the countdown reaches zero', () => {
  vi.useFakeTimers()
  const dialog = mount()
  const seen: Event[] = []
  document.addEventListener(SHUTDOWN_CONFIRMED_EVENT, (event) => seen.push(event), { once: true })
  dialog.open()
  vi.advanceTimersByTime(SHUTDOWN_COUNTDOWN_SECONDS * 1000)
  expect(seen).toHaveLength(1)
  expect(dialog.isOpen).toBe(false)
})

it('focuses cancel so the destructive action is never the default', () => {
  const dialog = mount()
  dialog.open()
  expect(dialog.shadowRoot?.activeElement?.id).toBe('cancel')
})

it('cancels on the cancel button', () => {
  const dialog = mount()
  const seen: Event[] = []
  document.addEventListener(SHUTDOWN_CANCELLED_EVENT, (event) => seen.push(event), { once: true })
  dialog.open()
  dialog.shadowRoot?.querySelector<HTMLButtonElement>('#cancel')?.click()
  expect(seen).toHaveLength(1)
  expect(dialog.isOpen).toBe(false)
})

it('cancels on escape', () => {
  const dialog = mount()
  const seen: Event[] = []
  document.addEventListener(SHUTDOWN_CANCELLED_EVENT, (event) => seen.push(event), { once: true })
  dialog.open()
  dialog.shadowRoot
    ?.querySelector('[role="alertdialog"]')
    ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  expect(seen).toHaveLength(1)
})

it('confirms on the power off button', () => {
  const dialog = mount()
  const seen: Event[] = []
  document.addEventListener(SHUTDOWN_CONFIRMED_EVENT, (event) => seen.push(event), { once: true })
  dialog.open()
  dialog.shadowRoot?.querySelector<HTMLButtonElement>('#confirm')?.click()
  expect(seen).toHaveLength(1)
  expect(dialog.isOpen).toBe(false)
})

it('keeps tab inside the dialog', () => {
  const dialog = mount()
  dialog.open()
  const confirm = dialog.shadowRoot?.querySelector<HTMLButtonElement>('#confirm')
  confirm?.focus()
  dialog.shadowRoot
    ?.querySelector('[role="alertdialog"]')
    ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
  expect(dialog.shadowRoot?.activeElement?.id).toBe('cancel')
})

it('stops counting down once closed', () => {
  vi.useFakeTimers()
  const dialog = mount()
  const listener = vi.fn()
  document.addEventListener(SHUTDOWN_CONFIRMED_EVENT, listener)
  dialog.open()
  dialog.close()
  vi.advanceTimersByTime(SHUTDOWN_COUNTDOWN_SECONDS * 1000)
  document.removeEventListener(SHUTDOWN_CONFIRMED_EVENT, listener)
  expect(listener).not.toHaveBeenCalled()
})
