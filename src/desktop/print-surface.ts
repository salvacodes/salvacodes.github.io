const SURFACE_ID = 'print-surface'

export const PRINT_DOCUMENT_EVENT = 'print-document'

export interface PrintDocumentDetail {
  fragment: DocumentFragment
}

export const printFragment = (fragment: DocumentFragment): void => {
  document.getElementById(SURFACE_ID)?.remove()
  const surface = document.createElement('div')
  surface.id = SURFACE_ID
  surface.append(fragment)
  document.body.append(surface)
  document.documentElement.dataset.printing = 'true'
  const cleanup = (): void => {
    surface.remove()
    delete document.documentElement.dataset.printing
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.print()
}
