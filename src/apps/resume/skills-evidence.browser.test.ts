import { afterEach, expect, it } from 'vitest'
import type { Skill, Tenure } from './resume-model'
import { renderSkillsEvidence } from './skills-evidence'

const tenures: Tenure[] = [
  {
    id: 'consultancy',
    org: 'Consultancy',
    orgShape: 'Global technology consultancy',
    period: { start: '2018-06' },
    occupations: [
      {
        id: 'tech-lead-first',
        title: 'Tech Lead',
        period: { start: '2018-06', end: '2022-01' },
        summary: 'Led a team.',
        stack: []
      },
      {
        id: 'tech-lead-second',
        title: 'Tech Lead',
        period: { start: '2022-12', end: '2024-04' },
        summary: 'Led another team.',
        stack: []
      },
      {
        id: 'security-lead',
        title: 'Engineering Lead',
        period: { start: '2025-10' },
        summary: 'Leads security engineering.',
        stack: []
      }
    ]
  }
]

const skills: Skill[] = [
  {
    name: 'Technical Leadership',
    category: 'Leadership',
    evidence: ['tech-lead-first', 'tech-lead-second', 'security-lead']
  },
  { name: 'Threat Modelling', category: 'Security', evidence: ['security-lead'], isPlaceholder: true }
]

const mount = () => {
  const host = document.createElement('div')
  host.append(renderSkillsEvidence(skills, tenures))
  document.body.append(host)
  return host
}

afterEach(() => {
  document.body.replaceChildren()
})

it('groups skills under their category', () => {
  const host = mount()
  const groups = host.querySelectorAll('.skill-group')
  expect([...groups].map((group) => group.querySelector('.skill-group-name')?.textContent)).toEqual([
    'Leadership',
    'Security'
  ])
  expect(groups[0]?.querySelector('.skill-name')).toHaveTextContent('Technical Leadership')
})

it('renders no rating or score for any skill', () => {
  const host = mount()
  expect(host.querySelector('meter')).toBeNull()
  expect(host.querySelector('progress')).toBeNull()
  expect(host.textContent).not.toContain('★')
})

it('renders one chip per cited occupation, citing the occupation id', () => {
  const host = mount()
  const chips = host.querySelectorAll<HTMLButtonElement>(
    '.skill-group:first-of-type .skill:first-of-type .evidence-chip'
  )
  expect([...chips].map((chip) => chip.dataset.occupationId)).toEqual([
    'tech-lead-first',
    'tech-lead-second',
    'security-lead'
  ])
})

it('distinguishes two occupations that share a title by their period', () => {
  const host = mount()
  const chips = host.querySelectorAll('.skill-group:first-of-type .skill:first-of-type .evidence-chip')
  const labels = [...chips].map((chip) => chip.textContent)
  expect(new Set(labels).size).toBe(labels.length)
  expect(labels[0]).toContain('Tech Lead')
  expect(labels[0]).toContain('Jun 2018')
})

it('drops a chip whose occupation no longer exists', () => {
  const host = document.createElement('div')
  host.append(renderSkillsEvidence([{ name: 'Ghost', category: 'Other', evidence: ['retired'] }], tenures))
  document.body.append(host)
  expect(host.querySelectorAll('.evidence-chip')).toHaveLength(0)
})

it('makes evidence chips activatable controls', () => {
  const host = mount()
  expect(host.querySelector('.evidence-chip')?.tagName).toBe('BUTTON')
})

it('marks placeholder skills as draft', () => {
  const host = mount()
  const skillEntries = host.querySelectorAll('.skill')
  expect(skillEntries[0]?.querySelector('.draft')).toBeNull()
  expect(skillEntries[1]?.querySelector('.draft')).not.toBeNull()
})
