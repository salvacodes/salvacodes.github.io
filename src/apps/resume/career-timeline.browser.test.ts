import { afterEach, expect, it } from 'vitest'
import { renderCareerTimeline } from './career-timeline'
import type { CareerGap, Tenure } from './resume-model'

const tenures: Tenure[] = [
  {
    id: 'early-org',
    org: 'Early Org',
    orgShape: 'Research institute',
    period: { start: '2009-08', end: '2011-03' },
    occupations: [
      {
        id: 'analyst',
        title: 'Analyst',
        period: { start: '2009-08', end: '2011-03' },
        summary: 'Gathered requirements.',
        stack: []
      }
    ]
  },
  {
    id: 'consultancy',
    org: 'Consultancy',
    orgShape: 'Global technology consultancy',
    period: { start: '2017-08' },
    grades: [
      { title: 'Senior', period: { start: '2017-08', end: '2020-10' } },
      { title: 'Principal', period: { start: '2020-10' } }
    ],
    occupations: [
      {
        id: 'engineer',
        title: 'Engineer',
        period: { start: '2017-08', end: '2018-10' },
        summary: 'Delivered features.',
        stack: ['Java', 'SQL']
      },
      {
        id: 'security-lead',
        title: 'Security Lead',
        period: { start: '2018-10' },
        summary: 'Leads the team.',
        narrative: 'The long version.',
        stack: []
      }
    ]
  }
]

const gaps: CareerGap[] = [{ period: { start: '2011-03', end: '2017-08' }, note: 'Finished my degree.' }]

const mount = (inputTenures: Tenure[] = tenures, inputGaps: CareerGap[] = gaps) => {
  const host = document.createElement('div')
  host.append(renderCareerTimeline(inputTenures, inputGaps))
  document.body.append(host)
  return host
}

afterEach(() => {
  document.body.replaceChildren()
})

it('renders one section per tenure, most recent first', () => {
  const host = mount()
  const sections = host.querySelectorAll<HTMLElement>('section.tenure')
  expect([...sections].map((section) => section.dataset.tenureId)).toEqual(['consultancy', 'early-org'])
})

it('shows the employer, its period and its shape', () => {
  const host = mount()
  const tenure = host.querySelector('section.tenure')!
  expect(tenure.querySelector('.tenure-org')?.textContent).toBe('Consultancy')
  expect(tenure.querySelector('.tenure-period')?.textContent).toBe('Aug 2017 — Present')
  expect(tenure.querySelector('.tenure-org-shape')?.textContent).toBe('Global technology consultancy')
})

it('renders the grade track only for a tenure that has grades', () => {
  const host = mount()
  const sections = host.querySelectorAll('section.tenure')
  expect(sections[1]?.querySelector('.grade-track')).toBeNull()
  const grades = sections[0]!.querySelectorAll('.grade')
  expect([...grades].map((grade) => grade.querySelector('.grade-title')?.textContent)).toEqual(['Senior', 'Principal'])
  expect(grades[1]?.querySelector('.grade-period')?.textContent).toBe('Oct 2020 — Present')
})

it('nests occupations inside their tenure, collapsed, most recent first', () => {
  const host = mount()
  const occupations = host.querySelectorAll<HTMLDetailsElement>('section.tenure:first-of-type details.occupation')
  expect([...occupations].map((entry) => entry.dataset.occupationId)).toEqual(['security-lead', 'engineer'])
  expect([...occupations].every((entry) => entry.open)).toBe(false)
})

it('shows the occupation title and period without expanding', () => {
  const host = mount()
  const summary = host.querySelector('details.occupation summary')!
  expect(summary.querySelector('.occupation-title')?.textContent).toBe('Security Lead')
  expect(summary.querySelector('.occupation-period')?.textContent).toBe('Oct 2018 — Present')
})

it('keeps the narrative in the disclosure body, and omits it when unwritten', () => {
  const host = mount()
  const occupations = host.querySelectorAll('details.occupation')
  const narrated = occupations[0]!
  expect(narrated.querySelector('summary')?.textContent).not.toContain('The long version.')
  expect(narrated.querySelector('.occupation-narrative')?.textContent).toBe('The long version.')
  expect(occupations[2]?.querySelector('.occupation-narrative')).toBeNull()
})

it('always shows the summary, narrative or not', () => {
  const host = mount()
  const occupations = host.querySelectorAll('details.occupation')
  expect(occupations[2]?.querySelector('.occupation-summary')?.textContent).toBe('Gathered requirements.')
  expect(occupations[0]?.querySelector('.occupation-summary')?.textContent).toBe('Leads the team.')
})

it('renders one chip per stack entry, and none when the stack is unknown', () => {
  const host = mount()
  const occupations = host.querySelectorAll('details.occupation')
  expect([...occupations[1]!.querySelectorAll('.stack-chip')].map((chip) => chip.textContent)).toEqual(['Java', 'SQL'])
  expect(occupations[2]?.querySelectorAll('.stack-chip')).toHaveLength(0)
})

it('places a gap note between the tenures it separates', () => {
  const host = mount()
  const entries = [...host.children].map((child) => child.className)
  expect(entries).toEqual(['tenure', 'career-gap', 'tenure'])
  expect(host.querySelector('.career-gap')?.textContent).toContain('Finished my degree.')
})

it('renders nothing extra when there are no gaps', () => {
  const host = mount(tenures, [])
  expect(host.querySelector('.career-gap')).toBeNull()
})

it('marks a placeholder tenure as draft in its header, and leaves a written tenure unmarked', () => {
  const host = mount([{ ...tenures[0]!, isPlaceholder: true }, tenures[1]!], [])
  const sections = host.querySelectorAll('section.tenure')
  expect(sections[1]?.querySelector('.draft')).not.toBeNull()
  expect(sections[0]?.querySelector('.draft')).toBeNull()
})

it('renders content as text, never as markup', () => {
  const host = mount(
    [
      {
        ...tenures[0]!,
        occupations: [{ ...tenures[0]!.occupations[0]!, narrative: '<img src=x onerror=alert(1)>' }]
      }
    ],
    []
  )
  expect(host.querySelector('img')).toBeNull()
})
