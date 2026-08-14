import { textElement } from '../../dom'
import { formatGapLine, mostRecentFirst, occupationsMostRecentFirst } from './career-chronology'
import { formatPeriod } from './period'
import type { CareerGap, GradeSpan, Occupation, Tenure } from './resume-model'

const renderGradeTrack = (grades: GradeSpan[]): HTMLElement => {
  const track = document.createElement('div')
  track.className = 'grade-track'
  for (const grade of grades) {
    const entry = document.createElement('div')
    entry.className = 'grade'
    entry.append(
      textElement('span', 'grade-title', grade.title),
      textElement('span', 'grade-period', formatPeriod(grade.period))
    )
    track.append(entry)
  }
  return track
}

const renderOccupation = (occupation: Occupation): HTMLDetailsElement => {
  const entry = document.createElement('details')
  entry.className = 'occupation'
  entry.dataset.occupationId = occupation.id
  const summary = document.createElement('summary')
  summary.append(
    textElement('span', 'occupation-title', occupation.title),
    textElement('span', 'occupation-period', formatPeriod(occupation.period))
  )
  if (occupation.isPlaceholder) {
    summary.append(textElement('span', 'draft', 'draft'))
  }
  entry.append(summary, textElement('p', 'occupation-summary', occupation.summary))
  if (occupation.narrative) {
    entry.append(textElement('p', 'occupation-narrative', occupation.narrative))
  }
  const stack = document.createElement('div')
  stack.className = 'occupation-stack'
  for (const technology of occupation.stack) {
    stack.append(textElement('span', 'stack-chip', technology))
  }
  entry.append(stack)
  return entry
}

const renderTenure = (tenure: Tenure): HTMLElement => {
  const section = document.createElement('section')
  section.className = 'tenure'
  section.dataset.tenureId = tenure.id
  const header = document.createElement('header')
  header.append(
    textElement('h3', 'tenure-org', tenure.org),
    textElement('span', 'tenure-period', formatPeriod(tenure.period)),
    textElement('span', 'tenure-org-shape', tenure.orgShape)
  )
  if (tenure.isPlaceholder) {
    header.append(textElement('span', 'draft', 'draft'))
  }
  section.append(header)
  if (tenure.grades && tenure.grades.length > 0) {
    section.append(renderGradeTrack(tenure.grades))
  }
  for (const occupation of occupationsMostRecentFirst(tenure.occupations)) {
    section.append(renderOccupation(occupation))
  }
  return section
}

const renderGap = (gap: CareerGap): HTMLElement => textElement('p', 'career-gap', formatGapLine(gap))

export const renderCareerTimeline = (tenures: Tenure[], gaps: CareerGap[]): DocumentFragment => {
  const fragment = document.createDocumentFragment()
  for (const element of mostRecentFirst(tenures, gaps, { renderTenure, renderGap })) {
    fragment.append(element)
  }
  return fragment
}
