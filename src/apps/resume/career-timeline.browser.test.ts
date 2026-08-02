import { afterEach, expect, it } from 'vitest'
import { renderCareerTimeline } from './career-timeline'
import type { CareerStage } from './resume-model'

const stages: CareerStage[] = [
  {
    id: 'first-stage',
    title: 'Backend Developer',
    period: { start: '2013-09', end: '2016-03' },
    orgShape: 'Product team',
    stack: ['Java', 'SQL'],
    summary: 'Built services.',
    narrative: 'The long version.'
  },
  {
    id: 'second-stage',
    title: 'Engineering Lead',
    period: { start: '2026-03' },
    orgShape: 'Security team',
    stack: ['Leadership'],
    summary: 'Leading.',
    narrative: 'Still writing this.',
    isPlaceholder: true
  }
]

const mount = (input: CareerStage[] = stages) => {
  const host = document.createElement('div')
  host.append(renderCareerTimeline(input))
  document.body.append(host)
  return host
}

afterEach(() => {
  document.body.replaceChildren()
})

it('renders one collapsed entry per stage, in order', () => {
  const host = mount()
  const entries = host.querySelectorAll<HTMLDetailsElement>('details.stage')
  expect([...entries].map((entry) => entry.dataset.stageId)).toEqual(['first-stage', 'second-stage'])
  expect([...entries].every((entry) => entry.open)).toBe(false)
})

it('shows title, period and org shape without expanding', () => {
  const host = mount()
  const summary = host.querySelector('details.stage summary')!
  expect(summary.querySelector('.stage-title')?.textContent).toBe('Backend Developer')
  expect(summary.querySelector('.stage-period')?.textContent).toBe('Sep 2013 — Mar 2016')
  expect(summary.querySelector('.stage-org')?.textContent).toBe('Product team')
})

it('keeps the narrative in the disclosure body', () => {
  const host = mount()
  const entry = host.querySelector('details.stage')!
  expect(entry.querySelector('summary')?.textContent).not.toContain('The long version.')
  expect(entry.querySelector('.stage-narrative')?.textContent).toBe('The long version.')
})

it('renders one chip per stack entry', () => {
  const host = mount()
  const entries = host.querySelectorAll('details.stage')
  expect([...entries[0]!.querySelectorAll('.stack-chip')].map((chip) => chip.textContent)).toEqual(['Java', 'SQL'])
  expect(entries[1]!.querySelectorAll('.stack-chip')).toHaveLength(1)
})

it('marks placeholder stages as draft and leaves written ones unmarked', () => {
  const host = mount()
  const entries = host.querySelectorAll('details.stage')
  expect(entries[0]?.querySelector('.draft')).toBeNull()
  expect(entries[1]?.querySelector('.draft')).not.toBeNull()
})

it('renders content as text, never as markup', () => {
  const host = mount([{ ...stages[0]!, narrative: '<img src=x onerror=alert(1)>' }])
  expect(host.querySelector('img')).toBeNull()
})
