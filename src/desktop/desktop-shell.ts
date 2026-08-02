import { createAppRegistry } from '../apps'
import type { DesktopWindow } from '../windowing/desktop-window'
import { WindowManager } from '../windowing/window-manager'
import type { ActivitiesOverview } from './activities-overview'
import '../windowing/desktop-window'
import './wallpaper'
import './top-bar'
import './dock'
import './activities-overview'
import styles from './desktop-shell.css?inline'
import type { Dock } from './dock'

const sheet = new CSSStyleSheet()
sheet.replaceSync(styles)

export class DesktopShell extends HTMLElement {
  #manager = new WindowManager({ width: window.innerWidth, height: window.innerHeight })
  #registry = createAppRegistry()
  #windowElements = new Map<string, DesktopWindow>()
  #unsubscribe?: () => void
  #resizeListener = (): void => {
    this.#manager.setViewport({ width: window.innerWidth, height: window.innerHeight })
  }
  #compactQuery = window.matchMedia('(max-width: 768px)')
  #compactListener = (): void => this.#applyCompactMode()
  #hasBooted = false

  connectedCallback(): void {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: 'open' })
      root.adoptedStyleSheets = [sheet]
      root.append(document.createElement('sc-wallpaper'))
      root.append(document.createElement('sc-top-bar'))
      const windowsLayer = document.createElement('div')
      windowsLayer.id = 'windows'
      root.append(windowsLayer)
      const dock = document.createElement('sc-dock') as Dock
      dock.manager = this.#manager
      dock.registry = this.#registry
      root.append(dock)
      const overview = document.createElement('sc-overview') as ActivitiesOverview
      overview.registry = this.#registry
      root.append(overview)
      root.addEventListener('activities-toggle', () => {
        overview.open = !overview.open
      })
      root.addEventListener('app-activate', (event) => {
        this.#activateApp((event as CustomEvent<{ appId: string }>).detail.appId)
      })
    }
    this.#unsubscribe = this.#manager.subscribe(() => this.#reconcileWindows())
    window.addEventListener('resize', this.#resizeListener)
    this.#compactQuery.addEventListener('change', this.#compactListener)
    this.#applyCompactMode()
    if (!this.#hasBooted) {
      this.#hasBooted = true
      this.#activateApp('terminal')
    }
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.()
    window.removeEventListener('resize', this.#resizeListener)
    this.#compactQuery.removeEventListener('change', this.#compactListener)
  }

  #activateApp(appId: string): void {
    const app = this.#registry.get(appId)
    const appWindows = this.#manager
      .list()
      .filter((window) => window.appId === appId)
      .sort((a, b) => b.zIndex - a.zIndex)
    const topmost = appWindows[0]
    if (!topmost) {
      const opened = this.#manager.open({
        appId: app.id,
        title: app.windowTitle ?? app.name,
        initialSize: app.initialSize,
        minSize: app.minSize
      })
      if (this.#isCompact()) {
        this.#manager.maximize(opened.id)
      }
      return
    }
    if (topmost.isMinimized) {
      this.#manager.restore(topmost.id)
    } else {
      this.#manager.focus(topmost.id)
    }
  }

  #reconcileWindows(): void {
    const windowsLayer = this.shadowRoot?.querySelector('#windows')
    if (!windowsLayer) {
      return
    }
    const liveIds = new Set(this.#manager.list().map((window) => window.id))
    for (const [id, element] of this.#windowElements) {
      if (!liveIds.has(id)) {
        element.remove()
        this.#windowElements.delete(id)
      }
    }
    for (const managedWindow of this.#manager.list()) {
      if (this.#windowElements.has(managedWindow.id)) {
        continue
      }
      const app = this.#registry.get(managedWindow.appId)
      const element = document.createElement('sc-window') as DesktopWindow
      element.manager = this.#manager
      element.windowId = managedWindow.id
      element.toggleAttribute('compact', this.#isCompact())
      element.append(document.createElement(app.elementTag))
      windowsLayer.append(element)
      this.#windowElements.set(managedWindow.id, element)
    }
  }

  #isCompact(): boolean {
    return window.matchMedia('(max-width: 768px)').matches
  }

  #applyCompactMode(): void {
    const compact = this.#isCompact()
    this.toggleAttribute('compact', compact)
    for (const element of this.#windowElements.values()) {
      element.toggleAttribute('compact', compact)
    }
  }
}

customElements.define('sc-desktop', DesktopShell)
