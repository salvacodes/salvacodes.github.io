import { afterEach, expect, it } from 'vitest'
import '../../theme/tokens.css'
import './case-study-app'
import { resumeContent } from './resume-content'

const mount = (studyId?: string) => {
  const app = document.createElement('sc-case-study-app')
  if (studyId !== undefined) {
    app.setAttribute('study-id', studyId)
  }
  document.body.append(app)
  return app
}

afterEach(() => {
  document.body.replaceChildren()
})

it('renders the requested case study', () => {
  const study = resumeContent.caseStudies[0]!
  const app = mount(study.id)
  const text = app.shadowRoot?.textContent ?? ''
  expect(text).toContain(study.title)
  expect(text).toContain(study.sector)
  expect(text).toContain(study.scale)
  expect(text).toContain(study.constraint)
})

it('lists every decision', () => {
  const study = resumeContent.caseStudies[0]!
  expect(study.decisions.length).toBeGreaterThan(0)
  const app = mount(study.id)
  expect(app.shadowRoot?.querySelectorAll('.decision')).toHaveLength(study.decisions.length)
})

it('states what it withholds', () => {
  const study = resumeContent.caseStudies[0]!
  expect(study.redactions.length).toBeGreaterThan(0)
  const app = mount(study.id)
  const redactions = [...(app.shadowRoot?.querySelectorAll('.redaction') ?? [])]
  expect(redactions.map((item) => item.textContent)).toEqual(study.redactions)
})

it('renders the outcome text', () => {
  const study = resumeContent.caseStudies[0]!
  const app = mount(study.id)
  expect(app.shadowRoot?.querySelector('.outcome')?.textContent).toBe(study.outcome)
})

it('renders the withheld-items heading', () => {
  const study = resumeContent.caseStudies[0]!
  const app = mount(study.id)
  const headings = [...(app.shadowRoot?.querySelectorAll('.section-heading') ?? [])].map((el) => el.textContent)
  expect(headings).toContain('Withheld under NDA')
})

it('shows a not-found state for an unknown study instead of throwing', () => {
  const app = mount('no-such-study')
  expect(app.shadowRoot?.querySelector('.not-found')).not.toBeNull()
})

it('shows a not-found state when no study is requested', () => {
  const app = mount()
  expect(app.shadowRoot?.querySelector('.not-found')).not.toBeNull()
})
