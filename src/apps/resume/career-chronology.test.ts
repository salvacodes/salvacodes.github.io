import { describe, expect, it } from 'vitest'
import { formatGapLine, mostRecentFirst, occupationsMostRecentFirst } from './career-chronology'
import type { CareerGap, Occupation, Tenure } from './resume-model'

const tenure = (id: string, start: string, end?: string): Tenure => ({
  id,
  org: id,
  orgShape: 'Org shape',
  period: { start, end },
  occupations: []
})

const gap = (start: string, end: string, note = 'A gap.'): CareerGap => ({ period: { start, end }, note })

const occupation = (id: string, start: string, end?: string): Occupation => ({
  id,
  title: id,
  period: { start, end },
  summary: 'A summary.',
  stack: []
})

describe('mostRecentFirst', () => {
  it('puts the most recent tenure first', () => {
    const early = tenure('early', '2009-08', '2011-03')
    const late = tenure('late', '2017-08')
    const result = mostRecentFirst([early, late], [], {
      renderTenure: (t) => t.id,
      renderGap: () => 'gap'
    })
    expect(result).toEqual(['late', 'early'])
  })

  it('still sorts a gap between the two tenures it separates', () => {
    const before = tenure('before', '2009-08', '2011-03')
    const after = tenure('after', '2017-08')
    const between = gap('2011-03', '2017-08')
    const result = mostRecentFirst([before, after], [between], {
      renderTenure: (t) => t.id,
      renderGap: () => 'gap'
    })
    expect(result).toEqual(['after', 'gap', 'before'])
  })

  it('places a gap after every tenure that starts later than it', () => {
    const earliest = tenure('earliest', '2005-01', '2006-01')
    const middle = tenure('middle', '2015-01')
    const soleGap = gap('2006-01', '2015-01')
    const result = mostRecentFirst([earliest, middle], [soleGap], {
      renderTenure: (t) => t.id,
      renderGap: () => 'gap'
    })
    expect(result).toEqual(['middle', 'gap', 'earliest'])
  })
})

describe('occupationsMostRecentFirst', () => {
  it('puts the current occupation first and leaves the input untouched', () => {
    const authored = [
      occupation('earliest', '2017-08', '2018-10'),
      occupation('middle', '2018-10', '2024-04'),
      occupation('current', '2024-04')
    ]
    expect(occupationsMostRecentFirst(authored).map((entry) => entry.id)).toEqual(['current', 'middle', 'earliest'])
    expect(authored.map((entry) => entry.id)).toEqual(['earliest', 'middle', 'current'])
  })
})

describe('formatGapLine', () => {
  it('combines the formatted period with the gap note', () => {
    const line = formatGapLine(gap('2011-03', '2017-08', 'Finished my degree.'))
    expect(line).toBe('Mar 2011 — Aug 2017 — Finished my degree.')
  })
})
