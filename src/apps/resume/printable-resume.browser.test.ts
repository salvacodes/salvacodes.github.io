import { afterEach, expect, it } from 'vitest'
import { renderPrintableResume } from './printable-resume'
import type { ResumeContent } from './resume-model'

const content: ResumeContent = {
  profile: {
    name: 'Salvador Juan Martínez',
    headline: 'Head of Cyber Defense Engineering',
    summary: 'Fifteen years building software, now pointed at security.',
    location: 'Spain',
    email: 'hi@example.test',
    links: [{ label: 'LinkedIn', url: 'https://example.test/in/someone' }]
  },
  tenures: [
    {
      id: 'product-company',
      org: 'Product Company',
      orgShape: 'Product team',
      period: { start: '2013-09', end: '2016-03' },
      occupations: [
        {
          id: 'written-occupation',
          title: 'Backend Developer',
          period: { start: '2013-09', end: '2016-03' },
          summary: 'Built services.',
          narrative: 'The long version nobody prints.',
          stack: ['Java']
        }
      ]
    },
    {
      id: 'consultancy',
      org: 'Consultancy',
      orgShape: 'Global technology consultancy',
      period: { start: '2017-08' },
      grades: [
        { title: 'Senior', period: { start: '2017-08', end: '2025-05' } },
        { title: 'Principal', period: { start: '2025-05' } }
      ],
      occupations: [
        {
          id: 'written-consultancy-occupation',
          title: 'Security Lead',
          period: { start: '2017-08', end: '2025-05' },
          summary: 'Led the security programme.',
          stack: ['Java']
        },
        {
          id: 'draft-occupation',
          title: 'Draft Role',
          period: { start: '2025-05' },
          summary: 'Lorem ipsum.',
          stack: ['TBD'],
          isPlaceholder: true
        }
      ]
    }
  ],
  gaps: [{ period: { start: '2016-03', end: '2017-08' }, note: 'Finished my degree.' }],
  skills: [
    { name: 'Leadership', category: 'Leadership', evidence: ['written-occupation'] },
    { name: 'Draft Skill', category: 'Security', evidence: ['written-occupation'], isPlaceholder: true }
  ],
  caseStudies: [
    {
      id: 'study',
      title: 'A study',
      problem: 'Problem',
      constraint: 'Constraint',
      decisions: [],
      outcome: '',
      reflection: '',
      evidence: ['written-occupation'],
      redactions: ['Client identity']
    }
  ],
  education: [{ institution: 'A University', degree: 'A Degree', field: 'A Field' }],
  languages: [{ name: 'Spanish', level: 'Native' }],
  site: { posture: [], repoUrl: 'https://example.test' }
}

const mountWith = (input: ResumeContent) => {
  const host = document.createElement('div')
  host.append(renderPrintableResume(input))
  document.body.append(host)
  return host
}

const mount = () => mountWith(content)

afterEach(() => {
  document.body.replaceChildren()
})

it('heads the page with the profile, not a hardcoded name', () => {
  const host = mount()
  expect(host.querySelector('.print-name')?.textContent).toBe(content.profile.name)
  expect(host.querySelector('.print-role')?.textContent).toBe(content.profile.headline)
  expect(host.querySelector('.print-contact')?.textContent).toContain(content.profile.email)
})

it('prints every tenure, and every written occupation inside it', () => {
  const host = mount()
  expect(host.querySelectorAll('.print-tenure')).toHaveLength(content.tenures.length)
  const written = content.tenures.flatMap((tenure) =>
    tenure.occupations.filter((occupation) => !occupation.isPlaceholder)
  )
  expect(host.querySelectorAll('.print-occupation')).toHaveLength(written.length)
})

it('prints the grade progression for a tenure that has one', () => {
  const host = mount()
  expect(host.querySelector('.print-grades')?.textContent).toContain('Principal')
})

it('prints the gap note', () => {
  const host = mount()
  expect(host.querySelector('.print-gap')?.textContent).toContain(content.gaps[0]!.note)
})

it('prints education and languages', () => {
  const host = mount()
  expect(host.querySelector('.print-education')).not.toBeNull()
  expect(host.querySelector('.print-languages')).not.toBeNull()
})

it('omits placeholder occupations entirely', () => {
  const host = mountWith({
    ...content,
    tenures: [
      {
        ...content.tenures[0]!,
        occupations: [{ ...content.tenures[0]!.occupations[0]!, isPlaceholder: true }]
      }
    ]
  })
  expect(host.querySelectorAll('.print-occupation')).toHaveLength(0)
})

it('omits a placeholder tenure entirely, even when it contains a written occupation', () => {
  const host = mountWith({
    ...content,
    tenures: [{ ...content.tenures[0]!, isPlaceholder: true }]
  })
  expect(host.querySelectorAll('.print-tenure')).toHaveLength(0)
  expect(host.querySelectorAll('.print-occupation')).toHaveLength(0)
})

it('omits a tenure whose occupations are all unwritten, even when the tenure itself is not a placeholder', () => {
  const host = mountWith({
    ...content,
    tenures: [
      {
        ...content.tenures[0]!,
        occupations: [{ ...content.tenures[0]!.occupations[0]!, isPlaceholder: true }]
      }
    ]
  })
  expect(host.querySelectorAll('.print-tenure')).toHaveLength(0)
})

it('omits the grade line for a tenure whose grades array is empty', () => {
  const host = mountWith({
    ...content,
    tenures: [{ ...content.tenures[0]!, grades: [] }]
  })
  expect(host.querySelector('.print-grades')).toBeNull()
})

it('places the gap between the two tenures it separates in the printed timeline', () => {
  const host = mount()
  const timelineChildren = [...host.querySelector('.print-timeline')!.children].map((child) => child.className)
  expect(timelineChildren).toEqual(['print-tenure', 'print-gap', 'print-tenure'])
})

it('prints the most recent employer first', () => {
  const host = mount()
  const employers = [...host.querySelectorAll('.print-tenure-org')].map((org) => org.textContent)
  expect(employers).toEqual(['Consultancy', 'Product Company'])
})

it('prints the most recent occupation first inside a tenure', () => {
  const host = mountWith({
    ...content,
    tenures: [
      {
        ...content.tenures[0]!,
        occupations: [
          {
            ...content.tenures[0]!.occupations[0]!,
            id: 'earlier',
            title: 'Earlier',
            period: { start: '2013-09', end: '2014-09' }
          },
          {
            ...content.tenures[0]!.occupations[0]!,
            id: 'later',
            title: 'Later',
            period: { start: '2014-09', end: '2016-03' }
          }
        ]
      }
    ],
    gaps: []
  })
  const titles = [...host.querySelectorAll('.print-occupation-title')].map((title) => title.textContent)
  expect(titles).toEqual(['Later', 'Earlier'])
})

it('never prints a narrative or a case study', () => {
  const host = mount()
  expect(host.querySelector('.print-narrative')).toBeNull()
  expect(host.querySelector('.print-case-study')).toBeNull()
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
