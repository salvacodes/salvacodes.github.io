import { textElement } from './dom'
import type { SiteArtifact } from './resume-model'

export const renderSiteArtifact = (site: SiteArtifact): DocumentFragment => {
  const fragment = document.createDocumentFragment()
  const list = document.createElement('ul')
  list.className = 'posture'
  for (const claim of site.posture) {
    list.append(textElement('li', 'posture-claim', claim))
  }
  const link = document.createElement('a')
  link.className = 'repo-link'
  link.href = site.repoUrl
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.textContent = 'Read the source on GitHub'
  fragment.append(list, link)
  return fragment
}
