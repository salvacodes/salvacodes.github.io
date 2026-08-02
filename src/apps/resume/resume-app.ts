import { readSelection, standardContentItems } from '../../desktop/context-menu/content-items'
import type { MenuEntry, Point } from '../../desktop/context-menu/context-menu-model'
import { requestContextMenu } from '../../desktop/context-menu/context-menu-request'
import { observeLongPress } from '../../desktop/context-menu/long-press'
import { PRINT_DOCUMENT_EVENT, type PrintDocumentDetail } from '../../desktop/print-surface'
import { APP_ACTIVATE_EVENT, type AppActivateDetail } from '../app-activation'
import { STUDY_ID_ATTRIBUTE } from './case-study-app'
import { renderPrintableResume } from './printable-resume'
import styles from './resume-app.css?inline'
import { resumeContent } from './resume-content'
import type { ResumeContent } from './resume-model'
import { availableSections } from './resume-sections'

const sheet = new CSSStyleSheet()
sheet.replaceSync(styles)

export class ResumeApp extends HTMLElement {
  #content: ResumeContent = resumeContent
  #selectedSectionId = 'career'
  #sidebar!: HTMLElement
  #pane!: HTMLElement

  get content(): ResumeContent {
    return this.#content
  }

  set content(value: ResumeContent) {
    this.#content = value
    this.#render()
  }

  connectedCallback(): void {
    if (this.shadowRoot) {
      return
    }
    const root = this.attachShadow({ mode: 'open' })
    root.adoptedStyleSheets = [sheet]
    this.#sidebar = document.createElement('nav')
    this.#sidebar.className = 'sidebar'
    this.#sidebar.setAttribute('aria-label', 'Resume sections')
    this.#pane = document.createElement('section')
    this.#pane.className = 'pane'
    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar'
    const printAction = document.createElement('button')
    printAction.type = 'button'
    printAction.className = 'print-action'
    printAction.textContent = 'Print / Save as PDF'
    printAction.addEventListener('click', () => this.#requestPrint())
    toolbar.append(printAction)
    root.append(toolbar, this.#sidebar, this.#pane)
    this.#pane.addEventListener('click', (event) => this.#onPaneClick(event))
    this.#render()
    this.addEventListener('contextmenu', (event) => {
      event.preventDefault()
      this.#requestMenu({ x: event.clientX, y: event.clientY }, event.composedPath()[0] as Element | null)
    })
    observeLongPress(this, (point) => this.#requestMenu(point, null))
  }

  #requestMenu(anchor: Point, target: Element | null): void {
    const root = this.shadowRoot
    if (!root) {
      return
    }
    const entries: MenuEntry[] = [
      ...standardContentItems(target, readSelection(root)),
      { separator: true },
      { id: 'print', label: 'Print Resume…', perform: () => this.#requestPrint() }
    ]
    requestContextMenu(this, { anchor, entries })
  }

  #requestPrint(): void {
    this.dispatchEvent(
      new CustomEvent<PrintDocumentDetail>(PRINT_DOCUMENT_EVENT, {
        bubbles: true,
        composed: true,
        detail: { fragment: renderPrintableResume(this.#content) }
      })
    )
  }

  #onPaneClick(event: Event): void {
    const target = event.target as HTMLElement
    const chip = target.closest<HTMLElement>('.evidence-chip')
    if (chip?.dataset.stageId) {
      this.#revealStage(chip.dataset.stageId)
      return
    }
    const opener = target.closest<HTMLElement>('.case-study-opener')
    if (opener?.dataset.studyId) {
      this.#requestCaseStudy(opener.dataset.studyId)
    }
  }

  #revealStage(stageId: string): void {
    this.#select('career')
    const stage = this.#pane.querySelector<HTMLDetailsElement>(`details.stage[data-stage-id="${stageId}"]`)
    if (!stage) {
      return
    }
    stage.open = true
    stage.scrollIntoView({ block: 'nearest' })
  }

  #requestCaseStudy(studyId: string): void {
    const study = this.#content.caseStudies.find((candidate) => candidate.id === studyId)
    if (!study) {
      return
    }
    this.dispatchEvent(
      new CustomEvent<AppActivateDetail>(APP_ACTIVATE_EVENT, {
        bubbles: true,
        composed: true,
        detail: { appId: 'case-study', params: { [STUDY_ID_ATTRIBUTE]: study.id }, title: study.title }
      })
    )
  }

  #select(sectionId: string): void {
    this.#selectedSectionId = sectionId
    this.#render()
  }

  #render(): void {
    if (!this.shadowRoot) {
      return
    }
    const sections = availableSections(this.#content)
    const selected = sections.find((section) => section.id === this.#selectedSectionId) ?? sections[0]
    this.#sidebar.replaceChildren()
    for (const section of sections) {
      const button = document.createElement('button')
      button.type = 'button'
      button.dataset.sectionId = section.id
      button.textContent = section.label
      if (section === selected) {
        button.setAttribute('aria-current', 'page')
      }
      button.addEventListener('click', () => this.#select(section.id))
      this.#sidebar.append(button)
    }
    this.#pane.replaceChildren()
    if (selected) {
      this.#selectedSectionId = selected.id
      this.#pane.append(selected.render(this.#content))
    }
  }
}

customElements.define('sc-resume-app', ResumeApp)
