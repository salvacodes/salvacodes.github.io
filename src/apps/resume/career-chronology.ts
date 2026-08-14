import type { Period } from './period'
import { formatPeriod, periodStartsBefore } from './period'
import type { CareerGap, Occupation, Tenure } from './resume-model'

interface ChronologyHandlers<T> {
  renderTenure: (tenure: Tenure) => T
  renderGap: (gap: CareerGap) => T
}

interface ChronologyEntry<T> {
  period: Period
  render: () => T
}

const byMostRecentPeriod = (first: { period: Period }, second: { period: Period }): number => {
  if (periodStartsBefore(first.period, second.period)) {
    return 1
  }
  if (periodStartsBefore(second.period, first.period)) {
    return -1
  }
  return 0
}

export const mostRecentFirst = <T>(tenures: Tenure[], gaps: CareerGap[], handlers: ChronologyHandlers<T>): T[] => {
  const entries: ChronologyEntry<T>[] = [
    ...tenures.map((tenure) => ({ period: tenure.period, render: () => handlers.renderTenure(tenure) })),
    ...gaps.map((gap) => ({ period: gap.period, render: () => handlers.renderGap(gap) }))
  ]
  return entries.sort(byMostRecentPeriod).map((entry) => entry.render())
}

export const occupationsMostRecentFirst = (occupations: Occupation[]): Occupation[] =>
  [...occupations].sort(byMostRecentPeriod)

export const formatGapLine = (gap: CareerGap): string => `${formatPeriod(gap.period)} — ${gap.note}`
