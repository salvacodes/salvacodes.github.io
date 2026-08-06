import { APP_ACTIVATE_EVENT, type AppActivateDetail } from '../apps/app-activation'
import { type DesktopPreferences, desktopPreferences } from '../preferences/desktop-preferences'
import type { MenuEntry, Point } from './context-menu/context-menu-model'
import { requestContextMenu } from './context-menu/context-menu-request'
import { observeLongPress } from './context-menu/long-press'
import styles from './wallpaper.css?inline'
import { WALLPAPER_SURFACE_MARKUP, wallpaperSurfaceSheet } from './wallpaper-surface'

const sheet = new CSSStyleSheet()
sheet.replaceSync(styles)

export class Wallpaper extends HTMLElement {
  preferences: DesktopPreferences = desktopPreferences
  #stopObservingLongPress?: () => void
  #unsubscribe?: () => void

  connectedCallback(): void {
    if (!this.shadowRoot) {
      this.setAttribute('aria-hidden', 'true')
      const root = this.attachShadow({ mode: 'open' })
      root.adoptedStyleSheets = [sheet, wallpaperSurfaceSheet()]
      root.innerHTML = WALLPAPER_SURFACE_MARKUP
      this.addEventListener('contextmenu', (event) => {
        event.preventDefault()
        this.#requestMenu({ x: event.clientX, y: event.clientY })
      })
    }
    this.#stopObservingLongPress = observeLongPress(this, (point) => this.#requestMenu(point))
    this.#unsubscribe = this.preferences.subscribe(() => this.#reflectWallpaper())
    this.#reflectWallpaper()
  }

  disconnectedCallback(): void {
    this.#stopObservingLongPress?.()
    this.#unsubscribe?.()
  }

  #reflectWallpaper(): void {
    const surface = this.shadowRoot?.querySelector<HTMLElement>('.surface')
    if (surface) {
      surface.dataset.variant = this.preferences.getWallpaper()
    }
  }

  #requestMenu(anchor: Point): void {
    requestContextMenu(this, { anchor, entries: this.#entries() })
  }

  #entries(): MenuEntry[] {
    return [
      { id: 'open-terminal', label: 'Open Terminal', perform: () => this.#activate('terminal') },
      { id: 'change-background', label: 'Change Background…', perform: () => this.#activate('settings') },
      { id: 'display-settings', label: 'Display Settings', disabled: true },
      { separator: true },
      { id: 'activities', label: 'Activities Overview', perform: () => this.#toggleActivities() },
      { separator: true },
      { id: 'about', label: 'About This Desktop', disabled: true }
    ]
  }

  #activate(appId: string): void {
    this.dispatchEvent(
      new CustomEvent<AppActivateDetail>(APP_ACTIVATE_EVENT, { bubbles: true, composed: true, detail: { appId } })
    )
  }

  #toggleActivities(): void {
    this.dispatchEvent(new CustomEvent('activities-toggle', { bubbles: true, composed: true }))
  }
}

customElements.define('sc-wallpaper', Wallpaper)
