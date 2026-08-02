import { describe, expect, it } from 'vitest'
import { periodStartsBefore } from './period'
import { resumeContent } from './resume-content'

describe('career stages', () => {
  it('have unique ids', () => {
    const ids = resumeContent.stages.map((stage) => stage.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('are ordered oldest first', () => {
    for (let index = 1; index < resumeContent.stages.length; index += 1) {
      const previous = resumeContent.stages[index - 1]!
      const current = resumeContent.stages[index]!
      expect(periodStartsBefore(previous.period, current.period)).toBe(true)
    }
  })
})

describe('skills', () => {
  it('only cite career stages that exist', () => {
    const stageIds = new Set(resumeContent.stages.map((stage) => stage.id))
    const dangling = resumeContent.skills.flatMap((skill) =>
      skill.evidence.filter((stageId) => !stageIds.has(stageId)).map((stageId) => `${skill.name} -> ${stageId}`)
    )
    expect(dangling).toEqual([])
  })

  it('always cite at least one career stage', () => {
    const unevidenced = resumeContent.skills.filter((skill) => skill.evidence.length === 0).map((skill) => skill.name)
    expect(unevidenced).toEqual([])
  })
})

describe('case studies', () => {
  it('have unique ids', () => {
    const ids = resumeContent.caseStudies.map((study) => study.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('declare what they withhold', () => {
    const undisclosed = resumeContent.caseStudies.filter((study) => study.redactions.length === 0).map((s) => s.id)
    expect(undisclosed).toEqual([])
  })
})

describe('site artifact', () => {
  it('points at the repo over https', () => {
    expect(resumeContent.site.repoUrl.startsWith('https://')).toBe(true)
  })

  it('declares a non-empty posture', () => {
    expect(resumeContent.site.posture.length).toBeGreaterThan(0)
  })
})
