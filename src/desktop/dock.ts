import { APP_ACTIVATE_EVENT, type AppActivateDetail } from '../apps/app-activation'
import type { AppRegistry } from '../apps/app-registry'
import type { WindowManager } from '../windowing/window-manager'
import { appIconMenuEntries } from './context-menu/app-icon-menu'
import type { Point } from './context-menu/context-menu-model'
import { requestContextMenu } from './context-menu/context-menu-request'
import { observeLongPress } from './context-menu/long-press'
import styles from './dock.css?inline'
import { createIconSvg } from './icon-svg'

const sheet = new CSSStyleSheet()
sheet.replaceSync(styles)

export class Dock extends HTMLElement {
  registry!: AppRegistry
  manager!: WindowManager
  #unsubscribe?: () => void

  connectedCallback(): void {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: 'open' })
      root.adoptedStyleSheets = [sheet]
      const nav = document.createElement('nav')
      nav.setAttribute('aria-label', 'Dock')
      for (const app of this.registry.listLaunchable()) {
        const button = document.createElement('button')
        button.dataset.appId = app.id
        button.title = app.name
        const icon = app.iconSvg ? createIconSvg(app.iconSvg) : null
        if (icon) {
          button.append(icon)
        } else {
          button.textContent = app.iconGlyph
        }
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
        nav.append(button)
      }
      root.append(nav)
    }
    this.#unsubscribe = this.manager.subscribe(() => this.#renderRunningState())
    this.#renderRunningState()
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.()
  }

  #activate(appId: string): void {
    this.dispatchEvent(
      new CustomEvent<AppActivateDetail>(APP_ACTIVATE_EVENT, { bubbles: true, composed: true, detail: { appId } })
    )
  }

  #renderRunningState(): void {
    const runningAppIds = new Set(this.manager.list().map((window) => window.appId))
    for (const button of this.shadowRoot?.querySelectorAll<HTMLButtonElement>('button[data-app-id]') ?? []) {
      button.classList.toggle('running', runningAppIds.has(button.dataset.appId ?? ''))
    }
  }
}

customElements.define('sc-dock', Dock)
