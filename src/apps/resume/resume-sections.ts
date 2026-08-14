import { renderCareerTimeline } from './career-timeline'
import { renderCaseStudyList } from './case-study-list'
import { renderCredentials } from './credentials'
import { renderProfile } from './profile-card'
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
    id: 'profile',
    label: 'Profile',
    isAvailable: () => true,
    render: (content) => renderProfile(content.profile)
  },
  {
    id: 'career',
    label: 'Career',
    isAvailable: (content) => content.tenures.length > 0,
    render: (content) => renderCareerTimeline(content.tenures, content.gaps)
  },
  {
    id: 'skills',
    label: 'Skills',
    isAvailable: (content) => content.skills.length > 0,
    render: (content) => renderSkillsEvidence(content.skills, content.tenures)
  },
  {
    id: 'case-studies',
    label: 'Case studies',
    isAvailable: (content) => content.caseStudies.length > 0,
    render: (content) => renderCaseStudyList(content.caseStudies)
  },
  {
    id: 'credentials',
    label: 'Credentials',
    isAvailable: (content) => content.education.length > 0 || content.languages.length > 0,
    render: (content) => renderCredentials(content.education, content.languages)
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
