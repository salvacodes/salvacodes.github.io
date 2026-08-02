import { afterEach, expect, it, vi } from 'vitest'
import { printFragment } from './print-surface'

const fragmentWith = (text: string) => {
  const fragment = document.createDocumentFragment()
  const paragraph = document.createElement('p')
  paragraph.textContent = text
  fragment.append(paragraph)
  return fragment
}

afterEach(() => {
  document.getElementById('print-surface')?.remove()
  delete document.documentElement.dataset.printing
  vi.restoreAllMocks()
})

it('attaches the fragment to the document and asks the browser to print', () => {
  const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined)
  printFragment(fragmentWith('printable'))
  const surface = document.getElementById('print-surface')
  expect(surface?.textContent).toBe('printable')
  expect(document.documentElement.dataset.printing).toBe('true')
  expect(printSpy).toHaveBeenCalledOnce()
})

it('tears the surface down once printing finishes', () => {
  vi.spyOn(window, 'print').mockImplementation(() => undefined)
  printFragment(fragmentWith('printable'))
  window.dispatchEvent(new Event('afterprint'))
  expect(document.getElementById('print-surface')).toBeNull()
  expect(document.documentElement.dataset.printing).toBeUndefined()
})

it('replaces a previous surface rather than stacking them', () => {
  vi.spyOn(window, 'print').mockImplementation(() => undefined)
  printFragment(fragmentWith('first'))
  printFragment(fragmentWith('second'))
  expect(document.querySelectorAll('#print-surface')).toHaveLength(1)
  expect(document.getElementById('print-surface')?.textContent).toBe('second')
})
