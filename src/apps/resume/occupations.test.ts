import { describe, expect, it } from 'vitest'
import { allOccupations, findOccupation } from './occupations'
import type { Tenure } from './resume-model'

const tenures: Tenure[] = [
  {
    id: 'first-org',
    org: 'First Org',
    orgShape: 'Small product team',
    period: { start: '2016-04', end: '2017-07' },
    occupations: [
      {
        id: 'engineer',
        title: 'Engineer',
        period: { start: '2016-04', end: '2017-01' },
        summary: 'Built things.',
        stack: []
      },
      {
        id: 'architect',
        title: 'Architect',
        period: { start: '2017-01', end: '2017-07' },
        summary: 'Designed things.',
        stack: []
      }
    ]
  },
  {
    id: 'second-org',
    org: 'Second Org',
    orgShape: 'Consultancy',
    period: { start: '2017-08' },
    occupations: [
      {
        id: 'lead',
        title: 'Lead',
        period: { start: '2017-08' },
        summary: 'Led things.',
        stack: []
      }
    ]
  }
]

describe('allOccupations', () => {
  it('flattens every tenure in order', () => {
    expect(allOccupations(tenures).map((occupation) => occupation.id)).toEqual(['engineer', 'architect', 'lead'])
  })

  it('returns nothing for no tenures', () => {
    expect(allOccupations([])).toEqual([])
  })
})

describe('findOccupation', () => {
  it('finds an occupation held by any tenure', () => {
    expect(findOccupation(tenures, 'lead')?.title).toBe('Lead')
  })

  it('returns undefined for an id nobody holds', () => {
    expect(findOccupation(tenures, 'retired-role')).toBeUndefined()
  })
})
