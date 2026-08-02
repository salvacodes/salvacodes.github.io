import { afterEach, expect, it } from 'vitest'
import { renderCaseStudyList } from './case-study-list'
import type { CaseStudy } from './resume-model'

const caseStudies: CaseStudy[] = [
  {
    id: 'regulated-platform',
    title: 'Hardening a regulated delivery platform',
    sector: 'Regulated enterprise',
    scale: '30-person delivery org',
    constraint: 'External audit',
    decisions: ['Chose X.'],
    outcome: 'It worked.',
    redactions: ['Client identity']
  },
  {
    id: 'second-study',
    title: 'Second study',
    sector: 'Retail',
    scale: 'Small team',
    constraint: 'Tight deadline',
    decisions: [],
    outcome: '',
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

it('renders an opener button per case study', () => {
  const host = mount()
  const openers = host.querySelectorAll<HTMLButtonElement>('button.case-study-opener')
  expect([...openers].map((opener) => opener.dataset.studyId)).toEqual(['regulated-platform', 'second-study'])
})

it('shows sector and scale so the list is scannable without opening one', () => {
  const host = mount()
  const opener = host.querySelector('button.case-study-opener')!
  expect(opener.textContent).toContain('Hardening a regulated delivery platform')
  expect(opener.textContent).toContain('Regulated enterprise')
  expect(opener.textContent).toContain('30-person delivery org')
})

it('marks placeholder studies as draft', () => {
  const host = mount()
  const openers = host.querySelectorAll('button.case-study-opener')
  expect(openers[0]?.querySelector('.draft')).toBeNull()
  expect(openers[1]?.querySelector('.draft')).not.toBeNull()
})
