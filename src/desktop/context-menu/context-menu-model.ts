import { type Size, TOP_BAR_HEIGHT } from '../../windowing/window-manager'

export interface Point {
  x: number
  y: number
}

export interface MenuAction {
  id: string
  label: string
  disabled?: boolean
  perform?: () => void
}

export interface MenuSeparator {
  separator: true
}

export type MenuEntry = MenuAction | MenuSeparator

export const isSeparator = (entry: MenuEntry): entry is MenuSeparator => 'separator' in entry

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max)

export const placeMenu = (anchor: Point, menu: Size, viewport: Size): Point => {
  const preferredX = anchor.x + menu.width <= viewport.width ? anchor.x : anchor.x - menu.width
  const preferredY = anchor.y + menu.height <= viewport.height ? anchor.y : anchor.y - menu.height
  return {
    x: clamp(preferredX, 0, Math.max(0, viewport.width - menu.width)),
    y: clamp(preferredY, TOP_BAR_HEIGHT, Math.max(TOP_BAR_HEIGHT, viewport.height - menu.height))
  }
}
