import { afterEach, expect, it } from 'vitest'
import { renderProfile } from './profile-card'
import type { Profile } from './resume-model'

const profile: Profile = {
  name: 'Salvador Juan Martínez',
  headline: 'Head of Cyber Defense Engineering',
  summary: 'Fifteen years building software, now pointed at security.',
  location: 'Spain',
  email: 'hi@example.test',
  links: [{ label: 'LinkedIn', url: 'https://example.test/in/someone' }]
}

const mount = (input: Profile = profile) => {
  const host = document.createElement('div')
  host.append(renderProfile(input))
  document.body.append(host)
  return host
}

afterEach(() => {
  document.body.replaceChildren()
})

it('leads with the name, the headline and the summary', () => {
  const host = mount()
  expect(host.querySelector('.profile-name')?.textContent).toBe('Salvador Juan Martínez')
  expect(host.querySelector('.profile-headline')?.textContent).toBe('Head of Cyber Defense Engineering')
  expect(host.querySelector('.profile-summary')?.textContent).toBe(
    'Fifteen years building software, now pointed at security.'
  )
})

it('shows where the person is based', () => {
  const host = mount()
  expect(host.querySelector('.profile-location')?.textContent).toBe('Spain')
})

it('makes the address mailable', () => {
  const host = mount()
  const email = host.querySelector<HTMLAnchorElement>('.profile-email')!
  expect(email.getAttribute('href')).toBe('mailto:hi@example.test')
})

it('renders one link per profile link, opened safely', () => {
  const host = mount()
  const links = host.querySelectorAll<HTMLAnchorElement>('.profile-link')
  expect([...links].map((link) => link.textContent)).toEqual(['LinkedIn'])
  expect(links[0]?.rel).toContain('noopener')
})

it('renders content as text, never as markup', () => {
  const host = mount({ ...profile, summary: '<img src=x onerror=alert(1)>' })
  expect(host.querySelector('img')).toBeNull()
})
