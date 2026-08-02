import { APP_ACTIVATE_EVENT, type AppActivateDetail } from '../apps/app-activation'
import type { AppRegistry } from '../apps/app-registry'
import type { WindowManager } from '../windowing/window-manager'
import styles from './activities-overview.css?inline'
import { appIconMenuEntries } from './context-menu/app-icon-menu'
import type { Point } from './context-menu/context-menu-model'
import { requestContextMenu } from './context-menu/context-menu-request'
import { observeLongPress } from './context-menu/long-press'

const sheet = new CSSStyleSheet()
sheet.replaceSync(styles)

export class ActivitiesOverview extends HTMLElement {
  registry!: AppRegistry
  manager!: WindowManager
  #escapeListener = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.open = false
    }
  }

  get open(): boolean {
    return this.hasAttribute('open')
  }

  set open(value: boolean) {
    this.toggleAttribute('open', value)
    if (value) {
      window.addEventListener('keydown', this.#escapeListener)
    } else {
      window.removeEventListener('keydown', this.#escapeListener)
    }
  }

  connectedCallback(): void {
    if (this.shadowRoot) {
      return
    }
    const root = this.attachShadow({ mode: 'open' })
    root.adoptedStyleSheets = [sheet]
    const backdrop = document.createElement('button')
    backdrop.className = 'backdrop'
    backdrop.setAttribute('aria-label', 'Close overview')
    backdrop.addEventListener('click', () => {
      this.open = false
    })
    const grid = document.createElement('div')
    grid.className = 'grid'
    for (const app of this.registry.listLaunchable()) {
      const button = document.createElement('button')
      button.dataset.appId = app.id
      const glyph = document.createElement('span')
      glyph.className = 'glyph'
      glyph.textContent = app.iconGlyph
      const name = document.createElement('span')
      name.textContent = app.name
      button.append(glyph, name)
      button.addEventListener('click', () => {
        this.#activate(app.id)
      })
      const requestMenu = (anchor: Point): void => {
        requestContextMenu(button, {
          anchor,
          entries: appIconMenuEntries(app, this.manager, () => this.#activate(app.id))
        })
      }
      button.addEventListener('contextmenu', (event) => {
        event.preventDefault()
        requestMenu({ x: event.clientX, y: event.clientY })
      })
      observeLongPress(button, requestMenu)
      grid.append(button)
    }
    root.append(backdrop, grid)
  }

  disconnectedCallback(): void {
    window.removeEventListener('keydown', this.#escapeListener)
  }

  #activate(appId: string): void {
    this.dispatchEvent(
      new CustomEvent<AppActivateDetail>(APP_ACTIVATE_EVENT, { bubbles: true, composed: true, detail: { appId } })
    )
    this.open = false
  }
}

customElements.define('sc-overview', ActivitiesOverview)
