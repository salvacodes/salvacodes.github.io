import { expect, it, vi } from 'vitest'
import './top-bar'
import { formatClock, SYSTEM_MENU_TOGGLE_EVENT, type TopBar } from './top-bar'

it('shows the current time and updates it', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 6, 25, 14, 32))
  const topBar = document.createElement('sc-top-bar')
  document.body.append(topBar)
  expect(topBar.shadowRoot?.querySelector('#clock')?.textContent).toBe('Jul 25 14:32')
  vi.setSystemTime(new Date(2026, 6, 25, 14, 33))
  vi.advanceTimersByTime(30_000)
  expect(topBar.shadowRoot?.querySelector('#clock')?.textContent).toBe('Jul 25 14:33')
  topBar.remove()
  vi.useRealTimers()
})

it('prevents its text from being selected', () => {
  const topBar = document.createElement('sc-top-bar')
  document.body.append(topBar)
  const selectableTargets = [
    topBar,
    topBar.shadowRoot?.querySelector('#activities'),
    topBar.shadowRoot?.querySelector('#clock'),
    topBar.shadowRoot?.querySelector('#status')
  ]
  for (const target of selectableTargets) {
    expect(getComputedStyle(target as Element).userSelect).toBe('none')
  }
  topBar.remove()
})

it('dispatches activities-toggle when the activities button is clicked', () => {
  const topBar = document.createElement('sc-top-bar')
  document.body.append(topBar)
  const seen: Event[] = []
  document.addEventListener('activities-toggle', (event) => seen.push(event), { once: true })
  topBar.shadowRoot?.querySelector<HTMLButtonElement>('#activities')?.click()
  expect(seen).toHaveLength(1)
  expect(formatClock(new Date(2026, 6, 25, 14, 32))).toBe('Jul 25 14:32')
  topBar.remove()
})

it('exposes the status cluster as one labelled button', () => {
  const topBar = document.createElement('sc-top-bar') as TopBar
  document.body.append(topBar)
  const status = topBar.statusButton
  expect(status.getAttribute('aria-label')).toBe('System menu')
  expect(status.getAttribute('aria-haspopup')).toBe('dialog')
  expect(status.getAttribute('aria-expanded')).toBe('false')
  expect(status.querySelectorAll('svg')).toHaveLength(3)
  topBar.remove()
})

it('keeps the status icons out of the accessibility tree', () => {
  const topBar = document.createElement('sc-top-bar') as TopBar
  document.body.append(topBar)
  for (const icon of topBar.statusButton.querySelectorAll('svg')) {
    expect(icon.getAttribute('aria-hidden')).toBe('true')
  }
  topBar.remove()
})

it('dispatches system-menu-toggle when the status button is clicked', () => {
  const topBar = document.createElement('sc-top-bar') as TopBar
  document.body.append(topBar)
  const seen: Event[] = []
  document.addEventListener(SYSTEM_MENU_TOGGLE_EVENT, (event) => seen.push(event), { once: true })
  topBar.statusButton.click()
  expect(seen).toHaveLength(1)
  topBar.remove()
})

it('reflects the system menu state on the status button', () => {
  const topBar = document.createElement('sc-top-bar') as TopBar
  document.body.append(topBar)
  topBar.systemMenuExpanded = true
  expect(topBar.statusButton.getAttribute('aria-expanded')).toBe('true')
  topBar.systemMenuExpanded = false
  expect(topBar.statusButton.getAttribute('aria-expanded')).toBe('false')
  topBar.remove()
})
