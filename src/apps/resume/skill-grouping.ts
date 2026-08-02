import type { Skill } from './resume-model'

export interface SkillCategoryGroup {
  category: string
  skills: Skill[]
}

export const groupSkillsByCategory = (skills: Skill[]): SkillCategoryGroup[] => {
  const groups = new Map<string, Skill[]>()
  for (const skill of skills) {
    const existing = groups.get(skill.category)
    if (existing) {
      existing.push(skill)
    } else {
      groups.set(skill.category, [skill])
    }
  }
  return [...groups.entries()].map(([category, categorySkills]) => ({ category, skills: categorySkills }))
}
