import type { Point } from './context-menu-model'

export const LONG_PRESS_DURATION_MS = 500
export const LONG_PRESS_MOVE_TOLERANCE_PX = 10

export const isWithinTolerance = (origin: Point, point: Point): boolean =>
  Math.hypot(point.x - origin.x, point.y - origin.y) <= LONG_PRESS_MOVE_TOLERANCE_PX

export const observeLongPress = (element: HTMLElement, onLongPress: (point: Point) => void): (() => void) => {
  let origin: Point | undefined
  let timer: ReturnType<typeof setTimeout> | undefined

  const cancel = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
    origin = undefined
  }

  const onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch') {
      return
    }
    cancel()
    const pressed: Point = { x: event.clientX, y: event.clientY }
    origin = pressed
    timer = setTimeout(() => {
      cancel()
      onLongPress(pressed)
    }, LONG_PRESS_DURATION_MS)
  }

  const onPointerMove = (event: PointerEvent): void => {
    if (origin && !isWithinTolerance(origin, { x: event.clientX, y: event.clientY })) {
      cancel()
    }
  }

  element.addEventListener('pointerdown', onPointerDown)
  element.addEventListener('pointermove', onPointerMove)
  element.addEventListener('pointerup', cancel)
  element.addEventListener('pointercancel', cancel)

  return () => {
    cancel()
    element.removeEventListener('pointerdown', onPointerDown)
    element.removeEventListener('pointermove', onPointerMove)
    element.removeEventListener('pointerup', cancel)
    element.removeEventListener('pointercancel', cancel)
  }
}
