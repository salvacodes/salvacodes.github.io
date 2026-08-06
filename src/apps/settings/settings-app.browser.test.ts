import { afterEach, expect, it } from 'vitest'
import './settings-app'

const mount = (): HTMLElement => {
  const app = document.createElement('sc-settings-app')
  document.body.append(app)
  return app
}

afterEach(() => {
  for (const element of document.querySelectorAll('sc-settings-app')) {
    element.remove()
  }
})

it('lists the gnome settings panels in a sidebar', () => {
  const app = mount()
  const labels = [...(app.shadowRoot?.querySelectorAll('[data-panel-id]') ?? [])].map((item) => item.textContent)
  expect(labels).toEqual(['Appearance', 'Network', 'Displays', 'Sound', 'Power', 'About'])
})

it('selects appearance and disables every other panel', () => {
  const app = mount()
  const appearance = app.shadowRoot?.querySelector('[data-panel-id="appearance"]')
  expect(appearance?.getAttribute('aria-current')).toBe('true')
  const disabled = [...(app.shadowRoot?.querySelectorAll('[data-panel-id][aria-disabled="true"]') ?? [])].map(
    (item) => (item as HTMLElement).dataset.panelId
  )
  expect(disabled).toEqual(['network', 'displays', 'sound', 'power', 'about'])
})

it('shows the appearance panel in the content pane', () => {
  expect(mount().shadowRoot?.querySelector('sc-appearance-panel')).not.toBeNull()
})

it('names the sidebar for assistive technology', () => {
  expect(mount().shadowRoot?.querySelector('nav')?.getAttribute('aria-label')).toBe('Settings panels')
})
