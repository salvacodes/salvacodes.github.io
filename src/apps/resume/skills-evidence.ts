import { textElement } from '../../dom'
import type { CareerStage, Skill } from './resume-model'
import { groupSkillsByCategory } from './skill-grouping'

const renderEvidenceChip = (stageId: string, stages: CareerStage[]): HTMLButtonElement | null => {
  const stage = stages.find((candidate) => candidate.id === stageId)
  if (!stage) {
    return null
  }
  const chip = document.createElement('button')
  chip.type = 'button'
  chip.className = 'evidence-chip'
  chip.dataset.stageId = stage.id
  chip.textContent = stage.title
  return chip
}

const renderSkill = (skill: Skill, stages: CareerStage[]): HTMLElement => {
  const entry = document.createElement('div')
  entry.className = 'skill'
  const heading = textElement('span', 'skill-name', skill.name)
  entry.append(heading)
  if (skill.isPlaceholder) {
    entry.append(textElement('span', 'draft', 'draft'))
  }
  const evidence = document.createElement('div')
  evidence.className = 'skill-evidence'
  for (const stageId of skill.evidence) {
    const chip = renderEvidenceChip(stageId, stages)
    if (chip) {
      evidence.append(chip)
    }
  }
  entry.append(evidence)
  return entry
}

export const renderSkillsEvidence = (skills: Skill[], stages: CareerStage[]): DocumentFragment => {
  const fragment = document.createDocumentFragment()
  for (const { category, skills: categorySkills } of groupSkillsByCategory(skills)) {
    const group = document.createElement('section')
    group.className = 'skill-group'
    group.append(textElement('h3', 'skill-group-name', category))
    for (const skill of categorySkills) {
      group.append(renderSkill(skill, stages))
    }
    fragment.append(group)
  }
  return fragment
}
