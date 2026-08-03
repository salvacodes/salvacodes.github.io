import {
  WRITING_NAVIGATE_EVENT,
  WRITING_SELECTED_EVENT,
  type WritingSelectedDetail
} from '../apps/writings/writing-events'
import type { WindowManager } from '../windowing/window-manager'
import { desktopPath, isWritingPath, POST_SLUG_PARAM, pathForPost, routeFromPath, WRITINGS_APP_ID } from './post-route'

export interface LocationSyncOptions {
  manager: WindowManager
  activate: (appId: string, params: Record<string, string>) => void
}

export const startLocationSync = ({ manager, activate }: LocationSyncOptions): (() => void) => {
  const goTo = (path: string): void => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
    }
  }

  const hasWritingsWindow = (): boolean => manager.list().some((window) => window.appId === WRITINGS_APP_ID)

  const onSelected = (event: Event): void => {
    goTo(pathForPost((event as CustomEvent<WritingSelectedDetail>).detail.slug))
  }

  const onPopState = (): void => {
    const route = routeFromPath(window.location.pathname)
    if (hasWritingsWindow()) {
      const detail: WritingSelectedDetail = { slug: route?.params[POST_SLUG_PARAM] }
      window.dispatchEvent(new CustomEvent<WritingSelectedDetail>(WRITING_NAVIGATE_EVENT, { detail }))
      return
    }
    if (route) {
      activate(route.appId, route.params)
    }
  }

  const unsubscribe = manager.subscribe(() => {
    if (!hasWritingsWindow() && isWritingPath(window.location.pathname)) {
      goTo(desktopPath)
    }
  })

  window.addEventListener(WRITING_SELECTED_EVENT, onSelected)
  window.addEventListener('popstate', onPopState)

  const opening = routeFromPath(window.location.pathname)
  if (opening) {
    activate(opening.appId, opening.params)
  }

  return () => {
    unsubscribe()
    window.removeEventListener(WRITING_SELECTED_EVENT, onSelected)
    window.removeEventListener('popstate', onPopState)
  }
}
