import { afterEach, expect, it, vi } from 'vitest'
import '../../theme/tokens.css'
import type { PostSummary } from './post-model'
import { WRITING_NAVIGATE_EVENT, WRITING_SELECTED_EVENT } from './writing-events'
import './writings-app'
import { POST_SLUG_ATTRIBUTE, type WritingsApp } from './writings-app'

const summaries: PostSummary[] = [
  {
    slug: 'newer',
    title: 'The newer post',
    date: '2026-07-12',
    displayDate: '12 July 2026',
    summary: 'About the newer thing.',
    tags: ['security', 'career'],
    readingMinutes: 8
  },
  {
    slug: 'older',
    title: 'The older post',
    date: '2025-05-04',
    displayDate: '4 May 2025',
    summary: 'About the older thing.',
    tags: ['security'],
    readingMinutes: 3
  }
]

const bodies: Record<string, string> = {
  newer: '<p>Body of the newer post.</p><p><a href="/writing/older/">the older post</a></p>',
  older: '<p>Body of the older post.</p>'
}

const mount = (slug?: string): WritingsApp => {
  const app = document.createElement('sc-writings-app') as WritingsApp
  app.posts = summaries
  app.postLoader = (wanted) => Promise.resolve(bodies[wanted])
  if (slug !== undefined) {
    app.setAttribute(POST_SLUG_ATTRIBUTE, slug)
  }
  document.body.append(app)
  return app
}

const listEntries = (app: WritingsApp): HTMLButtonElement[] => [
  ...(app.shadowRoot?.querySelectorAll<HTMLButtonElement>('.post-entry') ?? [])
]

const paneText = (app: WritingsApp): string => app.shadowRoot?.querySelector('.pane')?.textContent ?? ''

afterEach(() => {
  document.body.replaceChildren()
})

it('lists every post in the order it was given', () => {
  const app = mount()

  expect(listEntries(app).map((entry) => entry.dataset.slug)).toEqual(['newer', 'older'])
})

it('shows the title, date and reading time of each post', () => {
  const app = mount()
  const entry = listEntries(app)[0]

  expect(entry?.textContent).toContain('The newer post')
  expect(entry?.textContent).toContain('12 July 2026')
  expect(entry?.textContent).toContain('8 min')
})

it('invites the reader to pick a post when none is open', () => {
  expect(paneText(mount())).toMatch(/pick a post/i)
})

it('opens the post named by the attribute', async () => {
  const app = mount('older')

  await vi.waitFor(() => expect(paneText(app)).toContain('Body of the older post.'))
  expect(paneText(app)).toContain('The older post')
})

it('opens a post chosen from the list', async () => {
  const app = mount()

  listEntries(app)[0]?.click()

  await vi.waitFor(() => expect(paneText(app)).toContain('Body of the newer post.'))
})

it('marks the open post in the list', async () => {
  const app = mount()

  listEntries(app)[1]?.click()

  await vi.waitFor(() => expect(listEntries(app)[1]?.getAttribute('aria-current')).toBe('true'))
  expect(listEntries(app)[0]?.getAttribute('aria-current')).toBeNull()
})

it('announces the post it opened so the address bar can follow', () => {
  const app = mount()
  const announced: string[] = []
  app.addEventListener(WRITING_SELECTED_EVENT, (event) => {
    announced.push((event as CustomEvent<{ slug?: string }>).detail.slug ?? '')
  })

  listEntries(app)[1]?.click()

  expect(announced).toEqual(['older'])
})

it('says so when the post does not exist instead of throwing', () => {
  expect(paneText(mount('no-such-post'))).toMatch(/not/i)
})

it('narrows the list to a tag', () => {
  const app = mount()

  app.shadowRoot?.querySelector<HTMLButtonElement>('.tag-filter[data-tag="career"]')?.click()

  expect(listEntries(app).map((entry) => entry.dataset.slug)).toEqual(['newer'])
})

it('restores the whole list when the tag is cleared', () => {
  const app = mount()

  app.shadowRoot?.querySelector<HTMLButtonElement>('.tag-filter[data-tag="career"]')?.click()
  app.shadowRoot?.querySelector<HTMLButtonElement>('.tag-filter[data-tag=""]')?.click()

  expect(listEntries(app)).toHaveLength(2)
})

it('offers only the tags its posts carry', () => {
  const app = mount()
  const tags = [...(app.shadowRoot?.querySelectorAll<HTMLButtonElement>('.tag-filter') ?? [])]

  expect(tags.map((tag) => tag.dataset.tag)).toEqual(['', 'career', 'security'])
})

it('follows a navigation asked for by the address bar', async () => {
  const app = mount()

  window.dispatchEvent(new CustomEvent(WRITING_NAVIGATE_EVENT, { detail: { slug: 'older' } }))

  await vi.waitFor(() => expect(paneText(app)).toContain('Body of the older post.'))
})

it('stops listening to the address bar once it is closed', async () => {
  const app = mount()
  app.remove()

  window.dispatchEvent(new CustomEvent(WRITING_NAVIGATE_EVENT, { detail: { slug: 'older' } }))

  await Promise.resolve()
  expect(app.getAttribute(POST_SLUG_ATTRIBUTE)).toBeNull()
})

it('keeps a link between posts inside the desktop', async () => {
  const app = mount('newer')
  await vi.waitFor(() => expect(paneText(app)).toContain('the older post'))

  app.shadowRoot?.querySelector<HTMLAnchorElement>('.article-body a')?.click()

  await vi.waitFor(() => expect(paneText(app)).toContain('Body of the older post.'))
})
