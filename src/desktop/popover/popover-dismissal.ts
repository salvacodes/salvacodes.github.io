export interface PopoverDismissalOptions {
  element: HTMLElement
  onDismiss: () => void
}

export const observePopoverDismissal = ({ element, onDismiss }: PopoverDismissalOptions): (() => void) => {
  const onOutsidePointer = (event: Event): void => {
    if (event.composedPath().includes(element)) {
      return
    }
    onDismiss()
  }
  const onWindowChange = (): void => onDismiss()
  window.addEventListener('pointerdown', onOutsidePointer, true)
  window.addEventListener('resize', onWindowChange)
  window.addEventListener('blur', onWindowChange)
  return () => {
    window.removeEventListener('pointerdown', onOutsidePointer, true)
    window.removeEventListener('resize', onWindowChange)
    window.removeEventListener('blur', onWindowChange)
  }
}
