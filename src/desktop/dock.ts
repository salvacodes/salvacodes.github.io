import type { AppRegistry } from '../apps/app-registry'
import type { WindowManager } from '../windowing/window-manager'
import styles from './dock.css?inline'

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
      for (const app of this.registry.list()) {
        const button = document.createElement('button')
        button.dataset.appId = app.id
        button.title = app.name
        button.textContent = app.iconGlyph
        button.addEventListener('click', () => {
          this.dispatchEvent(
            new CustomEvent('app-activate', {
              bubbles: true,
              composed: true,
              detail: { appId: app.id }
            })
          )
        })
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

  #renderRunningState(): void {
    const runningAppIds = new Set(this.manager.list().map((window) => window.appId))
    for (const button of this.shadowRoot?.querySelectorAll<HTMLButtonElement>('button[data-app-id]') ?? []) {
      button.classList.toggle('running', runningAppIds.has(button.dataset.appId ?? ''))
    }
  }
}

customElements.define('sc-dock', Dock)
