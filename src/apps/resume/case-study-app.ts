import { readSelection, standardContentItems } from '../../desktop/context-menu/content-items'
import type { Point } from '../../desktop/context-menu/context-menu-model'
import { requestContextMenu } from '../../desktop/context-menu/context-menu-request'
import { observeLongPress } from '../../desktop/context-menu/long-press'
import styles from './case-study-app.css?inline'
import { textElement } from './dom'
import { resumeContent } from './resume-content'
import type { CaseStudy } from './resume-model'

const sheet = new CSSStyleSheet()
sheet.replaceSync(styles)

export const STUDY_ID_ATTRIBUTE = 'study-id'

const renderFacts = (study: CaseStudy): HTMLElement => {
  const facts = document.createElement('dl')
  facts.className = 'facts'
  const pairs: Array<[string, string]> = [
    ['Sector', study.sector],
    ['Scale', study.scale],
    ['Constraint', study.constraint]
  ]
  for (const [label, value] of pairs) {
    facts.append(textElement('dt', 'fact-label', label), textElement('dd', 'fact-value', value))
  }
  return facts
}

const renderList = (className: string, heading: string, items: string[]): HTMLElement => {
  const section = document.createElement('section')
  section.append(textElement('h3', 'section-heading', heading))
  const list = document.createElement('ul')
  for (const item of items) {
    list.append(textElement('li', className, item))
  }
  section.append(list)
  return section
}

const renderNotFound = (): HTMLElement => textElement('p', 'not-found', 'That case study is not available.')

export class CaseStudyApp extends HTMLElement {
  static observedAttributes = [STUDY_ID_ATTRIBUTE]

  connectedCallback(): void {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: 'open' })
      root.adoptedStyleSheets = [sheet]
      this.addEventListener('contextmenu', (event) => {
        event.preventDefault()
        this.#requestMenu({ x: event.clientX, y: event.clientY }, event.composedPath()[0] as Element | null)
      })
      observeLongPress(this, (point) => this.#requestMenu(point, null))
    }
    this.#render()
  }

  #requestMenu(anchor: Point, target: Element | null): void {
    const root = this.shadowRoot
    if (!root) {
      return
    }
    requestContextMenu(this, { anchor, entries: standardContentItems(target, readSelection(root)) })
  }

  attributeChangedCallback(): void {
    this.#render()
  }

  #render(): void {
    const root = this.shadowRoot
    if (!root) {
      return
    }
    const study = resumeContent.caseStudies.find((candidate) => candidate.id === this.getAttribute(STUDY_ID_ATTRIBUTE))
    if (!study) {
      root.replaceChildren(renderNotFound())
      return
    }
    root.replaceChildren(
      textElement('h2', 'study-title', study.title),
      renderFacts(study),
      renderList('decision', 'Decisions', study.decisions),
      textElement('p', 'outcome', study.outcome),
      renderList('redaction', 'Withheld under NDA', study.redactions)
    )
  }
}

customElements.define('sc-case-study-app', CaseStudyApp)
