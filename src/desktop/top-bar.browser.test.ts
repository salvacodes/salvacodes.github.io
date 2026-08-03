import { expect, it, vi } from 'vitest'
import './top-bar'
import { formatClock } from './top-bar'

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
