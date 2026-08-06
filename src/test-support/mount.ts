import { afterEach } from 'vitest'

const mounted: Element[] = []

export const mount = <T extends HTMLElement>(tag: string, properties: Partial<T> = {}): T => {
  const element = Object.assign(document.createElement(tag), properties) as T
  document.body.append(element)
  mounted.push(element)
  return element
}

afterEach(() => {
  while (mounted.length > 0) {
    mounted.pop()?.remove()
  }
})
