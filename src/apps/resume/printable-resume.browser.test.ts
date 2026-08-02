import { afterEach, expect, it } from 'vitest'
import { renderPrintableResume } from './printable-resume'
import type { ResumeContent } from './resume-model'

const content: ResumeContent = {
  stages: [
    {
      id: 'written-stage',
      title: 'Backend Developer',
      period: { start: '2013-09', end: '2016-03' },
      orgShape: 'Product team',
      stack: ['Java'],
      summary: 'Built services.',
      narrative: 'The long version nobody prints.'
    },
    {
      id: 'draft-stage',
      title: 'Draft Role',
      period: { start: '2026-03' },
      orgShape: 'Somewhere',
      stack: ['TBD'],
      summary: 'Lorem ipsum.',
      narrative: 'Lorem ipsum.',
      isPlaceholder: true
    }
  ],
  skills: [
    { name: 'Leadership', category: 'Leadership', evidence: ['written-stage'] },
    { name: 'Draft Skill', category: 'Security', evidence: ['written-stage'], isPlaceholder: true }
  ],
  caseStudies: [
    {
      id: 'study',
      title: 'A study',
      sector: 'Sector',
      scale: 'Scale',
      constraint: 'Constraint',
      decisions: [],
      outcome: '',
      redactions: ['Client identity']
    }
  ],
  site: { posture: [], repoUrl: 'https://example.test' }
}

const mount = () => {
  const host = document.createElement('div')
  host.append(renderPrintableResume(content))
  document.body.append(host)
  return host
}

afterEach(() => {
  document.body.replaceChildren()
})

it('prints written career stages at summary level', () => {
  const host = mount()
  const entries = host.querySelectorAll('.print-stage')
  expect(entries).toHaveLength(1)
  expect(entries[0]?.textContent).toContain('Backend Developer')
  expect(entries[0]?.textContent).toContain('Sep 2013 — Mar 2016')
  expect(entries[0]?.textContent).toContain('Product team')
  expect(entries[0]?.textContent).toContain('Built services.')
})

it('never prints placeholder content', () => {
  const host = mount()
  expect(host.textContent).not.toContain('Lorem ipsum')
  expect(host.textContent).not.toContain('Draft Role')
  expect(host.textContent).not.toContain('Draft Skill')
})

it('omits the long narratives', () => {
  const host = mount()
  expect(host.textContent).not.toContain('The long version nobody prints.')
})

it('omits case studies entirely', () => {
  const host = mount()
  expect(host.textContent).not.toContain('A study')
})

it('groups printed skills by category', () => {
  const host = mount()
  const groups = host.querySelectorAll('.print-skill-group')
  expect(groups).toHaveLength(1)
  expect(groups[0]?.textContent).toContain('Leadership')
})

it('carries the site url so the pdf points back at the real thing', () => {
  const host = mount()
  expect(host.querySelector('.print-footer')?.textContent).toContain('salva.codes')
})
