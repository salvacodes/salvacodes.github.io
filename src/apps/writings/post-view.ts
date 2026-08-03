import { textElement } from '../../dom'
import type { PostSummary } from './post-model'

const renderNotice = (title: string, detail: string): DocumentFragment => {
  const notice = document.createDocumentFragment()
  notice.append(textElement('h2', 'pane-notice-title', title), textElement('p', 'pane-notice', detail))
  return notice
}

export const renderInvitation = (): DocumentFragment =>
  renderNotice('Writings', 'Notes on engineering, security and leading teams. Pick a post from the list.')

export const renderMissingPost = (slug: string): DocumentFragment =>
  renderNotice('Not here', `There is no post at "${slug}". It may have been renamed, or never published.`)

export const renderPostHeader = (summary: PostSummary): HTMLElement => {
  const header = document.createElement('header')
  header.className = 'post-header'
  const time = document.createElement('time')
  time.dateTime = summary.date
  time.textContent = summary.displayDate
  const meta = document.createElement('p')
  meta.className = 'post-meta'
  meta.append(time, document.createTextNode(` · ${summary.readingMinutes} min read`))
  header.append(textElement('h2', 'post-title', summary.title), meta)
  if (summary.tags.length > 0) {
    const tags = document.createElement('ul')
    tags.className = 'post-tags'
    for (const tag of summary.tags) {
      tags.append(textElement('li', 'post-tag', tag))
    }
    header.append(tags)
  }
  return header
}

export const renderLoadingBody = (): HTMLElement => textElement('p', 'pane-loading', 'Loading…')

export const renderPostBody = (html: string): HTMLElement => {
  const body = document.createElement('div')
  body.className = 'article-body'
  body.innerHTML = html
  return body
}
