import { createAppRegistry } from '../apps'
import { APP_ACTIVATE_EVENT, type AppActivateDetail } from '../apps/app-activation'
import type { DesktopWindow } from '../windowing/desktop-window'
import { WindowManager } from '../windowing/window-manager'
import type { ActivitiesOverview } from './activities-overview'
import '../windowing/desktop-window'
import './wallpaper'
import './top-bar'
import './dock'
import './activities-overview'
import './context-menu/context-menu-layer'
import type { ContextMenuLayer } from './context-menu/context-menu-layer'
import { CONTEXT_MENU_EVENT, type ContextMenuDetail } from './context-menu/context-menu-request'
import { deepActiveElement } from './context-menu/focus-target'
import styles from './desktop-shell.css?inline'
import type { Dock } from './dock'
import { PRINT_DOCUMENT_EVENT, type PrintDocumentDetail, printFragment } from './print-surface'

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
  #menuLayer!: ContextMenuLayer
  #suppressNativeMenu = (event: Event): void => event.preventDefault()
  #menuKeyListener = (event: KeyboardEvent): void => {
    if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) {
      return
    }
    const target = deepActiveElement()
    if (!target) {
      return
    }
    event.preventDefault()
    const bounds = target.getBoundingClientRect()
    target.dispatchEvent(
      new MouseEvent('contextmenu', {
        bubbles: true,
        composed: true,
        cancelable: true,
        clientX: Math.round(bounds.left + bounds.width / 2),
        clientY: Math.round(bounds.bottom)
      })
    )
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
      overview.manager = this.#manager
      root.append(overview)
      this.#menuLayer = document.createElement('sc-context-menu') as ContextMenuLayer
      root.append(this.#menuLayer)
      root.addEventListener('activities-toggle', () => {
        overview.open = !overview.open
      })
      root.addEventListener(APP_ACTIVATE_EVENT, (event) => {
        const detail = (event as CustomEvent<AppActivateDetail>).detail
        this.#activateApp(detail.appId, detail.params ?? {}, detail.title)
      })
      root.addEventListener(PRINT_DOCUMENT_EVENT, (event) => {
        printFragment((event as CustomEvent<PrintDocumentDetail>).detail.fragment)
      })
      root.addEventListener(CONTEXT_MENU_EVENT, (event) => {
        const detail = (event as CustomEvent<ContextMenuDetail>).detail
        this.#menuLayer.open(detail, deepActiveElement())
      })
    }
    this.#unsubscribe = this.#manager.subscribe(() => {
      this.#menuLayer.close()
      this.#reconcileWindows()
    })
    window.addEventListener('resize', this.#resizeListener)
    window.addEventListener('contextmenu', this.#suppressNativeMenu)
    window.addEventListener('keydown', this.#menuKeyListener)
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
    window.removeEventListener('contextmenu', this.#suppressNativeMenu)
    window.removeEventListener('keydown', this.#menuKeyListener)
    this.#compactQuery.removeEventListener('change', this.#compactListener)
  }

  #activateApp(appId: string, params: Record<string, string> = {}, title?: string): void {
    const app = this.#registry.get(appId)
    const appWindows = this.#manager
      .list()
      .filter((window) => window.appId === appId && this.#sameParams(window.params, params))
      .sort((a, b) => b.zIndex - a.zIndex)
    const topmost = appWindows[0]
    if (!topmost) {
      const opened = this.#manager.open({
        appId: app.id,
        title: title ?? app.windowTitle ?? app.name,
        initialSize: app.initialSize,
        minSize: app.minSize,
        params
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

  #sameParams(left: Record<string, string>, right: Record<string, string>): boolean {
    const leftKeys = Object.keys(left)
    return leftKeys.length === Object.keys(right).length && leftKeys.every((key) => left[key] === right[key])
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
      const appElement = document.createElement(app.elementTag)
      for (const [name, value] of Object.entries(managedWindow.params)) {
        appElement.setAttribute(name, value)
      }
      element.append(appElement)
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
