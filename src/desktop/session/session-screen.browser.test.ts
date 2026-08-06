import { afterEach, expect, it, vi } from 'vitest'
import './session-screen'
import {
  BOOT_COMPLETE_EVENT,
  BOOT_LINES,
  POWER_ON_REQUESTED_EVENT,
  type SessionScreen,
  SHUTDOWN_FADE_COMPLETE_EVENT
} from './session-screen'

const mount = (): SessionScreen => {
  const screen = document.createElement('sc-session-screen') as SessionScreen
  document.body.append(screen)
  return screen
}

afterEach(() => {
  for (const element of document.querySelectorAll('sc-session-screen')) {
    element.remove()
  }
  vi.useRealTimers()
})

it('is invisible while the session is running', () => {
  const screen = mount()
  screen.phase = 'running'
  expect(getComputedStyle(screen).display).toBe('none')
})

it('becomes visible while shutting down', () => {
  const screen = mount()
  screen.phase = 'shutting-down'
  expect(getComputedStyle(screen).display).not.toBe('none')
})

it('announces when the shutdown fade has finished', () => {
  vi.useFakeTimers()
  const screen = mount()
  const seen: Event[] = []
  document.addEventListener(SHUTDOWN_FADE_COMPLETE_EVENT, (event) => seen.push(event), { once: true })
  screen.phase = 'shutting-down'
  vi.advanceTimersByTime(2000)
  expect(seen).toHaveLength(1)
})

it('offers a power on button when off', () => {
  const screen = mount()
  screen.phase = 'off'
  const button = screen.shadowRoot?.querySelector('#power-on')
  expect(button?.getAttribute('aria-label')).toBe('Power on')
})

it('requests power on from the button', () => {
  const screen = mount()
  const seen: Event[] = []
  document.addEventListener(POWER_ON_REQUESTED_EVENT, (event) => seen.push(event), { once: true })
  screen.phase = 'off'
  screen.shadowRoot?.querySelector<HTMLButtonElement>('#power-on')?.click()
  expect(seen).toHaveLength(1)
})

it('prints the boot lines while booting', () => {
  vi.useFakeTimers()
  const screen = mount()
  screen.phase = 'booting'
  vi.advanceTimersByTime(5000)
  expect(screen.shadowRoot?.querySelector('#boot')?.textContent).toContain(BOOT_LINES[0])
})

it('announces when the boot has finished', () => {
  vi.useFakeTimers()
  const screen = mount()
  const seen: Event[] = []
  document.addEventListener(BOOT_COMPLETE_EVENT, (event) => seen.push(event), { once: true })
  screen.phase = 'booting'
  vi.advanceTimersByTime(10_000)
  expect(seen).toHaveLength(1)
})

it('skips the rest of the boot on a click', () => {
  vi.useFakeTimers()
  const screen = mount()
  const seen: Event[] = []
  document.addEventListener(BOOT_COMPLETE_EVENT, (event) => seen.push(event), { once: true })
  screen.phase = 'booting'
  screen.shadowRoot?.querySelector<HTMLElement>('#boot')?.click()
  expect(seen).toHaveLength(1)
})

it('stops its timers when the phase moves on', () => {
  vi.useFakeTimers()
  const screen = mount()
  const listener = vi.fn()
  document.addEventListener(BOOT_COMPLETE_EVENT, listener)
  screen.phase = 'booting'
  screen.phase = 'running'
  vi.advanceTimersByTime(10_000)
  document.removeEventListener(BOOT_COMPLETE_EVENT, listener)
  expect(listener).not.toHaveBeenCalled()
})
