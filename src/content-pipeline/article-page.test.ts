import { describe, expect, it } from 'vitest'
import { renderArticlePage } from './article-page'
import type { Post } from './post-collection'

const site = { origin: 'https://salva.codes', articleStylesheetHref: '/assets/article-abc.css' }

const post: Post = {
  slug: 'switching',
  title: 'Why I switched to "security"',
  date: '2026-07-12',
  summary: 'What changed, & what did not.',
  tags: ['career', 'security'],
  readingMinutes: 8,
  isDraft: false,
  html: '<p>The body.</p>'
}

const head = (): string => renderArticlePage(post, site).headMarkup
const body = (): string => renderArticlePage(post, site).bodyMarkup

describe('renderArticlePage', () => {
  it('titles the page with the post and the site', () => {
    expect(renderArticlePage(post, site).title).toContain('Why I switched to')
    expect(renderArticlePage(post, site).title).toContain('salva.codes')
  })

  describe('head', () => {
    it('describes the post for search results and link previews', () => {
      expect(head()).toContain('<meta name="description" content="What changed, &amp; what did not.">')
      expect(head()).toContain('property="og:description"')
      expect(head()).toContain('content="article"')
    })

    it('points at itself as the canonical address', () => {
      expect(head()).toContain('<link rel="canonical" href="https://salva.codes/writing/switching/">')
      expect(head()).toContain('property="og:url" content="https://salva.codes/writing/switching/"')
    })

    it('escapes quotes so a title cannot break out of an attribute', () => {
      expect(head()).toContain('&quot;security&quot;')
      expect(head()).not.toMatch(/content="[^"]*"security"/)
    })

    it('publishes the date in a machine readable form', () => {
      expect(head()).toContain('"article:published_time" content="2026-07-12"')
    })

    it('links the article stylesheet', () => {
      expect(head()).toContain('<link rel="stylesheet" href="/assets/article-abc.css">')
    })

    it('offers the feed', () => {
      expect(head()).toContain('type="application/atom+xml"')
      expect(head()).toContain('href="/feed.xml"')
    })
  })

  describe('body', () => {
    it('wraps the article in the element the desktop hands over from', () => {
      expect(body()).toContain('id="prerendered-article"')
    })

    it('leads with the post title as the only top level heading', () => {
      expect(body().match(/<h1/g)).toHaveLength(1)
      expect(body()).toContain('Why I switched to &quot;security&quot;')
    })

    it('states the date and the reading time', () => {
      expect(body()).toContain('<time datetime="2026-07-12">12 July 2026</time>')
      expect(body()).toContain('8 min read')
    })

    it('lists the tags', () => {
      expect(body()).toContain('career')
      expect(body()).toContain('security')
    })

    it('carries the rendered post', () => {
      expect(body()).toContain('<p>The body.</p>')
    })

    it('links back to the archive and the desktop', () => {
      expect(body()).toContain('href="/writing/"')
      expect(body()).toContain('href="/"')
    })
  })
})
