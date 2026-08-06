import { createAppRegistry } from '../apps'
import { APP_ACTIVATE_EVENT, type AppActivateDetail } from '../apps/app-activation'
import { startLocationSync } from '../routing/location-sync'
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
import './quick-settings/quick-settings-panel'
import { POWER_ACTION_ID, SETTINGS_ACTION_ID } from './quick-settings/quick-settings-model'
import {
  QUICK_SETTINGS_ACTION_EVENT,
  QUICK_SETTINGS_DISMISSED_EVENT,
  type QuickSettingsActionDetail,
  type QuickSettingsPanel
} from './quick-settings/quick-settings-panel'
import './session/session-screen'
import './session/shutdown-dialog'
import {
  BOOT_COMPLETE_EVENT,
  POWER_ON_REQUESTED_EVENT,
  type SessionScreen,
  SHUTDOWN_FADE_COMPLETE_EVENT
} from './session/session-screen'
import { SessionState } from './session/session-state'
import { SHUTDOWN_CANCELLED_EVENT, SHUTDOWN_CONFIRMED_EVENT, type ShutdownDialog } from './session/shutdown-dialog'
import { SYSTEM_MENU_TOGGLE_EVENT, type TopBar } from './top-bar'

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
  #stopLocationSync?: () => void
  #compactQuery = window.matchMedia('(max-width: 768px)')
  #compactListener = (): void => this.#applyCompactMode()
  #hasBooted = false
  #session = new SessionState()

  connectedCallback(): void {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: 'open' })
      root.adoptedStyleSheets = [sheet]
      root.append(document.createElement('sc-wallpaper'))
      const topBar = document.createElement('sc-top-bar') as TopBar
      root.append(topBar)
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
      const quickSettings = document.createElement('sc-quick-settings') as QuickSettingsPanel
      root.append(quickSettings)
      const shutdownDialog = document.createElement('sc-shutdown-dialog') as ShutdownDialog
      root.append(shutdownDialog)
      const sessionScreen = document.createElement('sc-session-screen') as SessionScreen
      root.append(sessionScreen)
      this.#menuLayer = document.createElement('sc-context-menu') as ContextMenuLayer
      root.append(this.#menuLayer)
      const syncSystemMenu = (): void => {
        topBar.systemMenuExpanded = quickSettings.isOpen
      }
      root.addEventListener('activities-toggle', () => {
        overview.open = !overview.open
      })
      root.addEventListener(SYSTEM_MENU_TOGGLE_EVENT, () => {
        if (quickSettings.isOpen) {
          quickSettings.close()
        } else {
          quickSettings.open(topBar.statusButton)
        }
        syncSystemMenu()
      })
      root.addEventListener(QUICK_SETTINGS_DISMISSED_EVENT, () => {
        syncSystemMenu()
      })
      root.addEventListener(QUICK_SETTINGS_ACTION_EVENT, (event) => {
        const { actionId } = (event as CustomEvent<QuickSettingsActionDetail>).detail
        syncSystemMenu()
        if (actionId === SETTINGS_ACTION_ID) {
          this.#activateApp('settings')
        }
        if (actionId === POWER_ACTION_ID) {
          this.#session.requestShutdown()
          shutdownDialog.open()
        }
      })
      const holdsTheScreen = (): boolean => this.#session.phase !== 'running' && this.#session.phase !== 'confirming'
      this.#session.subscribe(() => {
        sessionScreen.phase = this.#session.phase
        for (const layer of root.children) {
          if (layer !== sessionScreen) {
            ;(layer as HTMLElement).inert = holdsTheScreen()
          }
        }
      })
      root.addEventListener(SHUTDOWN_CANCELLED_EVENT, () => this.#session.cancel())
      root.addEventListener(SHUTDOWN_CONFIRMED_EVENT, () => {
        this.#session.confirm()
        this.#closeAllWindows()
      })
      root.addEventListener(SHUTDOWN_FADE_COMPLETE_EVENT, () => this.#session.finishShutdown())
      root.addEventListener(POWER_ON_REQUESTED_EVENT, () => this.#session.powerOn())
      root.addEventListener(BOOT_COMPLETE_EVENT, () => {
        this.#session.finishBoot()
        this.#hasBooted = false
        this.#bootDesktop()
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
    this.#bootDesktop()
    this.#stopLocationSync = startLocationSync({
      manager: this.#manager,
      activate: (appId, params) => this.#activateApp(appId, params)
    })
  }

  disconnectedCallback(): void {
    this.#stopLocationSync?.()
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

  #bootDesktop(): void {
    if (this.#hasBooted) {
      return
    }
    this.#hasBooted = true
    this.#activateApp('terminal')
  }

  #closeAllWindows(): void {
    for (const managedWindow of this.#manager.list()) {
      this.#manager.close(managedWindow.id)
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
