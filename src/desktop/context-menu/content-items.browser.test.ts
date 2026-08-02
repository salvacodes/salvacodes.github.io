import { expect, it } from 'vitest'
import { standardContentItems } from './content-items'

const ids = (entries: ReturnType<typeof standardContentItems>): string[] =>
  entries.filter((entry) => 'id' in entry).map((entry) => ('id' in entry ? entry.id : ''))

const disabledIds = (entries: ReturnType<typeof standardContentItems>): string[] =>
  entries.filter((entry) => 'disabled' in entry && entry.disabled).map((entry) => ('id' in entry ? entry.id : ''))

it('always offers copy and paste', () => {
  expect(ids(standardContentItems(null, ''))).toEqual(['copy', 'paste'])
})

it('disables copy without a selection and paste always', () => {
  expect(disabledIds(standardContentItems(null, ''))).toEqual(['copy', 'paste'])
})

it('enables copy when there is a selection', () => {
  expect(disabledIds(standardContentItems(null, 'some text'))).toEqual(['paste'])
})

it('adds the link actions when the target is an anchor', () => {
  const anchor = document.createElement('a')
  anchor.href = 'https://example.test/repo'
  expect(ids(standardContentItems(anchor, ''))).toEqual(['copy', 'open-link', 'copy-link', 'paste'])
})

it('offers the link actions for a mailto address', () => {
  const anchor = document.createElement('a')
  anchor.href = 'mailto:dev@example.test'
  expect(ids(standardContentItems(anchor, ''))).toEqual(['copy', 'open-link', 'copy-link', 'paste'])
})

it('offers no link actions for a javascript href', () => {
  const anchor = document.createElement('a')
  anchor.setAttribute('href', 'javascript:alert(1)')
  expect(ids(standardContentItems(anchor, ''))).toEqual(['copy', 'paste'])
})

it('offers no link actions for an unparseable href', () => {
  const anchor = document.createElement('a')
  anchor.setAttribute('href', 'http://[')
  expect(ids(standardContentItems(anchor, ''))).toEqual(['copy', 'paste'])
})

it('finds the anchor when the target is inside one', () => {
  const anchor = document.createElement('a')
  anchor.href = 'https://example.test/repo'
  const label = document.createElement('span')
  anchor.append(label)
  expect(ids(standardContentItems(label, ''))).toContain('open-link')
})

it('does not treat an SVG anchor as a linkable HTML anchor', () => {
  const svgAnchor = document.createElementNS('http://www.w3.org/2000/svg', 'a')
  svgAnchor.setAttribute('href', 'https://example.test/repo')
  expect(ids(standardContentItems(svgAnchor, ''))).toEqual(['copy', 'paste'])
})
