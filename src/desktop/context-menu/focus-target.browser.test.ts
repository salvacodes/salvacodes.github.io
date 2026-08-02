import { afterEach, expect, it } from 'vitest'
import { deepActiveElement } from './focus-target'

afterEach(() => {
  for (const element of document.querySelectorAll('[data-fixture]')) {
    element.remove()
  }
})

it('returns the focused element when it is in the document', () => {
  const button = document.createElement('button')
  button.dataset.fixture = 'plain'
  document.body.append(button)
  button.focus()
  expect(deepActiveElement()).toBe(button)
})

it('descends into shadow roots to find the truly focused element', () => {
  const host = document.createElement('div')
  host.dataset.fixture = 'host'
  document.body.append(host)
  const root = host.attachShadow({ mode: 'open' })
  const button = document.createElement('button')
  root.append(button)
  button.focus()
  expect(deepActiveElement()).toBe(button)
})
