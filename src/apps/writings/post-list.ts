import { textElement } from '../../dom'
import type { PostSummary } from './post-model'

export const ALL_TAGS = ''

export const renderTagFilters = (tags: string[], activeTag: string | undefined): HTMLElement => {
  const filters = document.createElement('div')
  filters.className = 'tag-filters'
  if (tags.length === 0) {
    return filters
  }
  for (const tag of [ALL_TAGS, ...tags]) {
    const filter = document.createElement('button')
    filter.type = 'button'
    filter.className = 'tag-filter'
    filter.dataset.tag = tag
    filter.textContent = tag === ALL_TAGS ? 'All' : tag
    filter.setAttribute('aria-pressed', String((activeTag ?? ALL_TAGS) === tag))
    filters.append(filter)
  }
  return filters
}

const renderEntry = (summary: PostSummary, selectedSlug: string | undefined): HTMLElement => {
  const entry = document.createElement('button')
  entry.type = 'button'
  entry.className = 'post-entry'
  entry.dataset.slug = summary.slug
  if (summary.slug === selectedSlug) {
    entry.setAttribute('aria-current', 'true')
  }
  entry.append(
    textElement('span', 'post-entry-meta', `${summary.displayDate} · ${summary.readingMinutes} min`),
    textElement('span', 'post-entry-title', summary.title),
    textElement('span', 'post-entry-summary', summary.summary)
  )
  return entry
}

export const renderPostList = (summaries: PostSummary[], selectedSlug: string | undefined): HTMLElement => {
  if (summaries.length === 0) {
    return textElement('p', 'post-list-empty', 'No posts here yet.')
  }
  const list = document.createElement('ul')
  list.className = 'post-list'
  for (const summary of summaries) {
    const item = document.createElement('li')
    item.append(renderEntry(summary, selectedSlug))
    list.append(item)
  }
  return list
}
