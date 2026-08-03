import { describe, expect, it } from 'vitest'
import { renderArchivePage } from './archive-page'
import type { Post } from './post-collection'

const site = { origin: 'https://salva.codes', articleStylesheetHref: '/assets/article-abc.css' }

const post = (slug: string, title: string, date: string): Post => ({
  slug,
  title,
  date,
  summary: `About ${title}.`,
  tags: ['security'],
  readingMinutes: 4,
  isDraft: false,
  html: '<p>Body.</p>'
})

const posts = [post('newer', 'Newer post', '2026-07-12'), post('older', 'Older post', '2025-05-04')]

describe('renderArchivePage', () => {
  it('titles the page as the writing archive', () => {
    expect(renderArchivePage(posts, site).title).toContain('Writings')
  })

  it('points at itself as the canonical address', () => {
    expect(renderArchivePage(posts, site).headMarkup).toContain(
      '<link rel="canonical" href="https://salva.codes/writing/">'
    )
  })

  it('links every post in the order it was given', () => {
    const body = renderArchivePage(posts, site).bodyMarkup

    expect(body.indexOf('/writing/newer/')).toBeLessThan(body.indexOf('/writing/older/'))
    expect(body).toContain('Newer post')
    expect(body).toContain('Older post')
  })

  it('shows each date and summary', () => {
    const body = renderArchivePage(posts, site).bodyMarkup

    expect(body).toContain('<time datetime="2026-07-12">12 July 2026</time>')
    expect(body).toContain('About Newer post.')
  })

  it('hands over to the desktop like an article page does', () => {
    expect(renderArchivePage(posts, site).bodyMarkup).toContain('id="prerendered-article"')
  })

  it('says so when nothing is published yet', () => {
    expect(renderArchivePage([], site).bodyMarkup).toMatch(/nothing published yet/i)
  })
})
