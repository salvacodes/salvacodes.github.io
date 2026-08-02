import { renderCareerTimeline } from './career-timeline'
import { renderCaseStudyList } from './case-study-list'
import type { ResumeContent } from './resume-model'
import { renderSiteArtifact } from './site-artifact'
import { renderSkillsEvidence } from './skills-evidence'

export interface ResumeSection {
  id: string
  label: string
  isAvailable(content: ResumeContent): boolean
  render(content: ResumeContent): DocumentFragment
}

export const resumeSections: ResumeSection[] = [
  {
    id: 'career',
    label: 'Career',
    isAvailable: (content) => content.stages.length > 0,
    render: (content) => renderCareerTimeline(content.stages)
  },
  {
    id: 'skills',
    label: 'Skills',
    isAvailable: (content) => content.skills.length > 0,
    render: (content) => renderSkillsEvidence(content.skills, content.stages)
  },
  {
    id: 'case-studies',
    label: 'Case studies',
    isAvailable: (content) => content.caseStudies.length > 0,
    render: (content) => renderCaseStudyList(content.caseStudies)
  },
  {
    id: 'site',
    label: 'This site',
    isAvailable: () => true,
    render: (content) => renderSiteArtifact(content.site)
  }
]

export const availableSections = (content: ResumeContent): ResumeSection[] =>
  resumeSections.filter((section) => section.isAvailable(content))
