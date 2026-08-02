import { afterEach, expect, it } from 'vitest'
import '../../theme/tokens.css'
import './resume-app'
import type { ResumeApp } from './resume-app'

const mount = () => {
  const app = document.createElement('sc-resume-app')
  document.body.append(app)
  return app
}

const shadow = (app: Element): ShadowRoot => app.shadowRoot!

const sidebarButtons = (app: Element) => [
  ...shadow(app).querySelectorAll<HTMLButtonElement>('.sidebar button[data-section-id]')
]

const selectSection = (app: Element, sectionId: string) => {
  sidebarButtons(app)
    .find((button) => button.dataset.sectionId === sectionId)!
    .click()
}

afterEach(() => {
  document.body.replaceChildren()
})

it('lists the available sections in the sidebar', () => {
  const app = mount()
  expect(sidebarButtons(app).map((button) => button.dataset.sectionId)).toEqual([
    'career',
    'skills',
    'case-studies',
    'site'
  ])
})

it('opens on the career timeline', () => {
  const app = mount()
  const selected = shadow(app).querySelector('.sidebar button[aria-current="page"]')
  expect(selected?.getAttribute('data-section-id')).toBe('career')
  expect(shadow(app).querySelectorAll('.pane details.stage').length).toBeGreaterThan(0)
})

it('swaps the pane when another section is selected', () => {
  const app = mount()
  selectSection(app, 'skills')
  expect(shadow(app).querySelector('.pane details.stage')).toBeNull()
  expect(shadow(app).querySelector('.pane .skill-group')).not.toBeNull()
})

it('marks the selected sidebar entry as current', () => {
  const app = mount()
  selectSection(app, 'site')
  const current = shadow(app).querySelectorAll('.sidebar button[aria-current="page"]')
  expect(current).toHaveLength(1)
  expect(current[0]?.getAttribute('data-section-id')).toBe('site')
})

it('an evidence chip navigates to its stage and expands it', () => {
  const app = mount()
  selectSection(app, 'skills')
  const chip = shadow(app).querySelector<HTMLButtonElement>('.evidence-chip')!
  const stageId = chip.dataset.stageId!
  chip.click()
  const selected = shadow(app).querySelector('.sidebar button[aria-current="page"]')
  expect(selected?.getAttribute('data-section-id')).toBe('career')
  const stage = shadow(app).querySelector<HTMLDetailsElement>(`details.stage[data-stage-id="${stageId}"]`)!
  expect(stage.open).toBe(true)
})

it('leaves the other stages collapsed when navigating from a chip', () => {
  const app = mount()
  selectSection(app, 'skills')
  shadow(app).querySelector<HTMLButtonElement>('.evidence-chip')!.click()
  const expanded = [...shadow(app).querySelectorAll<HTMLDetailsElement>('details.stage')].filter((s) => s.open)
  expect(expanded).toHaveLength(1)
})

it('requests a case study window when an opener is clicked', () => {
  const app = mount()
  const events: CustomEvent[] = []
  document.addEventListener('app-activate', (event) => events.push(event as CustomEvent), { once: true })
  selectSection(app, 'case-studies')
  const opener = shadow(app).querySelector<HTMLButtonElement>('.case-study-opener')!
  opener.click()
  expect(events).toHaveLength(1)
  expect(events[0]?.detail.appId).toBe('case-study')
  expect(events[0]?.detail.params['study-id']).toBe(opener.dataset.studyId)
  expect(typeof events[0]?.detail.title).toBe('string')
})

it('omits a section with no entries from the sidebar', () => {
  const app = mount()
  const emptyContent = { stages: [], skills: [], caseStudies: [], site: { posture: [], repoUrl: 'https://x.test' } }
  ;(app as ResumeApp).content = emptyContent
  expect(sidebarButtons(app).map((button) => button.dataset.sectionId)).toEqual(['site'])
  const selected = shadow(app).querySelector('.sidebar button[aria-current="page"]')
  expect(selected?.getAttribute('data-section-id')).toBe('site')
})

it('offers a print action that emits a printable document', () => {
  const app = mount()
  const events: CustomEvent[] = []
  document.addEventListener('print-document', (event) => events.push(event as CustomEvent), { once: true })
  shadow(app).querySelector<HTMLButtonElement>('.print-action')!.click()
  expect(events).toHaveLength(1)
  const host = document.createElement('div')
  host.append(events[0]!.detail.fragment)
  expect(host.querySelector('.print-footer')).not.toBeNull()
})
