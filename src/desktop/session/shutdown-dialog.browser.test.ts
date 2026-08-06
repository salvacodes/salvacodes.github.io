import { afterEach, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { mount } from '../../test-support/mount'
import './shutdown-dialog'
import {
  SHUTDOWN_CANCELLED_EVENT,
  SHUTDOWN_CONFIRMED_EVENT,
  SHUTDOWN_COUNTDOWN_SECONDS,
  type ShutdownDialog
} from './shutdown-dialog'

const openDialog = (): ShutdownDialog => {
  const dialog = mount<ShutdownDialog>('sc-shutdown-dialog')
  dialog.open()
  return dialog
}

const alertDialog = () => page.getByRole('alertdialog', { name: 'Power Off' })

const button = (name: string) => alertDialog().getByRole('button', { name })

const pressKey = (dialog: ShutdownDialog, key: string) => {
  alertDialog()
    .element()
    .dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  return dialog
}

const recorded = (eventName: string): Event[] => {
  const seen: Event[] = []
  document.addEventListener(eventName, (event) => seen.push(event), { once: true })
  return seen
}

afterEach(() => {
  vi.useRealTimers()
})

it('starts closed', () => {
  expect(mount<ShutdownDialog>('sc-shutdown-dialog').isOpen).toBe(false)
})

it('presents itself as a modal alert dialog', () => {
  openDialog()
  expect(alertDialog().element().getAttribute('aria-modal')).toBe('true')
})

it('counts down from sixty seconds', () => {
  vi.useFakeTimers()
  openDialog()

  expect(alertDialog().element().textContent).toContain(String(SHUTDOWN_COUNTDOWN_SECONDS))

  vi.advanceTimersByTime(3000)
  expect(alertDialog().element().textContent).toContain(String(SHUTDOWN_COUNTDOWN_SECONDS - 3))
})

it('confirms automatically when the countdown reaches zero', () => {
  vi.useFakeTimers()
  const seen = recorded(SHUTDOWN_CONFIRMED_EVENT)
  const dialog = openDialog()

  vi.advanceTimersByTime(SHUTDOWN_COUNTDOWN_SECONDS * 1000)

  expect(seen).toHaveLength(1)
  expect(dialog.isOpen).toBe(false)
})

it('focuses cancel so the destructive action is never the default', () => {
  const dialog = openDialog()
  expect(dialog.shadowRoot?.activeElement).toBe(button('Cancel').element())
})

it('cancels on the cancel button', async () => {
  const seen = recorded(SHUTDOWN_CANCELLED_EVENT)
  const dialog = openDialog()

  await button('Cancel').click()

  expect(seen).toHaveLength(1)
  expect(dialog.isOpen).toBe(false)
})

it('cancels on escape', () => {
  const seen = recorded(SHUTDOWN_CANCELLED_EVENT)

  pressKey(openDialog(), 'Escape')

  expect(seen).toHaveLength(1)
})

it('confirms on the power off button', async () => {
  const seen = recorded(SHUTDOWN_CONFIRMED_EVENT)
  const dialog = openDialog()

  await button('Power Off').click()

  expect(seen).toHaveLength(1)
  expect(dialog.isOpen).toBe(false)
})

it('keeps tab inside the dialog', () => {
  const dialog = openDialog()
  button('Power Off').element().focus()

  pressKey(dialog, 'Tab')

  expect(dialog.shadowRoot?.activeElement).toBe(button('Cancel').element())
})

it('stops counting down once closed', () => {
  vi.useFakeTimers()
  const listener = vi.fn()
  document.addEventListener(SHUTDOWN_CONFIRMED_EVENT, listener)
  const dialog = openDialog()

  dialog.close()
  vi.advanceTimersByTime(SHUTDOWN_COUNTDOWN_SECONDS * 1000)

  document.removeEventListener(SHUTDOWN_CONFIRMED_EVENT, listener)
  expect(listener).not.toHaveBeenCalled()
})
