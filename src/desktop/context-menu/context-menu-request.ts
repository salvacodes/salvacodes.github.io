import type { MenuEntry, Point } from './context-menu-model'

export const CONTEXT_MENU_EVENT = 'context-menu-request'

export interface ContextMenuDetail {
  entries: MenuEntry[]
  anchor: Point
}

export const requestContextMenu = (source: EventTarget, detail: ContextMenuDetail): void => {
  source.dispatchEvent(
    new CustomEvent<ContextMenuDetail>(CONTEXT_MENU_EVENT, { bubbles: true, composed: true, detail })
  )
}
