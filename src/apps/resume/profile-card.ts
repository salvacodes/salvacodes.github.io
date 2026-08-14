import { textElement } from '../../dom'
import type { Profile } from './resume-model'

export const renderProfile = (profile: Profile): DocumentFragment => {
  const fragment = document.createDocumentFragment()
  const email = document.createElement('a')
  email.className = 'profile-email'
  email.href = `mailto:${profile.email}`
  email.textContent = profile.email
  const links = document.createElement('div')
  links.className = 'profile-links'
  for (const link of profile.links) {
    const anchor = document.createElement('a')
    anchor.className = 'profile-link'
    anchor.href = link.url
    anchor.target = '_blank'
    anchor.rel = 'noopener noreferrer'
    anchor.textContent = link.label
    links.append(anchor)
  }
  fragment.append(
    textElement('h2', 'profile-name', profile.name),
    textElement('p', 'profile-headline', profile.headline),
    textElement('p', 'profile-summary', profile.summary),
    textElement('span', 'profile-location', profile.location),
    email,
    links
  )
  return fragment
}
