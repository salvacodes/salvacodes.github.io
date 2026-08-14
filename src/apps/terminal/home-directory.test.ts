import { describe, expect, it } from 'vitest'
import { resumeContent } from '../resume/resume-content'
import { homeDirectory } from './home-directory'

describe('resume.txt', () => {
  it('names every employer the resume knows about', () => {
    const resumeFile = homeDirectory['resume.txt']!
    for (const tenure of resumeContent.tenures) {
      expect(resumeFile).toContain(tenure.org)
    }
  })

  it('names every occupation the resume knows about', () => {
    const resumeFile = homeDirectory['resume.txt']!
    for (const tenure of resumeContent.tenures) {
      for (const occupation of tenure.occupations) {
        expect(resumeFile).toContain(occupation.title)
      }
    }
  })

  it('carries the current headline', () => {
    expect(homeDirectory['resume.txt']).toContain(resumeContent.profile.headline)
  })

  it('points at the app', () => {
    expect(homeDirectory['resume.txt']).toContain('resume')
  })

  it('lists the most recent employer before the earliest one', () => {
    const resumeFile = homeDirectory['resume.txt']!
    const mostRecent = resumeContent.tenures.at(-1)!
    const earliest = resumeContent.tenures[0]!
    expect(resumeFile.indexOf(mostRecent.org)).toBeLessThan(resumeFile.indexOf(earliest.org))
  })
})
