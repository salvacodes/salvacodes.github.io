export interface Period {
  start: string
  end?: string
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const formatMonth = (value: string): string => {
  const [year, month] = value.split('-')
  const monthName = MONTH_NAMES[Number(month) - 1]
  if (!year || !monthName) {
    throw new Error(`Invalid period value: ${value}`)
  }
  return `${monthName} ${year}`
}

export const formatPeriod = (period: Period): string =>
  `${formatMonth(period.start)} — ${period.end ? formatMonth(period.end) : 'Present'}`

export const periodStartsBefore = (a: Period, b: Period): boolean => a.start < b.start

const OPEN_ENDED = '9999-12'

const endOf = (period: Period): string => period.end ?? OPEN_ENDED

export const periodContains = (outer: Period, inner: Period): boolean =>
  inner.start >= outer.start && endOf(inner) <= endOf(outer)

export const periodsOverlap = (a: Period, b: Period): boolean => a.start < endOf(b) && b.start < endOf(a)
