import { afterEach, beforeEach, expect, it } from 'vitest'
import { WRITING_NAVIGATE_EVENT, WRITING_SELECTED_EVENT } from '../apps/writings/writing-events'
import { WindowManager } from '../windowing/window-manager'
import { startLocationSync } from './location-sync'
import { WRITINGS_APP_ID } from './post-route'

let manager = new WindowManager({ width: 1024, height: 768 })
let activations: Array<{ appId: string; params: Record<string, string> }> = []
let stop = (): void => {}

const start = (): void => {
  stop = startLocationSync({
    manager,
    activate: (appId, params) => {
      activations.push({ appId, params })
    }
  })
}

const goTo = (path: string): void => {
  window.history.pushState({}, '', path)
}

const announce = (slug?: string): void => {
  window.dispatchEvent(new CustomEvent(WRITING_SELECTED_EVENT, { detail: { slug } }))
}

beforeEach(() => {
  manager = new WindowManager({ width: 1024, height: 768 })
  activations = []
  goTo('/')
})

afterEach(() => {
  stop()
  goTo('/')
})

it('opens the app when the address points at a post', () => {
  goTo('/writing/a-post/')

  start()

  expect(activations).toEqual([{ appId: WRITINGS_APP_ID, params: { 'post-slug': 'a-post' } }])
})

it('opens nothing when the address is the desktop itself', () => {
  start()

  expect(activations).toEqual([])
})

it('follows the post the app opened', () => {
  start()

  announce('a-post')

  expect(window.location.pathname).toBe('/writing/a-post/')
})

it('returns to the archive when the app closes a post', () => {
  start()

  announce('a-post')
  announce(undefined)

  expect(window.location.pathname).toBe('/writing/')
})

it('leaves the address alone when the app reopens what is already showing', () => {
  start()
  announce('a-post')
  const before = window.history.length

  announce('a-post')

  expect(window.history.length).toBe(before)
})

it('asks an open window to follow the reader going back', () => {
  const followed: Array<string | undefined> = []
  window.addEventListener(WRITING_NAVIGATE_EVENT, (event) => {
    followed.push((event as CustomEvent<{ slug?: string }>).detail.slug)
  })
  manager.open({ appId: WRITINGS_APP_ID, title: 'Writings' })
  start()

  goTo('/writing/another-post/')
  window.dispatchEvent(new PopStateEvent('popstate'))

  expect(followed).toEqual(['another-post'])
  expect(activations).toEqual([])
})

it('opens the app when the reader goes back to a post and no window is open', () => {
  start()

  goTo('/writing/a-post/')
  window.dispatchEvent(new PopStateEvent('popstate'))

  expect(activations).toEqual([{ appId: WRITINGS_APP_ID, params: { 'post-slug': 'a-post' } }])
})

it('returns the address to the desktop when the last writings window closes', () => {
  const opened = manager.open({ appId: WRITINGS_APP_ID, title: 'Writings' })
  start()
  announce('a-post')

  manager.close(opened.id)

  expect(window.location.pathname).toBe('/')
})

it('leaves the address alone when another app closes', () => {
  manager.open({ appId: WRITINGS_APP_ID, title: 'Writings' })
  const terminal = manager.open({ appId: 'terminal', title: 'Terminal' })
  start()
  announce('a-post')

  manager.close(terminal.id)

  expect(window.location.pathname).toBe('/writing/a-post/')
})

it('stops following once it is stopped', () => {
  start()
  stop()

  announce('a-post')

  expect(window.location.pathname).toBe('/')
})

it('does not fight a reader who navigated away from writing', () => {
  start()
  goTo('/')

  manager.open({ appId: 'terminal', title: 'Terminal' })

  expect(window.location.pathname).toBe('/')
})
