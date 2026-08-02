import { expect, it } from 'vitest'
import './wallpaper'

it('renders the decorative layers and stays out of the accessibility tree', () => {
  const wallpaper = document.createElement('sc-wallpaper')
  document.body.append(wallpaper)
  expect(wallpaper.getAttribute('aria-hidden')).toBe('true')
  expect(wallpaper.shadowRoot?.querySelector('.gradient')).not.toBeNull()
  expect(wallpaper.shadowRoot?.querySelector('svg.motif')).not.toBeNull()
  wallpaper.remove()
})
