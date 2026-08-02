import type { ResumeContent } from './resume-model'

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'

export const resumeContent: ResumeContent = {
  stages: [
    {
      id: 'backend-developer',
      title: 'Backend Developer',
      period: { start: '2013-09', end: '2016-03' },
      orgShape: 'Product team, single-country delivery',
      stack: ['Java', 'Spring', 'SQL'],
      summary: 'Built and maintained server-side services.',
      narrative: LOREM,
      isPlaceholder: true
    },
    {
      id: 'fullstack-developer',
      title: 'Fullstack Developer',
      period: { start: '2016-03', end: '2018-06' },
      orgShape: 'Cross-functional product team',
      stack: ['Java', 'JavaScript', 'REST'],
      summary: 'Took features end to end, browser to database.',
      narrative: LOREM,
      isPlaceholder: true
    },
    {
      id: 'tech-lead-delivery',
      title: 'Tech Lead, Delivery Team',
      period: { start: '2018-06', end: '2022-01' },
      orgShape: 'Multi-team delivery org, client-facing',
      stack: ['Architecture', 'CI/CD', 'Cloud'],
      summary: 'Led a delivery team through several client engagements.',
      narrative: LOREM,
      isPlaceholder: true
    },
    {
      id: 'graduate-trainer',
      title: 'Trainer, Graduate Developers',
      period: { start: '2022-01', end: '2023-01' },
      orgShape: 'Internal academy, successive graduate cohorts',
      stack: ['Curriculum design', 'Mentoring', 'Code review'],
      summary: 'Taught new graduate developers for a year.',
      narrative: LOREM,
      isPlaceholder: true
    },
    {
      id: 'tech-lead-return',
      title: 'Tech Lead, Client Delivery',
      period: { start: '2023-01', end: '2024-02' },
      orgShape: 'Client-facing delivery team',
      stack: ['Architecture', 'Stakeholder management'],
      summary: 'Returned to technical leadership on client delivery.',
      narrative: LOREM,
      isPlaceholder: true
    },
    {
      id: 'security-engineer',
      title: 'Cyber Security Engineer',
      period: { start: '2024-02', end: '2026-03' },
      orgShape: 'Cyber security team, regulated environment',
      stack: ['Threat modelling', 'AppSec', 'Secure SDLC'],
      summary: 'Moved from building software to securing it.',
      narrative: LOREM,
      isPlaceholder: true
    },
    {
      id: 'security-engineering-lead',
      title: 'Engineering Lead, Cyber Security',
      period: { start: '2026-03' },
      orgShape: 'Engineering team within a cyber security function',
      stack: ['Security engineering', 'Team leadership', 'Roadmap'],
      summary: 'Leading the engineering team inside the security function.',
      narrative: LOREM,
      isPlaceholder: true
    }
  ],
  skills: [
    {
      name: 'Secure SDLC',
      category: 'Security',
      evidence: ['security-engineer', 'security-engineering-lead'],
      isPlaceholder: true
    },
    {
      name: 'Threat Modelling',
      category: 'Security',
      evidence: ['security-engineer', 'security-engineering-lead'],
      isPlaceholder: true
    },
    {
      name: 'Technical Leadership',
      category: 'Leadership',
      evidence: ['tech-lead-delivery', 'tech-lead-return', 'security-engineering-lead'],
      isPlaceholder: true
    },
    {
      name: 'Mentoring & Teaching',
      category: 'Leadership',
      evidence: ['graduate-trainer', 'tech-lead-delivery'],
      isPlaceholder: true
    },
    {
      name: 'Backend Engineering',
      category: 'Engineering',
      evidence: ['backend-developer', 'fullstack-developer', 'tech-lead-delivery'],
      isPlaceholder: true
    },
    {
      name: 'Web Platform',
      category: 'Engineering',
      evidence: ['fullstack-developer'],
      isPlaceholder: true
    }
  ],
  caseStudies: [
    {
      id: 'regulated-platform',
      title: 'Hardening a regulated delivery platform',
      sector: 'Regulated enterprise',
      scale: '30-person delivery org, 4 countries',
      constraint: 'External audit, no downtime window',
      decisions: [LOREM, LOREM],
      outcome: LOREM,
      redactions: ['Client identity', 'Transaction volumes'],
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
