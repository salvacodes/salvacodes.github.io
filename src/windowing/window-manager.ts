export interface Size {
  width: number
  height: number
}

export interface Geometry extends Size {
  x: number
  y: number
}

export interface OpenRequest {
  appId: string
  title: string
  initialSize?: Size
  minSize?: Size
  params?: Record<string, string>
}

export interface ManagedWindow {
  id: string
  appId: string
  title: string
  geometry: Geometry
  minSize: Size
  zIndex: number
  isFocused: boolean
  isMinimized: boolean
  isMaximized: boolean
  params: Record<string, string>
}

export const TOP_BAR_HEIGHT = 32
export const TITLE_BAR_HEIGHT = 40

const DEFAULT_SIZE: Size = { width: 640, height: 480 }
const DEFAULT_MIN_SIZE: Size = { width: 320, height: 240 }
const CASCADE_OFFSET = 24
const CASCADE_CYCLE = 8
const MIN_VISIBLE_EDGE = 96

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max)

export class WindowManager {
  #windows = new Map<string, ManagedWindow>()
  #listeners = new Set<() => void>()
  #viewport: Size
  #nextZIndex = 0
  #openedCount = 0
  #restoreGeometries = new Map<string, Geometry>()

  constructor(viewport: Size) {
    this.#viewport = viewport
  }

  list(): ManagedWindow[] {
    return [...this.#windows.values()].map((window) => structuredClone(window))
  }

  open(request: OpenRequest): ManagedWindow {
    const size = request.initialSize ?? { ...DEFAULT_SIZE }
    const cascade = (this.#openedCount % CASCADE_CYCLE) * CASCADE_OFFSET
    this.#openedCount += 1
    const window: ManagedWindow = {
      id: `window-${this.#openedCount}`,
      appId: request.appId,
      title: request.title,
      geometry: {
        x: Math.round((this.#viewport.width - size.width) / 2) + cascade,
        y: TOP_BAR_HEIGHT + Math.round((this.#viewport.height - TOP_BAR_HEIGHT - size.height) / 2) + cascade,
        width: size.width,
        height: size.height
      },
      minSize: request.minSize ? { ...request.minSize } : { ...DEFAULT_MIN_SIZE },
      zIndex: 0,
      isFocused: false,
      isMinimized: false,
      isMaximized: false,
      params: { ...(request.params ?? {}) }
    }
    this.#windows.set(window.id, window)
    this.#giveFocus(window)
    this.#notify()
    return structuredClone(window)
  }

  close(id: string): void {
    this.#require(id)
    this.#windows.delete(id)
    this.#restoreGeometries.delete(id)
    const topmost = this.#topmostVisible()
    if (topmost) {
      this.#giveFocus(topmost)
    }
    this.#notify()
  }

  focus(id: string): void {
    this.#giveFocus(this.#require(id))
    this.#notify()
  }

  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  move(id: string, x: number, y: number): void {
    const window = this.#require(id)
    this.#applyPosition(window, x, y)
    this.#notify()
  }

  resize(id: string, geometry: Geometry): void {
    const window = this.#require(id)
    window.geometry.width = clamp(geometry.width, window.minSize.width, this.#viewport.width)
    window.geometry.height = clamp(geometry.height, window.minSize.height, this.#viewport.height - TOP_BAR_HEIGHT)
    this.#applyPosition(window, geometry.x, geometry.y)
    this.#notify()
  }

  maximize(id: string): void {
    const window = this.#require(id)
    window.isMinimized = false
    if (window.isMaximized) {
      this.#giveFocus(window)
      this.#notify()
      return
    }
    this.#restoreGeometries.set(id, { ...window.geometry })
    window.geometry = this.#workArea()
    window.isMaximized = true
    this.#giveFocus(window)
    this.#notify()
  }

  minimize(id: string): void {
    const window = this.#require(id)
    window.isMinimized = true
    window.isFocused = false
    const topmost = this.#topmostVisible()
    if (topmost) {
      this.#giveFocus(topmost)
    }
    this.#notify()
  }

  restore(id: string): void {
    const window = this.#require(id)
    if (window.isMinimized) {
      window.isMinimized = false
    } else if (window.isMaximized) {
      window.isMaximized = false
      const remembered = this.#restoreGeometries.get(id)
      if (remembered) {
        window.geometry = { ...remembered }
        this.#restoreGeometries.delete(id)
      }
    }
    this.#giveFocus(window)
    this.#notify()
  }

  setViewport(viewport: Size): void {
    this.#viewport = viewport
    for (const window of this.#windows.values()) {
      if (window.isMaximized) {
        window.geometry = this.#workArea()
      } else {
        this.#applyPosition(window, window.geometry.x, window.geometry.y)
      }
    }
    this.#notify()
  }

  #workArea(): Geometry {
    return {
      x: 0,
      y: TOP_BAR_HEIGHT,
      width: this.#viewport.width,
      height: this.#viewport.height - TOP_BAR_HEIGHT
    }
  }

  #applyPosition(window: ManagedWindow, x: number, y: number): void {
    window.geometry.x = clamp(x, MIN_VISIBLE_EDGE - window.geometry.width, this.#viewport.width - MIN_VISIBLE_EDGE)
    window.geometry.y = clamp(y, TOP_BAR_HEIGHT, this.#viewport.height - TITLE_BAR_HEIGHT)
  }

  #giveFocus(target: ManagedWindow): void {
    for (const window of this.#windows.values()) {
      window.isFocused = window === target
    }
    this.#nextZIndex += 1
    target.zIndex = this.#nextZIndex
  }

  #topmostVisible(): ManagedWindow | undefined {
    return [...this.#windows.values()].filter((window) => !window.isMinimized).sort((a, b) => b.zIndex - a.zIndex)[0]
  }

  #require(id: string): ManagedWindow {
    const window = this.#windows.get(id)
    if (!window) {
      throw new Error(`Unknown window: ${id}`)
    }
    return window
  }

  #notify(): void {
    for (const listener of this.#listeners) {
      listener()
    }
  }
}
