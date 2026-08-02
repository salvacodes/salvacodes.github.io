import { afterEach, expect, it } from 'vitest'
import { renderSiteArtifact } from './site-artifact'

const site = {
  posture: ['Zero runtime dependencies.', 'Strict Content-Security-Policy.'],
  repoUrl: 'https://github.com/salvacodes/salvacodes.github.io'
}

const mount = () => {
  const host = document.createElement('div')
  host.append(renderSiteArtifact(site))
  document.body.append(host)
  return host
}

afterEach(() => {
  document.body.replaceChildren()
})

it('lists every posture claim', () => {
  const host = mount()
  const claims = host.querySelectorAll('.posture-claim')
  expect([...claims].map((claim) => claim.textContent)).toEqual(site.posture)
})

it('links to the public repository, safely', () => {
  const host = mount()
  const link = host.querySelector<HTMLAnchorElement>('a.repo-link')!
  expect(link.href).toBe(site.repoUrl)
  expect(link.rel).toContain('noopener')
  expect(link.rel).toContain('noreferrer')
  expect(link.target).toBe('_blank')
})
