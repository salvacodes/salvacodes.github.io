import { textElement } from './dom'
import { formatPeriod } from './period'
import type { CareerStage, ResumeContent, Skill } from './resume-model'
import { groupSkillsByCategory } from './skill-grouping'

const SITE_URL = 'salva.codes'

const isWritten = (entry: { isPlaceholder?: boolean }): boolean => !entry.isPlaceholder

const renderStage = (stage: CareerStage): HTMLElement => {
  const entry = document.createElement('article')
  entry.className = 'print-stage'
  entry.append(
    textElement('h2', 'print-stage-title', stage.title),
    textElement('span', 'print-stage-period', formatPeriod(stage.period)),
    textElement('span', 'print-stage-org', stage.orgShape),
    textElement('p', 'print-stage-summary', stage.summary),
    textElement('span', 'print-stage-stack', stage.stack.join(' · '))
  )
  return entry
}

const renderSkillGroups = (skills: Skill[]): HTMLElement => {
  const section = document.createElement('section')
  section.className = 'print-skills'
  for (const { category, skills: categorySkills } of groupSkillsByCategory(skills)) {
    const group = document.createElement('div')
    group.className = 'print-skill-group'
    group.append(
      textElement('h3', 'print-skill-category', category),
      textElement('span', 'print-skill-names', categorySkills.map((skill) => skill.name).join(', '))
    )
    section.append(group)
  }
  return section
}

export const renderPrintableResume = (content: ResumeContent): DocumentFragment => {
  const fragment = document.createDocumentFragment()
  fragment.append(
    textElement('h1', 'print-name', 'Salva'),
    textElement('p', 'print-role', 'Engineering Lead, Cyber Security')
  )
  const timeline = document.createElement('section')
  timeline.className = 'print-timeline'
  for (const stage of content.stages.filter(isWritten)) {
    timeline.append(renderStage(stage))
  }
  fragment.append(timeline, renderSkillGroups(content.skills.filter(isWritten)))
  fragment.append(textElement('footer', 'print-footer', `Full Resume++ at ${SITE_URL}`))
  return fragment
}
