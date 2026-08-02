import type { Period } from './period'

export interface CareerStage {
  id: string
  title: string
  period: Period
  orgShape: string
  stack: string[]
  summary: string
  narrative: string
  isPlaceholder?: boolean
}

export interface Skill {
  name: string
  category: string
  evidence: string[]
  isPlaceholder?: boolean
}

export interface CaseStudy {
  id: string
  title: string
  sector: string
  scale: string
  constraint: string
  decisions: string[]
  outcome: string
  redactions: string[]
  isPlaceholder?: boolean
}

export interface SiteArtifact {
  posture: string[]
  repoUrl: string
}

export interface ResumeContent {
  stages: CareerStage[]
  skills: Skill[]
  caseStudies: CaseStudy[]
  site: SiteArtifact
}
