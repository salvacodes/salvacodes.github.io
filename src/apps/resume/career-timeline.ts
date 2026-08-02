import { textElement } from './dom'
import { formatPeriod } from './period'
import type { CareerStage } from './resume-model'

const renderSummary = (stage: CareerStage): HTMLElement => {
  const summary = document.createElement('summary')
  summary.append(
    textElement('span', 'stage-title', stage.title),
    textElement('span', 'stage-period', formatPeriod(stage.period)),
    textElement('span', 'stage-org', stage.orgShape)
  )
  if (stage.isPlaceholder) {
    summary.append(textElement('span', 'draft', 'draft'))
  }
  return summary
}

const renderStage = (stage: CareerStage): HTMLDetailsElement => {
  const entry = document.createElement('details')
  entry.className = 'stage'
  entry.dataset.stageId = stage.id
  const stack = document.createElement('div')
  stack.className = 'stage-stack'
  for (const technology of stage.stack) {
    stack.append(textElement('span', 'stack-chip', technology))
  }
  entry.append(renderSummary(stage), textElement('p', 'stage-narrative', stage.narrative), stack)
  return entry
}

export const renderCareerTimeline = (stages: CareerStage[]): DocumentFragment => {
  const fragment = document.createDocumentFragment()
  for (const stage of stages) {
    fragment.append(renderStage(stage))
  }
  return fragment
}
