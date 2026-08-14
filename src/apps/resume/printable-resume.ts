import { textElement } from '../../dom'
import { formatGapLine, mostRecentFirst, occupationsMostRecentFirst } from './career-chronology'
import { formatPeriod } from './period'
import type { CareerGap, Education, Language, Occupation, Profile, ResumeContent, Skill, Tenure } from './resume-model'
import { groupSkillsByCategory } from './skill-grouping'

const SITE_URL = 'salva.codes'

const isWritten = (entry: { isPlaceholder?: boolean }): boolean => !entry.isPlaceholder

const renderHeader = (profile: Profile): HTMLElement => {
  const header = document.createElement('header')
  const contact = [profile.email, profile.location, ...profile.links.map((link) => link.url)].join(' · ')
  header.append(
    textElement('h1', 'print-name', profile.name),
    textElement('p', 'print-role', profile.headline),
    textElement('p', 'print-contact', contact)
  )
  return header
}

const renderOccupation = (occupation: Occupation): HTMLElement => {
  const entry = document.createElement('article')
  entry.className = 'print-occupation'
  entry.append(
    textElement('h3', 'print-occupation-title', occupation.title),
    textElement('span', 'print-occupation-period', formatPeriod(occupation.period)),
    textElement('p', 'print-occupation-summary', occupation.summary)
  )
  if (occupation.stack.length > 0) {
    entry.append(textElement('span', 'print-occupation-stack', occupation.stack.join(' · ')))
  }
  return entry
}

const renderTenure = (tenure: Tenure): HTMLElement => {
  const section = document.createElement('section')
  section.className = 'print-tenure'
  section.append(
    textElement('h2', 'print-tenure-org', tenure.org),
    textElement('span', 'print-tenure-period', formatPeriod(tenure.period)),
    textElement('span', 'print-tenure-org-shape', tenure.orgShape)
  )
  if (tenure.grades && tenure.grades.length > 0) {
    section.append(textElement('span', 'print-grades', tenure.grades.map((grade) => grade.title).join(' → ')))
  }
  for (const occupation of occupationsMostRecentFirst(tenure.occupations.filter(isWritten))) {
    section.append(renderOccupation(occupation))
  }
  return section
}

const renderGap = (gap: CareerGap): HTMLElement => textElement('p', 'print-gap', formatGapLine(gap))

const hasPrintableOccupation = (tenure: Tenure): boolean => tenure.occupations.some(isWritten)

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

const renderPrintCredentials = (education: Education[], languages: Language[]): HTMLElement => {
  const section = document.createElement('section')
  section.className = 'print-credentials'
  if (education.length > 0) {
    const group = document.createElement('div')
    group.className = 'print-education'
    group.append(textElement('h3', 'print-credentials-heading', 'Education'))
    for (const entry of education) {
      group.append(textElement('span', 'print-education-entry', `${entry.degree}, ${entry.institution}`))
    }
    section.append(group)
  }
  if (languages.length > 0) {
    const group = document.createElement('div')
    group.className = 'print-languages'
    group.append(textElement('h3', 'print-credentials-heading', 'Languages'))
    group.append(
      textElement(
        'span',
        'print-language-entry',
        languages.map((language) => `${language.name} (${language.level})`).join(' · ')
      )
    )
    section.append(group)
  }
  return section
}

export const renderPrintableResume = (content: ResumeContent): DocumentFragment => {
  const fragment = document.createDocumentFragment()
  fragment.append(renderHeader(content.profile))
  const timeline = document.createElement('section')
  timeline.className = 'print-timeline'
  const printableTenures = content.tenures.filter(isWritten).filter(hasPrintableOccupation)
  for (const element of mostRecentFirst(printableTenures, content.gaps, { renderTenure, renderGap })) {
    timeline.append(element)
  }
  fragment.append(
    timeline,
    renderSkillGroups(content.skills.filter(isWritten)),
    renderPrintCredentials(content.education, content.languages),
    textElement('footer', 'print-footer', `Full Resume++ at ${SITE_URL}`)
  )
  return fragment
}
