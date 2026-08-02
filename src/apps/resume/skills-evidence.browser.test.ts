import { afterEach, expect, it } from 'vitest'
import type { CareerStage, Skill } from './resume-model'
import { renderSkillsEvidence } from './skills-evidence'

const stages: CareerStage[] = [
  {
    id: 'tech-lead',
    title: 'Tech Lead',
    period: { start: '2018-06', end: '2022-01' },
    orgShape: 'Delivery team',
    stack: [],
    summary: '',
    narrative: ''
  },
  {
    id: 'security-lead',
    title: 'Engineering Lead',
    period: { start: '2026-03' },
    orgShape: 'Security team',
    stack: [],
    summary: '',
    narrative: ''
  }
]

const skills: Skill[] = [
  { name: 'Technical Leadership', category: 'Leadership', evidence: ['tech-lead', 'security-lead'] },
  { name: 'Threat Modelling', category: 'Security', evidence: ['security-lead'], isPlaceholder: true }
]

const mount = () => {
  const host = document.createElement('div')
  host.append(renderSkillsEvidence(skills, stages))
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
  const firstGroup = groups[0]!
  expect(firstGroup.querySelector('.skill')).not.toBeNull()
  expect(firstGroup.querySelector('.skill-name')).toHaveTextContent('Technical Leadership')
})

it('renders no rating or score for any skill', () => {
  const host = mount()
  expect(host.querySelector('meter')).toBeNull()
  expect(host.querySelector('progress')).toBeNull()
  expect(host.textContent).not.toContain('★')
})

it('renders an evidence chip per cited stage, labelled with the stage title', () => {
  const host = mount()
  const chips = host.querySelectorAll<HTMLButtonElement>(
    '.skill-group:first-of-type .skill:first-of-type .evidence-chip'
  )
  expect([...chips].map((chip) => chip.textContent)).toEqual(['Tech Lead', 'Engineering Lead'])
  expect([...chips].map((chip) => chip.dataset.stageId)).toEqual(['tech-lead', 'security-lead'])
})

it('makes evidence chips activatable controls', () => {
  const host = mount()
  const chip = host.querySelector('.evidence-chip')!
  expect(chip.tagName).toBe('BUTTON')
})

it('marks placeholder skills as draft', () => {
  const host = mount()
  const skillEntries = host.querySelectorAll('.skill')
  expect(skillEntries[0]?.querySelector('.draft')).toBeNull()
  expect(skillEntries[1]?.querySelector('.draft')).not.toBeNull()
})
