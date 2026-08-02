import { describe, expect, it } from 'vitest'
import { formatPeriod, periodStartsBefore } from './period'

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
