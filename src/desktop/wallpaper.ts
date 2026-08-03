import { APP_ACTIVATE_EVENT, type AppActivateDetail } from '../apps/app-activation'
import type { MenuEntry, Point } from './context-menu/context-menu-model'
import { requestContextMenu } from './context-menu/context-menu-request'
import { observeLongPress } from './context-menu/long-press'
import styles from './wallpaper.css?inline'

const sheet = new CSSStyleSheet()
sheet.replaceSync(styles)

export class Wallpaper extends HTMLElement {
  #stopObservingLongPress?: () => void

  connectedCallback(): void {
    if (!this.shadowRoot) {
      this.setAttribute('aria-hidden', 'true')
      const root = this.attachShadow({ mode: 'open' })
      root.adoptedStyleSheets = [sheet]
      root.innerHTML = `
      <div class="gradient"></div>
      <svg class="motif" viewBox="0 0 200 200" fill="none" stroke="#367bf0" stroke-width="1.5">
        <path d="M40 160 L70 100 L100 130 L130 60 L160 90" />
        <path d="M40 160 L100 40 L160 90" stroke-opacity="0.4" />
        <circle cx="70" cy="100" r="3" fill="#367bf0" />
        <circle cx="100" cy="130" r="3" fill="#367bf0" />
        <circle cx="130" cy="60" r="3" fill="#367bf0" />
        <circle cx="100" cy="40" r="3" fill="#557c94" />
        <path d="M100 40 L100 130" stroke="#557c94" stroke-opacity="0.35" stroke-dasharray="4 6" />
      </svg>
    `
      this.addEventListener('contextmenu', (event) => {
        event.preventDefault()
        this.#requestMenu({ x: event.clientX, y: event.clientY })
      })
    }
    this.#stopObservingLongPress = observeLongPress(this, (point) => this.#requestMenu(point))
  }

  disconnectedCallback(): void {
    this.#stopObservingLongPress?.()
  }

  #requestMenu(anchor: Point): void {
    requestContextMenu(this, { anchor, entries: this.#entries() })
  }

  #entries(): MenuEntry[] {
    return [
      { id: 'open-terminal', label: 'Open Terminal', perform: () => this.#activate('terminal') },
      { id: 'change-background', label: 'Change Background…', disabled: true },
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
