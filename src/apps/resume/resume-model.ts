import type { Period } from './period'

export interface Skill {
  name: string
  category: string
  evidence: string[]
  isPlaceholder?: boolean
}

export interface CaseStudy {
  id: string
  title: string
  problem: string
  constraint: string
  decisions: string[]
  outcome: string
  reflection: string
  evidence: string[]
  redactions: string[]
  isPlaceholder?: boolean
}

export interface SiteArtifact {
  posture: string[]
  repoUrl: string
}

export interface ProfileLink {
  label: string
  url: string
}

export interface Profile {
  name: string
  headline: string
  summary: string
  location: string
  email: string
  links: ProfileLink[]
}

export interface GradeSpan {
  title: string
  period: Period
}

export interface Occupation {
  id: string
  title: string
  period: Period
  summary: string
  narrative?: string
  stack: string[]
  isPlaceholder?: boolean
}

export interface Tenure {
  id: string
  org: string
  orgShape: string
  period: Period
  grades?: GradeSpan[]
  occupations: Occupation[]
  isPlaceholder?: boolean
}

export interface CareerGap {
  period: Period
  note: string
}

export interface Education {
  institution: string
  degree: string
  field: string
}

export interface Language {
  name: string
  level: string
}

export interface ResumeContent {
  profile: Profile
  tenures: Tenure[]
  gaps: CareerGap[]
  skills: Skill[]
  caseStudies: CaseStudy[]
  education: Education[]
  languages: Language[]
  site: SiteArtifact
}
