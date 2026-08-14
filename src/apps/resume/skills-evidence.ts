import { textElement } from '../../dom'
import { findOccupation } from './occupations'
import { formatPeriod } from './period'
import type { Skill, Tenure } from './resume-model'
import { groupSkillsByCategory } from './skill-grouping'

const renderEvidenceChip = (occupationId: string, tenures: Tenure[]): HTMLButtonElement | null => {
  const occupation = findOccupation(tenures, occupationId)
  if (!occupation) {
    return null
  }
  const chip = document.createElement('button')
  chip.type = 'button'
  chip.className = 'evidence-chip'
  chip.dataset.occupationId = occupation.id
  chip.textContent = `${occupation.title} · ${formatPeriod(occupation.period)}`
  return chip
}

const renderSkill = (skill: Skill, tenures: Tenure[]): HTMLElement => {
  const entry = document.createElement('div')
  entry.className = 'skill'
  const heading = textElement('span', 'skill-name', skill.name)
  entry.append(heading)
  if (skill.isPlaceholder) {
    entry.append(textElement('span', 'draft', 'draft'))
  }
  const evidence = document.createElement('div')
  evidence.className = 'skill-evidence'
  for (const occupationId of skill.evidence) {
    const chip = renderEvidenceChip(occupationId, tenures)
    if (chip) {
      evidence.append(chip)
    }
  }
  entry.append(evidence)
  return entry
}

export const renderSkillsEvidence = (skills: Skill[], tenures: Tenure[]): DocumentFragment => {
  const fragment = document.createDocumentFragment()
  for (const { category, skills: categorySkills } of groupSkillsByCategory(skills)) {
    const group = document.createElement('section')
    group.className = 'skill-group'
    group.append(textElement('h3', 'skill-group-name', category))
    for (const skill of categorySkills) {
      group.append(renderSkill(skill, tenures))
    }
    fragment.append(group)
  }
  return fragment
}
