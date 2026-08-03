const FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC'
})

export const formatPostDate = (date: string): string => FORMATTER.format(new Date(`${date}T00:00:00Z`))
