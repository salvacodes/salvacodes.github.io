export interface PostFrontmatter {
  title: string
  date: string
  summary: string
  tags: string[]
  isDraft: boolean
}

export interface ParsedDocument {
  frontmatter: PostFrontmatter
  body: string
}

const DELIMITER = '---'
const FIELD_NAMES = ['title', 'date', 'summary', 'tags', 'draft']
const FIELD_LINE = /^([A-Za-z]+):(.*)$/
const QUOTED_VALUE = /^"(.*)"$|^'(.*)'$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const TAG_NAME = /^[a-z0-9-]+$/

const invalid = (sourceName: string, detail: string): Error => new Error(`${sourceName}: ${detail}`)

const stripQuotes = (value: string): string => {
  const quoted = QUOTED_VALUE.exec(value)
  return quoted ? (quoted[1] ?? quoted[2] ?? '') : value
}

const readFields = (lines: string[], sourceName: string): Map<string, string> => {
  const fields = new Map<string, string>()
  for (const line of lines) {
    if (line.trim() === '') {
      continue
    }
    const field = FIELD_LINE.exec(line)
    if (!field) {
      throw invalid(sourceName, `cannot read frontmatter line "${line}"`)
    }
    const [, name = '', value = ''] = field
    if (!FIELD_NAMES.includes(name)) {
      throw invalid(sourceName, `unknown frontmatter field "${name}"`)
    }
    if (fields.has(name)) {
      throw invalid(sourceName, `repeated frontmatter field "${name}"`)
    }
    fields.set(name, stripQuotes(value.trim()))
  }
  return fields
}

const requireText = (fields: Map<string, string>, name: string, sourceName: string): string => {
  const value = fields.get(name)
  if (!value) {
    throw invalid(sourceName, `missing frontmatter field "${name}"`)
  }
  return value
}

const isCalendarDate = (value: string): boolean => {
  const [year = 0, month = 0, day = 0] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

const requireDate = (fields: Map<string, string>, sourceName: string): string => {
  const value = requireText(fields, 'date', sourceName)
  if (!ISO_DATE.test(value) || !isCalendarDate(value)) {
    throw invalid(sourceName, `date must be YYYY-MM-DD, found "${value}"`)
  }
  return value
}

const parseTags = (value: string | undefined, sourceName: string): string[] => {
  if (value === undefined) {
    return []
  }
  if (!value.startsWith('[') || !value.endsWith(']')) {
    throw invalid(sourceName, `tags must be a bracketed list, found "${value}"`)
  }
  const listed = value.slice(1, -1).trim()
  if (listed === '') {
    return []
  }
  return listed.split(',').map((entry) => {
    const tag = entry.trim()
    if (!TAG_NAME.test(tag)) {
      throw invalid(sourceName, `tag must be lowercase and hyphenated, found "${tag}"`)
    }
    return tag
  })
}

const parseDraft = (value: string | undefined, sourceName: string): boolean => {
  if (value === undefined) {
    return false
  }
  if (value !== 'true' && value !== 'false') {
    throw invalid(sourceName, `draft must be true or false, found "${value}"`)
  }
  return value === 'true'
}

export const parseFrontmatter = (source: string, sourceName: string): ParsedDocument => {
  const lines = source.split('\n')
  if (lines[0]?.trim() !== DELIMITER) {
    throw invalid(sourceName, 'missing frontmatter block')
  }
  const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === DELIMITER)
  if (closingIndex === -1) {
    throw invalid(sourceName, 'unterminated frontmatter block')
  }
  const fields = readFields(lines.slice(1, closingIndex), sourceName)
  return {
    frontmatter: {
      title: requireText(fields, 'title', sourceName),
      date: requireDate(fields, sourceName),
      summary: requireText(fields, 'summary', sourceName),
      tags: parseTags(fields.get('tags'), sourceName),
      isDraft: parseDraft(fields.get('draft'), sourceName)
    },
    body: lines.slice(closingIndex + 1).join('\n')
  }
}
