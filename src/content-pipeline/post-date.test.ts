import { describe, expect, it } from 'vitest'
import { formatPostDate } from './post-date'

describe('formatPostDate', () => {
  it('reads as a written date', () => {
    expect(formatPostDate('2026-07-12')).toBe('12 July 2026')
  })

  it('does not drift across time zones', () => {
    expect(formatPostDate('2026-01-01')).toBe('1 January 2026')
  })
})
