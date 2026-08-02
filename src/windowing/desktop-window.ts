import styles from './desktop-window.css?inline'
import type { ManagedWindow, WindowManager } from './window-manager'

const sheet = new CSSStyleSheet()
sheet.replaceSync(styles)

const RESIZE_DIRECTIONS = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const

interface GestureStart {
  pointerX: number
  pointerY: number
  geometry: { x: number; y: number; width: number; height: number }
}

export class DesktopWindow extends HTMLElement {
  manager!: WindowManager
  windowId!: string
  #unsubscribe?: () => void

  connectedCallback(): void {
    if (!this.shadowRoot) {
      this.tabIndex = -1
      const root = this.attachShadow({ mode: 'open' })
      root.adoptedStyleSheets = [sheet]
      root.innerHTML = `
        <section role="dialog" aria-labelledby="title">
          <header id="title-bar">
            <h1 id="title"></h1>
            <div id="controls">
              <button id="minimize" aria-label="Minimize">–</button>
              <button id="maximize" aria-label="Maximize">□</button>
              <button id="close" aria-label="Close">✕</button>
            </div>
          </header>
          <div id="content"><slot></slot></div>
          ${RESIZE_DIRECTIONS.map(
            (direction) => `<div class="resize-handle" data-direction="${direction}"></div>`
          ).join('')}
        </section>
      `
      this.#wireControls(root)
    }
    this.#unsubscribe = this.manager.subscribe(() => this.#render())
    this.#render()
    if (this.#currentState()?.isFocused) {
      this.focus()
    }
  }

  disconnectedCallback(): void {
    this.#unsubscribe?.()
  }

  #currentState(): ManagedWindow | undefined {
    return this.manager.list().find((window) => window.id === this.windowId)
  }

  #wireControls(root: ShadowRoot): void {
    this.addEventListener('pointerdown', () => {
      const state = this.#currentState()
      if (!state) {
        return
      }
      this.manager.focus(this.windowId)
    })
    root.querySelector('#close')?.addEventListener('click', () => {
      const state = this.#currentState()
      if (!state) {
        return
      }
      this.manager.close(this.windowId)
    })
    root.querySelector('#minimize')?.addEventListener('click', () => {
      const state = this.#currentState()
      if (!state) {
        return
      }
      this.manager.minimize(this.windowId)
    })
    root.querySelector('#maximize')?.addEventListener('click', () => {
      this.#toggleMaximize()
    })
    const titleBar = root.querySelector<HTMLElement>('#title-bar')
    titleBar?.addEventListener('dblclick', (event) => {
      if (this.#isControlButtonTarget(event)) {
        return
      }
      this.#toggleMaximize()
    })
    titleBar?.addEventListener('pointerdown', (event) => {
      if (this.#isControlButtonTarget(event)) {
        return
      }
      if (event.detail >= 2) {
        this.#toggleMaximize()
        return
      }
      this.#beginGesture(event, (start, dx, dy) => ({
        x: start.geometry.x + dx,
        y: start.geometry.y + dy,
        width: start.geometry.width,
        height: start.geometry.height
      }))
    })
    for (const handle of root.querySelectorAll<HTMLElement>('.resize-handle')) {
      handle.addEventListener('pointerdown', (event) => {
        const direction = handle.dataset.direction ?? ''
        this.#beginGesture(event, (start, dx, dy) => this.#resizedGeometry(start, direction, dx, dy))
      })
    }
  }

  #isControlButtonTarget(event: Event): boolean {
    return (event.target as HTMLElement).closest('button') !== null
  }

  #toggleMaximize(): void {
    const state = this.#currentState()
    if (!state) {
      return
    }
    if (state.isMaximized) {
      this.manager.restore(this.windowId)
    } else {
      this.manager.maximize(this.windowId)
    }
  }

  #gestureBlocked(): boolean {
    return this.hasAttribute('maximized') || this.hasAttribute('compact')
  }

  #beginGesture(
    event: PointerEvent,
    project: (start: GestureStart, dx: number, dy: number) => { x: number; y: number; width: number; height: number }
  ): void {
    if (this.#gestureBlocked()) {
      return
    }
    const state = this.#currentState()
    if (!state) {
      return
    }
    event.preventDefault()
    const surface = event.currentTarget as HTMLElement
    surface.setPointerCapture(event.pointerId)
    const start: GestureStart = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      geometry: { ...state.geometry }
    }
    const onMove = (moveEvent: PointerEvent) => {
      const projected = project(start, moveEvent.clientX - start.pointerX, moveEvent.clientY - start.pointerY)
      this.manager.resize(this.windowId, projected)
    }
    const onEnd = () => {
      surface.removeEventListener('pointermove', onMove)
      surface.removeEventListener('pointerup', onEnd)
      surface.removeEventListener('pointercancel', onEnd)
    }
    surface.addEventListener('pointermove', onMove)
    surface.addEventListener('pointerup', onEnd)
    surface.addEventListener('pointercancel', onEnd)
  }

  #resizedGeometry(
    start: GestureStart,
    direction: string,
    dx: number,
    dy: number
  ): { x: number; y: number; width: number; height: number } {
    const geometry = { ...start.geometry }
    if (direction.includes('e')) {
      geometry.width += dx
    }
    if (direction.includes('w')) {
      geometry.x += dx
      geometry.width -= dx
    }
    if (direction.includes('s')) {
      geometry.height += dy
    }
    if (direction.includes('n')) {
      geometry.y += dy
      geometry.height -= dy
    }
    return geometry
  }

  #render(): void {
    const state = this.#currentState()
    if (!state) {
      this.toggleAttribute('hidden', true)
      return
    }
    this.style.transform = `translate(${state.geometry.x}px, ${state.geometry.y}px)`
    this.style.width = `${state.geometry.width}px`
    this.style.height = `${state.geometry.height}px`
    this.style.zIndex = String(state.zIndex)
    this.toggleAttribute('hidden', state.isMinimized)
    this.toggleAttribute('focused', state.isFocused)
    this.toggleAttribute('maximized', state.isMaximized)
    const title = this.shadowRoot?.querySelector('#title')
    if (title) {
      title.textContent = state.title
    }
  }
}

customElements.define('sc-window', DesktopWindow)
