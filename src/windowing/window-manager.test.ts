import { describe, expect, it, vi } from 'vitest'
import { TITLE_BAR_HEIGHT, TOP_BAR_HEIGHT, WindowManager } from './window-manager'

const viewport = { width: 1920, height: 1080 }

const MIN_VISIBLE_EDGE = 96

const createManager = () => new WindowManager(viewport)

const openWelcome = (manager: WindowManager) => manager.open({ appId: 'welcome', title: 'Welcome' })

describe('opening windows', () => {
  it('assigns unique ids and keeps the requested metadata', () => {
    const manager = createManager()
    const first = openWelcome(manager)
    const second = openWelcome(manager)
    expect(first.id).not.toBe(second.id)
    expect(first.appId).toBe('welcome')
    expect(first.title).toBe('Welcome')
  })

  it('centers the first window in the work area below the top bar', () => {
    const manager = createManager()
    const { geometry } = openWelcome(manager)
    expect(geometry.x, 'equal gap left and right').toBe(viewport.width - geometry.x - geometry.width)
    expect(geometry.y).toBeGreaterThanOrEqual(TOP_BAR_HEIGHT)
    expect(geometry.y + geometry.height).toBeLessThanOrEqual(viewport.height)
  })

  it('cascades a second window down and to the right of the first', () => {
    const manager = createManager()
    const first = openWelcome(manager)
    const second = openWelcome(manager)
    expect(second.geometry.x).toBeGreaterThan(first.geometry.x)
    expect(second.geometry.y).toBeGreaterThan(first.geometry.y)
  })

  it('respects a requested initial size', () => {
    const manager = createManager()
    const window = manager.open({
      appId: 'welcome',
      title: 'Welcome',
      initialSize: { width: 800, height: 600 }
    })
    expect(window.geometry.width).toBe(800)
    expect(window.geometry.height).toBe(600)
  })

  it('focuses the new window and stacks it on top', () => {
    const manager = createManager()
    const first = openWelcome(manager)
    const second = openWelcome(manager)
    const windows = manager.list()
    expect(windows.find((w) => w.id === first.id)?.isFocused).toBe(false)
    expect(windows.find((w) => w.id === second.id)?.isFocused).toBe(true)
    expect(second.zIndex).toBeGreaterThan(first.zIndex)
  })
})

describe('focusing windows', () => {
  it('raises the focused window above all others', () => {
    const manager = createManager()
    const first = openWelcome(manager)
    const second = openWelcome(manager)
    manager.focus(first.id)
    const windows = manager.list()
    const refocusedFirst = windows.find((w) => w.id === first.id)
    const unfocusedSecond = windows.find((w) => w.id === second.id)
    expect(refocusedFirst?.isFocused).toBe(true)
    expect(unfocusedSecond?.isFocused).toBe(false)
    expect(refocusedFirst!.zIndex).toBeGreaterThan(unfocusedSecond!.zIndex)
  })

  it('throws for an unknown window id', () => {
    const manager = createManager()
    expect(() => manager.focus('nope')).toThrowError('Unknown window: nope')
  })
})

describe('closing windows', () => {
  it('removes the window from the list', () => {
    const manager = createManager()
    const window = openWelcome(manager)
    manager.close(window.id)
    expect(manager.list()).toHaveLength(0)
  })

  it('moves focus to the topmost remaining window', () => {
    const manager = createManager()
    const first = openWelcome(manager)
    const second = openWelcome(manager)
    manager.focus(first.id)
    manager.close(first.id)
    expect(manager.list().find((w) => w.id === second.id)?.isFocused).toBe(true)
  })
})

