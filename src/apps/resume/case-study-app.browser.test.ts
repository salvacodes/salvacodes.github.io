import { afterEach, expect, it, vi } from 'vitest'
import '../../theme/tokens.css'
import { CONTEXT_MENU_EVENT, type ContextMenuDetail } from '../../desktop/context-menu/context-menu-request'
import { LONG_PRESS_DURATION_MS } from '../../desktop/context-menu/long-press'
import './case-study-app'
import { resumeContent } from './resume-content'
import type { CaseStudy } from './resume-model'

const mount = (studyId?: string) => {
  const app = document.createElement('sc-case-study-app')
  if (studyId !== undefined) {
    app.setAttribute('study-id', studyId)
  }
  document.body.append(app)
  return app
}

const buildStudy = (overrides: Partial<CaseStudy>): CaseStudy => ({
  id: 'chronology-test-study',
  title: 'A constructed study',
  problem: 'A problem worth studying.',
  constraint: 'A constraint worth naming.',
  decisions: ['A decision.'],
  outcome: 'An outcome.',
  reflection: 'A reflection.',
  evidence: [],
  redactions: ['Client identity'],
  ...overrides
})

const withCaseStudy = (study: CaseStudy, run: (app: HTMLElement) => void): void => {
  resumeContent.caseStudies.push(study)
  try {
    run(mount(study.id))
  } finally {
    resumeContent.caseStudies.pop()
  }
}

afterEach(() => {
  document.body.replaceChildren()
})

it('renders the requested case study', () => {
  const study = resumeContent.caseStudies[0]!
  const app = mount(study.id)
  const text = app.shadowRoot?.textContent ?? ''
  expect(text).toContain(study.title)
  expect(text).toContain(study.problem)
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

it('renders the reflection text', () => {
  const study = resumeContent.caseStudies[0]!
  const app = mount(study.id)
  expect(app.shadowRoot?.querySelector('.reflection')?.textContent).toBe(study.reflection)
})

it('renders the withheld-items heading', () => {
  const study = resumeContent.caseStudies[0]!
  const app = mount(study.id)
  const headings = [...(app.shadowRoot?.querySelectorAll('.section-heading') ?? [])].map((el) => el.textContent)
  expect(headings).toContain('Withheld')
})

it('marks a placeholder case study as draft, and leaves a written one unmarked', () => {
  withCaseStudy(buildStudy({ id: 'draft-chronology-test-study', isPlaceholder: true }), (app) => {
    expect(app.shadowRoot?.querySelector('.draft')).not.toBeNull()
  })
  withCaseStudy(buildStudy({ id: 'written-chronology-test-study' }), (app) => {
    expect(app.shadowRoot?.querySelector('.draft')).toBeNull()
  })
})

it('shows a not-found state for an unknown study instead of throwing', () => {
  const app = mount('no-such-study')
  expect(app.shadowRoot?.querySelector('.not-found')).not.toBeNull()
})

it('shows a not-found state when no study is requested', () => {
  const app = mount()
  expect(app.shadowRoot?.querySelector('.not-found')).not.toBeNull()
})

const captureMenuRequest = (): (() => ContextMenuDetail | undefined) => {
  let detail: ContextMenuDetail | undefined
  document.addEventListener(
    CONTEXT_MENU_EVENT,
    (event) => {
      detail = (event as CustomEvent<ContextMenuDetail>).detail
    },
    { once: true }
  )
  return () => detail
}

const entryIds = (detail: ContextMenuDetail | undefined): string[] =>
  (detail?.entries ?? []).filter((entry) => 'id' in entry).map((entry) => ('id' in entry ? entry.id : ''))

it('offers the shared content actions on right-click instead of the native menu', () => {
  const study = resumeContent.caseStudies[0]!
  const app = mount(study.id)
  const requested = captureMenuRequest()
  const event = new MouseEvent('contextmenu', {
    bubbles: true,
    composed: true,
    cancelable: true,
    clientX: 12,
    clientY: 34
  })
  app.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(true)
  expect(requested()?.anchor).toEqual({ x: 12, y: 34 })
  expect(entryIds(requested())).toEqual(['copy', 'paste'])
})

it('detects a link right-clicked inside its shadow content', () => {
  const study = resumeContent.caseStudies[0]!
  const app = mount(study.id)
  const anchor = document.createElement('a')
  anchor.href = 'https://example.test/case'
  app.shadowRoot?.append(anchor)
  const requested = captureMenuRequest()
  anchor.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true }))
  expect(entryIds(requested())).toEqual(['copy', 'open-link', 'copy-link', 'paste'])
})

it('opens the same menu on a long press', () => {
  vi.useFakeTimers()
  try {
    const study = resumeContent.caseStudies[0]!
    const app = mount(study.id)
    const requested = captureMenuRequest()
    app.dispatchEvent(
      new PointerEvent('pointerdown', { pointerType: 'touch', clientX: 10, clientY: 20, bubbles: true, pointerId: 1 })
    )
    vi.advanceTimersByTime(LONG_PRESS_DURATION_MS)
    expect(entryIds(requested())).toEqual(['copy', 'paste'])
  } finally {
    vi.useRealTimers()
  }
})
