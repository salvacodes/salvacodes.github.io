import { WALLPAPER_SURFACE_MARKUP, wallpaperSurfaceSheet } from '../../desktop/wallpaper-surface'
import { type DesktopPreferences, desktopPreferences } from '../../preferences/desktop-preferences'
import { DESKTOP_STYLES, type DesktopStyle } from '../../preferences/style-catalog'
import { WALLPAPERS } from '../../preferences/wallpaper-catalog'
import styles from './appearance-panel.css?inline'

const sheet = new CSSStyleSheet()
sheet.replaceSync(styles)

const STYLE_NAMES: Record<DesktopStyle, string> = { dark: 'Dark', light: 'Light' }

export class AppearancePanel extends HTMLElement {
  preferences: DesktopPreferences = desktopPreferences
  #unsubscribe?: () => void

  connectedCallback(): void {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: 'open' })
      root.adoptedStyleSheets = [sheet, wallpaperSurfaceSheet()]
      root.append(this.#renderStyles(), this.#renderWallpapers())
    }
    this.#unsubscribe = this.preferences.subscribe(() => this.#reflect())
    this.#reflect()
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.()
  }

  #renderStyles(): HTMLElement {
    const section = document.createElement('section')
    const heading = document.createElement('h2')
    heading.textContent = 'Style'
    const group = document.createElement('div')
    group.className = 'styles'
    group.setAttribute('role', 'radiogroup')
    group.setAttribute('aria-label', 'Style')
    for (const style of DESKTOP_STYLES) {
      const option = document.createElement('button')
      option.type = 'button'
      option.className = 'style'
      option.dataset.styleId = style
      option.setAttribute('role', 'radio')
      const preview = document.createElement('span')
      preview.className = 'style-preview'
      preview.dataset.preview = style
      const name = document.createElement('span')
      name.className = 'style-name'
      name.textContent = STYLE_NAMES[style]
      option.append(preview, name)
      option.addEventListener('click', () => this.preferences.setStyle(style))
      group.append(option)
    }
    section.append(heading, group)
    return section
  }

  #renderWallpapers(): HTMLElement {
    const section = document.createElement('section')
    const heading = document.createElement('h2')
    heading.textContent = 'Background'
    const grid = document.createElement('div')
    grid.className = 'wallpapers'
    for (const wallpaper of WALLPAPERS) {
      const option = document.createElement('button')
      option.type = 'button'
      option.className = 'wallpaper'
      option.dataset.wallpaperId = wallpaper.id
      option.setAttribute('aria-label', wallpaper.label)
      option.innerHTML = WALLPAPER_SURFACE_MARKUP
      const surface = option.querySelector<HTMLElement>('.surface')
      if (surface) {
        surface.dataset.variant = wallpaper.id
      }
      const name = document.createElement('span')
      name.className = 'wallpaper-name'
      name.textContent = wallpaper.label
      option.append(name)
      option.addEventListener('click', () => this.preferences.setWallpaper(wallpaper.id))
      grid.append(option)
    }
    section.append(heading, grid)
    return section
  }

  #reflect(): void {
    const currentStyle = this.preferences.getStyle()
    for (const option of this.shadowRoot?.querySelectorAll<HTMLElement>('[data-style-id]') ?? []) {
      option.setAttribute('aria-checked', String(option.dataset.styleId === currentStyle))
    }
    const currentWallpaper = this.preferences.getWallpaper()
    for (const option of this.shadowRoot?.querySelectorAll<HTMLElement>('[data-wallpaper-id]') ?? []) {
      option.setAttribute('aria-pressed', String(option.dataset.wallpaperId === currentWallpaper))
    }
  }
}

customElements.define('sc-appearance-panel', AppearancePanel)