describe('subscriptions', () => {
  it('notifies listeners on every state change', () => {
    const manager = createManager()
    const listener = vi.fn()
    manager.subscribe(listener)
    const window = openWelcome(manager)
    manager.focus(window.id)
    manager.close(window.id)
    expect(listener).toHaveBeenCalledTimes(3)
  })

  it('stops notifying after unsubscribe', () => {
    const manager = createManager()
    const listener = vi.fn()
    const unsubscribe = manager.subscribe(listener)
    unsubscribe()
    openWelcome(manager)
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('snapshot isolation', () => {
  it('list() returns copies that do not leak internal state', () => {
    const manager = createManager()
    const window = openWelcome(manager)
    const snapshot = manager.list()[0]!
    snapshot.geometry.x = 9999
    expect(manager.list()[0]!.geometry.x).toBe(window.geometry.x)
  })

  it('copies a caller-supplied minSize instead of aliasing it', () => {
    const manager = createManager()
    const minSize = { width: 400, height: 300 }
    manager.open({ appId: 'welcome', title: 'Welcome', minSize })
    minSize.width = 9999
    expect(manager.list()[0]!.minSize.width).toBe(400)
  })
})

describe('moving windows', () => {
  it('moves to the requested position', () => {
    const manager = createManager()
    const window = openWelcome(manager)
    manager.move(window.id, 100, 200)
    expect(manager.list()[0]!.geometry.x).toBe(100)
    expect(manager.list()[0]!.geometry.y).toBe(200)
  })

  it('keeps a grabbable edge on screen when dragged off the left', () => {
    const manager = createManager()
    const window = openWelcome(manager)
    manager.move(window.id, -2000, 316)
    const { x, width } = manager.list()[0]!.geometry
    expect(x + width).toBeGreaterThanOrEqual(MIN_VISIBLE_EDGE)
  })

  it('keeps a grabbable edge on screen when dragged off the right', () => {
    const manager = createManager()
    const window = openWelcome(manager)
    manager.move(window.id, 5000, 316)
    expect(manager.list()[0]!.geometry.x).toBeLessThanOrEqual(viewport.width - MIN_VISIBLE_EDGE)
  })

  it('never lets the title bar go above the top bar', () => {
    const manager = createManager()
    const window = openWelcome(manager)
    manager.move(window.id, 640, -500)
    expect(manager.list()[0]!.geometry.y).toBeGreaterThanOrEqual(TOP_BAR_HEIGHT)
  })

  it('never lets the title bar sink below the viewport', () => {
    const manager = createManager()
    const window = openWelcome(manager)
    manager.move(window.id, 640, 5000)
    expect(manager.list()[0]!.geometry.y).toBeLessThanOrEqual(viewport.height - TITLE_BAR_HEIGHT)
  })
})

describe('resizing windows', () => {
  it('applies the requested geometry', () => {
    const manager = createManager()
    const window = openWelcome(manager)
    manager.resize(window.id, { x: 100, y: 100, width: 900, height: 700 })
    expect(manager.list()[0]!.geometry).toEqual({ x: 100, y: 100, width: 900, height: 700 })
  })

  it('never resizes below the requested minimum size', () => {
    const manager = createManager()
    const window = manager.open({
      appId: 'welcome',
      title: 'Welcome',
      minSize: { width: 400, height: 300 }
    })
    manager.resize(window.id, { x: 640, y: TOP_BAR_HEIGHT, width: 10, height: 10 })
    expect(manager.list()[0]!.geometry.width).toBe(400)
    expect(manager.list()[0]!.geometry.height).toBe(300)
  })

  it('caps size at the work area', () => {
    const manager = createManager()
    const window = openWelcome(manager)
    manager.resize(window.id, { x: 0, y: TOP_BAR_HEIGHT, width: 5000, height: 5000 })
    const { width, height } = manager.list()[0]!.geometry
    expect(width).toBe(viewport.width)
    expect(height).toBe(viewport.height - TOP_BAR_HEIGHT)
  })
})

describe('viewport changes', () => {
  it('re-clamps windows that fall outside the new viewport', () => {
    const manager = createManager()
    const window = openWelcome(manager)
    const smaller = { width: 1280, height: 800 }
    manager.move(window.id, 1800, 1000)

    manager.setViewport(smaller)

    const { x, y } = manager.list()[0]!.geometry
    expect(x).toBeLessThanOrEqual(smaller.width - MIN_VISIBLE_EDGE)
    expect(y).toBeLessThanOrEqual(smaller.height - TITLE_BAR_HEIGHT)
  })
})

describe('maximizing windows', () => {
  it('fills the work area and remembers the previous geometry', () => {
    const manager = createManager()
    const window = openWelcome(manager)
    manager.maximize(window.id)
    const maximized = manager.list()[0]!
    expect(maximized.isMaximized).toBe(true)
    expect(maximized.geometry).toEqual({
      x: 0,
      y: TOP_BAR_HEIGHT,
      width: viewport.width,
      height: viewport.height - TOP_BAR_HEIGHT
    })
    manager.restore(window.id)
    const restored = manager.list()[0]!
    expect(restored.isMaximized).toBe(false)
    expect(restored.geometry).toEqual(window.geometry)
  })

  it('adapts a maximized window when the viewport changes', () => {
    const manager = createManager()
    const window = openWelcome(manager)
    const smaller = { width: 1280, height: 800 }
    manager.maximize(window.id)

    manager.setViewport(smaller)

    expect(manager.list()[0]!.geometry).toEqual({
      x: 0,
      y: TOP_BAR_HEIGHT,
      width: smaller.width,
      height: smaller.height - TOP_BAR_HEIGHT
    })
  })

  it('maximizing twice still restores the original geometry', () => {
    const manager = createManager()
    const window = openWelcome(manager)
    manager.maximize(window.id)
    manager.maximize(window.id)
    manager.restore(window.id)
    expect(manager.list()[0]!.geometry).toEqual(window.geometry)
  })

  it.each([true, false])('maximizing a minimized window un-minimizes it (maximized first: %s)', (maximizeFirst) => {
    const manager = createManager()
    const window = openWelcome(manager)
    if (maximizeFirst) {
      manager.maximize(window.id)
    }
    manager.minimize(window.id)

    manager.maximize(window.id)

    const maximized = manager.list()[0]!
    expect(maximized.isMinimized).toBe(false)
    expect(maximized.isMaximized).toBe(true)
    expect(maximized.isFocused).toBe(true)
  })
})

describe('minimizing windows', () => {
  it('unfocuses the window and focuses the topmost remaining one', () => {
    const manager = createManager()
    const first = openWelcome(manager)
    const second = manager.open({ appId: 'readme', title: 'Readme' })
    manager.minimize(second.id)
    const windows = manager.list()
    expect(windows.find((w) => w.id === second.id)?.isMinimized).toBe(true)
    expect(windows.find((w) => w.id === second.id)?.isFocused).toBe(false)
    expect(windows.find((w) => w.id === first.id)?.isFocused).toBe(true)
  })

  it('restore un-minimizes and refocuses', () => {
    const manager = createManager()
    openWelcome(manager)
    const second = manager.open({ appId: 'readme', title: 'Readme' })
    manager.minimize(second.id)
    manager.restore(second.id)
    const restored = manager.list().find((w) => w.id === second.id)
    expect(restored?.isMinimized).toBe(false)
    expect(restored?.isFocused).toBe(true)
  })

  it('a minimized maximized window restores as maximized', () => {
    const manager = createManager()
    const window = openWelcome(manager)
    manager.maximize(window.id)
    manager.minimize(window.id)
    manager.restore(window.id)
    const restored = manager.list()[0]!
    expect(restored.isMinimized).toBe(false)
    expect(restored.isMaximized).toBe(true)
  })
})

describe('window params', () => {
  it('defaults to no params', () => {
    const manager = createManager()
    expect(openWelcome(manager).params).toEqual({})
  })

  it('keeps the requested params on the window', () => {
    const manager = createManager()
    const window = manager.open({ appId: 'case-study', title: 'A study', params: { 'study-id': 'alpha' } })
    expect(window.params).toEqual({ 'study-id': 'alpha' })
    expect(manager.list()[0]?.params).toEqual({ 'study-id': 'alpha' })
  })

  it('does not let callers mutate stored params', () => {
    const manager = createManager()
    const params = { 'study-id': 'alpha' }
    manager.open({ appId: 'case-study', title: 'A study', params })
    params['study-id'] = 'tampered'
    expect(manager.list()[0]?.params).toEqual({ 'study-id': 'alpha' })
  })
})
