import { textElement } from '../../dom'
import type { Education, Language } from './resume-model'

const renderEducation = (education: Education[]): HTMLElement => {
  const section = document.createElement('section')
  section.className = 'education'
  section.append(textElement('h3', 'credentials-heading', 'Education'))
  for (const entry of education) {
    const item = document.createElement('div')
    item.className = 'education-entry'
    item.append(
      textElement('span', 'education-degree', entry.degree),
      textElement('span', 'education-institution', entry.institution),
      textElement('span', 'education-field', entry.field)
    )
    section.append(item)
  }
  return section
}

const renderLanguages = (languages: Language[]): HTMLElement => {
  const section = document.createElement('section')
  section.className = 'languages'
  section.append(textElement('h3', 'credentials-heading', 'Languages'))
  for (const language of languages) {
    const item = document.createElement('div')
    item.className = 'language-entry'
    item.append(
      textElement('span', 'language-name', language.name),
      textElement('span', 'language-level', language.level)
    )
    section.append(item)
  }
  return section
}

export const renderCredentials = (education: Education[], languages: Language[]): DocumentFragment => {
  const fragment = document.createDocumentFragment()
  if (education.length > 0) {
    fragment.append(renderEducation(education))
  }
  if (languages.length > 0) {
    fragment.append(renderLanguages(languages))
  }
  return fragment
}
