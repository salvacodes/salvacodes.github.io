import { afterEach, expect, it } from 'vitest'
import { renderCaseStudyList } from './case-study-list'
import type { CaseStudy } from './resume-model'

const caseStudies: CaseStudy[] = [
  {
    id: 'written-study',
    title: 'Adopting a control the team experienced as friction',
    problem: 'A safeguard everybody agreed with, and nobody used.',
    constraint: 'No authority to mandate it.',
    decisions: ['Made the safe path the fast path.'],
    outcome: 'Adoption without a mandate.',
    reflection: 'I would have measured the friction before arguing about it.',
    evidence: ['security-lead'],
    redactions: ['The control itself']
  },
  {
    id: 'draft-study',
    title: 'Still being written',
    problem: 'To be written.',
    constraint: 'To be written.',
    decisions: [],
    outcome: 'To be written.',
    reflection: 'To be written.',
    evidence: ['security-lead'],
    redactions: ['Client identity'],
    isPlaceholder: true
  }
]

const mount = () => {
  const host = document.createElement('div')
  host.append(renderCaseStudyList(caseStudies))
  document.body.append(host)
  return host
}

afterEach(() => {
  document.body.replaceChildren()
})

it('renders one opener per case study, in order', () => {
  const host = mount()
  const openers = host.querySelectorAll<HTMLButtonElement>('.case-study-opener')
  expect([...openers].map((opener) => opener.dataset.studyId)).toEqual(['written-study', 'draft-study'])
})

it('shows the title and the problem on the opener', () => {
  const host = mount()
  const opener = host.querySelector('.case-study-opener')!
  expect(opener.querySelector('.case-study-title')?.textContent).toBe(
    'Adopting a control the team experienced as friction'
  )
  expect(opener.querySelector('.case-study-problem')?.textContent).toBe(
    'A safeguard everybody agreed with, and nobody used.'
  )
})

it('marks placeholder studies as draft', () => {
  const host = mount()
  const openers = host.querySelectorAll('.case-study-opener')
  expect(openers[0]?.querySelector('.draft')).toBeNull()
  expect(openers[1]?.querySelector('.draft')).not.toBeNull()
})
