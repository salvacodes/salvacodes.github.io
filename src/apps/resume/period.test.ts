import { describe, expect, it } from 'vitest'
import { formatPeriod, periodContains, periodStartsBefore, periodsOverlap } from './period'

describe('formatPeriod', () => {
  it('renders a closed period as month and year on both ends', () => {
    expect(formatPeriod({ start: '2013-09', end: '2016-03' })).toBe('Sep 2013 — Mar 2016')
  })

  it('renders an open period as ending in the present', () => {
    expect(formatPeriod({ start: '2026-03' })).toBe('Mar 2026 — Present')
  })
})

describe('periodStartsBefore', () => {
  it('orders by year', () => {
    expect(periodStartsBefore({ start: '2013-09' }, { start: '2016-03' })).toBe(true)
    expect(periodStartsBefore({ start: '2016-03' }, { start: '2013-09' })).toBe(false)
  })

  it('orders by month within the same year', () => {
    expect(periodStartsBefore({ start: '2016-01' }, { start: '2016-03' })).toBe(true)
  })

  it('treats an identical start as not before', () => {
    expect(periodStartsBefore({ start: '2016-03' }, { start: '2016-03' })).toBe(false)
  })
})

describe('periodContains', () => {
  it('accepts an inner period inside a closed outer period', () => {
    expect(periodContains({ start: '2017-08', end: '2026-01' }, { start: '2018-10', end: '2022-01' })).toBe(true)
  })

  it('accepts an inner period sharing both boundaries', () => {
    expect(periodContains({ start: '2016-04', end: '2017-07' }, { start: '2016-04', end: '2017-07' })).toBe(true)
  })

  it('rejects an inner period starting before the outer one', () => {
    expect(periodContains({ start: '2017-08', end: '2026-01' }, { start: '2016-04', end: '2018-10' })).toBe(false)
  })

  it('rejects an inner period ending after the outer one', () => {
    expect(periodContains({ start: '2017-08', end: '2020-01' }, { start: '2018-10', end: '2022-01' })).toBe(false)
  })

  it('accepts any inner period when the outer one is current', () => {
    expect(periodContains({ start: '2017-08' }, { start: '2025-10' })).toBe(true)
    expect(periodContains({ start: '2017-08' }, { start: '2018-10', end: '2022-01' })).toBe(true)
  })

  it('rejects a current inner period inside a closed outer one', () => {
    expect(periodContains({ start: '2016-04', end: '2017-07' }, { start: '2016-04' })).toBe(false)
  })
})

describe('periodsOverlap', () => {
  it('reports no overlap for adjacent periods sharing a boundary month', () => {
    expect(periodsOverlap({ start: '2017-08', end: '2020-10' }, { start: '2020-10', end: '2025-05' })).toBe(false)
  })

  it('reports an overlap when one period starts inside the other', () => {
    expect(periodsOverlap({ start: '2017-08', end: '2021-01' }, { start: '2020-10', end: '2025-05' })).toBe(true)
  })

  it('reports an overlap against a current period', () => {
    expect(periodsOverlap({ start: '2025-05' }, { start: '2026-01', end: '2026-06' })).toBe(true)
  })

  it('reports no overlap for disjoint periods', () => {
    expect(periodsOverlap({ start: '2011-09', end: '2012-07' }, { start: '2015-03', end: '2016-03' })).toBe(false)
  })
})
