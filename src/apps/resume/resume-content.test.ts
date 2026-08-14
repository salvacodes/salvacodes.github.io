import { describe, expect, it } from 'vitest'
import { allOccupations } from './occupations'
import { periodContains, periodStartsBefore, periodsOverlap } from './period'
import { resumeContent } from './resume-content'

describe('tenures', () => {
  it('have unique ids', () => {
    const ids = resumeContent.tenures.map((tenure) => tenure.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('are ordered oldest first', () => {
    for (let index = 1; index < resumeContent.tenures.length; index += 1) {
      const previous = resumeContent.tenures[index - 1]!
      const current = resumeContent.tenures[index]!
      expect(periodStartsBefore(previous.period, current.period)).toBe(true)
    }
  })

  it('never overlap each other', () => {
    const overlapping = resumeContent.tenures.flatMap((tenure, index) =>
      resumeContent.tenures
        .slice(index + 1)
        .filter((other) => periodsOverlap(tenure.period, other.period))
        .map((other) => `${tenure.id} <-> ${other.id}`)
    )
    expect(overlapping).toEqual([])
  })
})

describe('occupations', () => {
  it('have unique ids across every tenure', () => {
    const ids = resumeContent.tenures.flatMap((tenure) => tenure.occupations.map((occupation) => occupation.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('fall inside the tenure that holds them', () => {
    const escaping = resumeContent.tenures.flatMap((tenure) =>
      tenure.occupations
        .filter((occupation) => !periodContains(tenure.period, occupation.period))
        .map((occupation) => `${tenure.id} -> ${occupation.id}`)
    )
    expect(escaping).toEqual([])
  })

  it('are ordered oldest first within a tenure', () => {
    for (const tenure of resumeContent.tenures) {
      for (let index = 1; index < tenure.occupations.length; index += 1) {
        const previous = tenure.occupations[index - 1]!
        const current = tenure.occupations[index]!
        expect(periodStartsBefore(previous.period, current.period)).toBe(true)
      }
    }
  })

  it('always carry a summary', () => {
    const silent = resumeContent.tenures.flatMap((tenure) =>
      tenure.occupations.filter((occupation) => occupation.summary.length === 0).map((occupation) => occupation.id)
    )
    expect(silent).toEqual([])
  })
})

describe('grade spans', () => {
  it('never overlap within a tenure', () => {
    const overlapping = resumeContent.tenures.flatMap((tenure) =>
      (tenure.grades ?? []).flatMap((grade, index) =>
        (tenure.grades ?? [])
          .slice(index + 1)
          .filter((other) => periodsOverlap(grade.period, other.period))
          .map((other) => `${tenure.id}: ${grade.title} <-> ${other.title}`)
      )
    )
    expect(overlapping).toEqual([])
  })

  it('fall inside the tenure that holds them', () => {
    const escaping = resumeContent.tenures.flatMap((tenure) =>
      (tenure.grades ?? [])
        .filter((grade) => !periodContains(tenure.period, grade.period))
        .map((grade) => `${tenure.id} -> ${grade.title}`)
    )
    expect(escaping).toEqual([])
  })
})

describe('career gaps', () => {
  it('never overlap a tenure', () => {
    const overlapping = resumeContent.gaps.flatMap((gap) =>
      resumeContent.tenures.filter((tenure) => periodsOverlap(gap.period, tenure.period)).map((tenure) => tenure.id)
    )
    expect(overlapping).toEqual([])
  })

  it('always explain themselves', () => {
    expect(resumeContent.gaps.every((gap) => gap.note.length > 0)).toBe(true)
  })
})

describe('profile', () => {
  it('links out over https only', () => {
    const insecure = resumeContent.profile.links.filter((link) => !link.url.startsWith('https://'))
    expect(insecure).toEqual([])
  })
})

describe('skills', () => {
  it('only cite occupations that exist', () => {
    const occupationIds = new Set(allOccupations(resumeContent.tenures).map((occupation) => occupation.id))
    const dangling = resumeContent.skills.flatMap((skill) =>
      skill.evidence.filter((id) => !occupationIds.has(id)).map((id) => `${skill.name} -> ${id}`)
    )
    expect(dangling).toEqual([])
  })

  it('always cite at least one occupation', () => {
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

  it('only cite occupations that exist', () => {
    const occupationIds = new Set(allOccupations(resumeContent.tenures).map((occupation) => occupation.id))
    const dangling = resumeContent.caseStudies.flatMap((study) =>
      study.evidence.filter((id) => !occupationIds.has(id)).map((id) => `${study.id} -> ${id}`)
    )
    expect(dangling).toEqual([])
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
