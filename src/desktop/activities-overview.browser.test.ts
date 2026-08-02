import { afterEach, expect, it } from 'vitest'
import { createAppRegistry } from '../apps'
import './activities-overview'
import type { ActivitiesOverview } from './activities-overview'

const mount = () => {
  const overview = document.createElement('sc-overview') as ActivitiesOverview
  overview.registry = createAppRegistry()
  document.body.append(overview)
  return overview
}

afterEach(() => {
  for (const element of document.querySelectorAll('sc-overview')) {
    element.remove()
  }
})

it('is hidden until opened', () => {
  const overview = mount()
  expect(overview.hasAttribute('open')).toBe(false)
  overview.open = true
  expect(overview.hasAttribute('open')).toBe(true)
})

it('renders a grid entry per app when open', () => {
  const overview = mount()
  overview.open = true
  expect(overview.shadowRoot?.querySelectorAll('button[data-app-id]')).toHaveLength(2)
  const terminalButton = overview.shadowRoot?.querySelector<HTMLButtonElement>('[data-app-id="terminal"]')
  expect(terminalButton?.querySelector('.glyph')?.textContent).toBe('>_')
  expect(terminalButton?.querySelector('span:not(.glyph)')?.textContent).toBe('Terminal')
})

it('activating an app dispatches app-activate and closes', () => {
  const overview = mount()
  overview.open = true
  let detail: { appId: string } | undefined
  document.addEventListener(
    'app-activate',
    (event) => {
      detail = (event as CustomEvent<{ appId: string }>).detail
    },
    { once: true }
  )
  overview.shadowRoot?.querySelector<HTMLButtonElement>('[data-app-id="readme"]')?.click()
  expect(detail).toEqual({ appId: 'readme' })
  expect(overview.open).toBe(false)
})

it('escape closes the overview', () => {
  const overview = mount()
  overview.open = true
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  expect(overview.open).toBe(false)
})
