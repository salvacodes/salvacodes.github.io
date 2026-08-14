import { textElement } from '../../dom'
import type { CaseStudy } from './resume-model'

const renderOpener = (study: CaseStudy): HTMLButtonElement => {
  const opener = document.createElement('button')
  opener.type = 'button'
  opener.className = 'case-study-opener'
  opener.dataset.studyId = study.id
  opener.append(
    textElement('span', 'case-study-title', study.title),
    textElement('span', 'case-study-problem', study.problem)
  )
  if (study.isPlaceholder) {
    opener.append(textElement('span', 'draft', 'draft'))
  }
  return opener
}

export const renderCaseStudyList = (caseStudies: CaseStudy[]): DocumentFragment => {
  const fragment = document.createDocumentFragment()
  for (const study of caseStudies) {
    fragment.append(renderOpener(study))
  }
  return fragment
}
