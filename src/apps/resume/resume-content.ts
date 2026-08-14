import type { ResumeContent } from './resume-model'

export const resumeContent: ResumeContent = {
  profile: {
    name: 'Salvador Juan Martínez',
    headline: 'Head of Cyber Defense Engineering at Thoughtworks',
    summary:
      'I spent fifteen years building software — backend first, then full stack, then leading delivery teams and teaching the people joining them. In 2024 I moved into InfoSec, and eighteen months later I lead the engineering sub-team within Cyber Defense. It is the same work with the stakes made explicit: read a system you did not build, decide what actually matters, and write the decision down so it outlives the meeting. Where this goes next is still taking shape, and that is on purpose.',
    location: 'Spain',
    email: 'hi@salva.codes',
    links: [
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/salva-juan' },
      { label: 'GitHub', url: 'https://github.com/salvacodes' },
      { label: 'salva.codes', url: 'https://salva.codes' }
    ]
  },
  tenures: [
    {
      id: 'itaca-tsb',
      org: 'ITACA-TSB',
      orgShape: 'University research institute, EU-funded projects',
      period: { start: '2009-08', end: '2011-03' },
      occupations: [
        {
          id: 'itaca-analyst',
          title: 'Software Engineer & Analyst',
          period: { start: '2009-08', end: '2011-03' },
          summary:
            'Contributed to EU-funded research projects in telehealth, intelligent houses and eLearning: gathering requirements from stakeholders, designing parts of the systems, building the applications and writing the documentation.',
          stack: []
        }
      ]
    },
    {
      id: 'servipoli',
      org: 'Fundación Servipoli',
      orgShape: 'University foundation, public web platform for a public university',
      period: { start: '2011-09', end: '2012-07' },
      occupations: [
        {
          id: 'servipoli-web-developer',
          title: 'Web Developer & Technical Support',
          period: { start: '2011-09', end: '2012-07' },
          summary:
            'Built features for PoliformaT, the Universidad Politécnica de Valencia web platform, and Microsoft Office plugins that integrated with it, while resolving issues for the people using it.',
          stack: []
        }
      ]
    },
    {
      id: 'freelance',
      org: 'Freelance',
      orgShape: 'Independent, direct clients from requirements to delivery',
      period: { start: '2015-03', end: '2016-03' },
      occupations: [
        {
          id: 'freelance-engineer',
          title: 'Software Engineer & IT Consultant',
          period: { start: '2015-03', end: '2016-03' },
          summary:
            'Worked directly with customers end to end: gathering requirements, designing the system architecture, building the full stack and advising on IT decisions.',
          stack: []
        }
      ]
    },
    {
      id: 'haufe-umantis',
      org: 'Haufe-Umantis',
      orgShape: 'HR and talent management product company, Barcelona',
      period: { start: '2016-04', end: '2017-07' },
      occupations: [
        {
          id: 'senior-java-engineer',
          title: 'Senior Java Engineer',
          period: { start: '2016-04', end: '2017-01' },
          summary:
            'Backend developer in an agile team building talent management products: RESTful services, the in-house framework, architecture decisions, code review and mentoring junior developers.',
          stack: ['Java 8', 'Spring', 'REST']
        },
        {
          id: 'architect-cto-office',
          title: 'Architect, CTO Office',
          period: { start: '2017-01', end: '2017-07' },
          summary:
            'Promoted into the CTO office: system and application architecture design, domain-driven design research and coaching, and ownership of centralised logging, monitoring and distributed tracing.',
          stack: ['Architecture', 'DDD', 'Observability']
        }
      ]
    },
    {
      id: 'thoughtworks',
      org: 'Thoughtworks Spain',
      orgShape: 'Global technology consultancy — client delivery teams, then the internal InfoSec function',
      period: { start: '2017-08' },
      grades: [
        { title: 'Senior', period: { start: '2017-08', end: '2020-10' } },
        { title: 'Lead', period: { start: '2020-10', end: '2025-05' } },
        { title: 'Principal', period: { start: '2025-05' } }
      ],
      occupations: [
        {
          id: 'fullstack-engineer',
          title: 'Full-stack Software Engineer',
          period: { start: '2017-08', end: '2018-10' },
          summary: 'Delivered features end to end on client engagements, from the browser to the database.',
          stack: []
        },
        {
          id: 'tech-lead-2018',
          title: 'Tech Lead & Full-stack Engineer',
          period: { start: '2018-10', end: '2022-01' },
          summary:
            'Led a delivery team while still writing code: architecture decisions, engineering practices and CI/CD, and consulting the client on how to work.',
          stack: []
        },
        {
          id: 'twu-trainer',
          title: 'Thoughtworks University Trainer',
          period: { start: '2022-01', end: '2022-12' },
          summary:
            'Trained successive cohorts of new graduate developers for a year: curriculum, mentoring, code review and feedback.',
          stack: []
        },
        {
          id: 'tech-lead-2022',
          title: 'Tech Lead & Full-stack Engineer',
          period: { start: '2022-12', end: '2024-04' },
          summary:
            'Returned to technical leadership on client delivery, leading teams and consulting on agile practices, software excellence and CI/CD.',
          stack: []
        },
        {
          id: 'cyber-security-engineer',
          title: 'Cyber Security Engineer',
          period: { start: '2024-04', end: '2025-10' },
          summary: 'Joined the internal InfoSec engineering team, moving from building software to defending it.',
          stack: []
        },
        {
          id: 'head-cyber-defense-engineering',
          title: 'Head of Cyber Defense Engineering',
          period: { start: '2025-10' },
          summary: 'Lead the engineering sub-team within Cyber Defense.',
          stack: []
        }
      ]
    }
  ],
  gaps: [
    {
      period: { start: '2012-07', end: '2015-03' },
      note: 'Finished my degree, and worked outside IT.'
    }
  ],
  education: [
    {
      institution: 'Universidad Politécnica de Valencia',
      degree: 'Ingeniería Informática',
      field: 'Lenguajes e Inteligencia Artificial'
    }
  ],
  languages: [
    { name: 'Spanish', level: 'Native' },
    { name: 'Catalan / Valencian', level: 'Native' },
    { name: 'English', level: 'Professional working' }
  ],
  skills: [
    {
      name: 'Detection Engineering',
      category: 'Security',
      evidence: ['cyber-security-engineer', 'head-cyber-defense-engineering']
    },
    {
      name: 'Cloud Security',
      category: 'Security',
      evidence: ['cyber-security-engineer', 'head-cyber-defense-engineering']
    },
    {
      name: 'Security Engineering',
      category: 'Security',
      evidence: ['cyber-security-engineer', 'head-cyber-defense-engineering']
    },
    {
      name: 'Technical Leadership',
      category: 'Leadership',
      evidence: ['tech-lead-2018', 'tech-lead-2022', 'head-cyber-defense-engineering']
    },
    {
      name: 'Teaching & Mentoring',
      category: 'Leadership',
      evidence: ['twu-trainer', 'tech-lead-2018', 'senior-java-engineer']
    },
    {
      name: 'Consulting & Stakeholder Management',
      category: 'Leadership',
      evidence: ['tech-lead-2022', 'freelance-engineer']
    },
    {
      name: 'Backend (Java, Spring)',
      category: 'Engineering',
      evidence: ['senior-java-engineer', 'fullstack-engineer', 'tech-lead-2018']
    },
    {
      name: 'Full-stack Web',
      category: 'Engineering',
      evidence: ['fullstack-engineer', 'tech-lead-2018', 'freelance-engineer', 'servipoli-web-developer']
    },
    { name: 'Architecture & DDD', category: 'Engineering', evidence: ['architect-cto-office', 'tech-lead-2018'] },
    {
      name: 'CI/CD & Engineering Practices',
      category: 'Engineering',
      evidence: ['tech-lead-2022', 'head-cyber-defense-engineering']
    },
    { name: 'Observability', category: 'Engineering', evidence: ['architect-cto-office'] }
  ],
  caseStudies: [
    {
      id: 'delivery-under-constraint',
      title: 'Leading delivery when the constraint was not technical',
      problem: 'To be written from the interview.',
      constraint: 'To be written from the interview.',
      decisions: ['To be written from the interview.'],
      outcome: 'To be written from the interview.',
      reflection: 'To be written from the interview.',
      evidence: ['tech-lead-2018'],
      redactions: ['Client identity'],
      isPlaceholder: true
    },
    {
      id: 'security-adoption',
      title: 'Making the secure path the path of least resistance',
      problem: 'To be written from the interview.',
      constraint: 'To be written from the interview.',
      decisions: ['To be written from the interview.'],
      outcome: 'To be written from the interview.',
      reflection: 'To be written from the interview.',
      evidence: ['cyber-security-engineer'],
      redactions: ['Tooling and defensive detail'],
      isPlaceholder: true
    }
  ],
  site: {
    posture: [
      'Zero runtime dependencies — every byte shipped is first-party code.',
      'Strict Content-Security-Policy with no unsafe-inline and no external origins.',
      'GitHub Actions pinned to full commit SHAs, hardened runners, dependency audit in CI.',
      'Built test-first: unit, component and cross-browser end-to-end suites.'
    ],
    repoUrl: 'https://github.com/salvacodes/salvacodes.github.io'
  }
}
