import { postLoaders, postSummaries } from 'virtual:writing-index'
import { readSelection, standardContentItems } from '../../desktop/context-menu/content-items'
import type { Point } from '../../desktop/context-menu/context-menu-model'
import { requestContextMenu } from '../../desktop/context-menu/context-menu-request'
import { observeLongPress } from '../../desktop/context-menu/long-press'
import { POST_SLUG_PARAM, routeFromPath } from '../../routing/post-route'
import postBodyStyles from './post-body.css?inline'
import { collectTags, filterByTag } from './post-filtering'
import { ALL_TAGS, renderPostList, renderTagFilters } from './post-list'
import { createPostLoader, type PostHtmlLoader } from './post-loader'
import type { PostSummary } from './post-model'
import { renderInvitation, renderLoadingBody, renderMissingPost, renderPostBody, renderPostHeader } from './post-view'
import { WRITING_NAVIGATE_EVENT, WRITING_SELECTED_EVENT, type WritingSelectedDetail } from './writing-events'
import styles from './writings-app.css?inline'

const appSheet = new CSSStyleSheet()
appSheet.replaceSync(styles)
const bodySheet = new CSSStyleSheet()
bodySheet.replaceSync(postBodyStyles)

export const POST_SLUG_ATTRIBUTE = POST_SLUG_PARAM

export class WritingsApp extends HTMLElement {
  static observedAttributes = [POST_SLUG_ATTRIBUTE]

  #summaries: PostSummary[] = postSummaries
  #loadPostHtml: PostHtmlLoader = createPostLoader(postLoaders)
  #activeTag: string | undefined
  #sidebar!: HTMLElement
  #pane!: HTMLElement
  #paneRequest = 0
  #navigateListener = (event: Event): void => {
    this.#select((event as CustomEvent<WritingSelectedDetail>).detail?.slug, false)
  }

  set posts(value: PostSummary[]) {
    this.#summaries = value
    this.#render()
  }

  set postLoader(value: PostHtmlLoader) {
    this.#loadPostHtml = value
    this.#render()
  }

  connectedCallback(): void {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: 'open' })
      root.adoptedStyleSheets = [bodySheet, appSheet]
      this.#sidebar = document.createElement('nav')
      this.#sidebar.className = 'sidebar'
      this.#sidebar.setAttribute('aria-label', 'Posts')
      this.#pane = document.createElement('section')
      this.#pane.className = 'pane'
      root.append(this.#sidebar, this.#pane)
      this.#sidebar.addEventListener('click', (event) => this.#onSidebarClick(event))
      this.#pane.addEventListener('click', (event) => this.#onPaneClick(event))
      this.addEventListener('contextmenu', (event) => {
        event.preventDefault()
        this.#requestMenu({ x: event.clientX, y: event.clientY }, event.composedPath()[0] as Element | null)
      })
      observeLongPress(this, (point) => this.#requestMenu(point, null))
    }
    window.addEventListener(WRITING_NAVIGATE_EVENT, this.#navigateListener)
    this.#render()
  }

  disconnectedCallback(): void {
    window.removeEventListener(WRITING_NAVIGATE_EVENT, this.#navigateListener)
  }

  attributeChangedCallback(): void {
    this.#render()
  }

  #requestMenu(anchor: Point, target: Element | null): void {
    const root = this.shadowRoot
    if (root) {
      requestContextMenu(this, { anchor, entries: standardContentItems(target, readSelection(root)) })
    }
  }

  #onSidebarClick(event: Event): void {
    const target = event.target as Element | null
    const entry = target?.closest<HTMLElement>('.post-entry')
    if (entry?.dataset.slug) {
      this.#select(entry.dataset.slug, true)
      return
    }
    const filter = target?.closest<HTMLElement>('.tag-filter')
    if (filter) {
      this.#activeTag = filter.dataset.tag === ALL_TAGS ? undefined : filter.dataset.tag
      this.#render()
    }
  }

  #onPaneClick(event: Event): void {
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]')
    const route = link && routeFromPath(new URL(link.href, window.location.origin).pathname)
    if (!route) {
      return
    }
    event.preventDefault()
    this.#select(route.params[POST_SLUG_PARAM], true)
  }

  #select(slug: string | undefined, announce: boolean): void {
    if (slug) {
      this.setAttribute(POST_SLUG_ATTRIBUTE, slug)
    } else {
      this.removeAttribute(POST_SLUG_ATTRIBUTE)
    }
    if (announce) {
      this.dispatchEvent(
        new CustomEvent<WritingSelectedDetail>(WRITING_SELECTED_EVENT, {
          bubbles: true,
          composed: true,
          detail: { slug }
        })
      )
    }
  }

  #selectedSlug(): string | undefined {
    return this.getAttribute(POST_SLUG_ATTRIBUTE) ?? undefined
  }

  #render(): void {
    if (!this.shadowRoot) {
      return
    }
    this.#renderSidebar()
    this.#renderPane()
  }

  #renderSidebar(): void {
    const selectedSlug = this.#selectedSlug()
    this.#sidebar.replaceChildren(
      renderTagFilters(collectTags(this.#summaries), this.#activeTag),
      renderPostList(filterByTag(this.#summaries, this.#activeTag), selectedSlug)
    )
  }

  #renderPane(): void {
    const request = ++this.#paneRequest
    const slug = this.#selectedSlug()
    if (!slug) {
      this.#pane.replaceChildren(renderInvitation())
      return
    }
    const summary = this.#summaries.find((candidate) => candidate.slug === slug)
    if (!summary) {
      this.#pane.replaceChildren(renderMissingPost(slug))
      return
    }
    this.#pane.replaceChildren(renderPostHeader(summary), renderLoadingBody())
    this.#loadPostHtml(slug).then((html) => {
      if (request !== this.#paneRequest) {
        return
      }
      this.#pane.replaceChildren(
        renderPostHeader(summary),
        html === undefined ? renderMissingPost(slug) : renderPostBody(html)
      )
    })
  }
}

customElements.define('sc-writings-app', WritingsApp)
