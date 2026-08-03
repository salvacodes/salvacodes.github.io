import { describe, expect, it } from 'vitest'
import { renderAtomFeed } from './atom-feed'
import type { Post } from './post-collection'

const origin = 'https://salva.codes'

const post = (slug: string, date: string): Post => ({
  slug,
  title: `Post ${slug}`,
  date,
  summary: 'A summary.',
  tags: ['security'],
  readingMinutes: 4,
  isDraft: false,
  html: '<p>Body & more.</p>'
})

const posts = [post('newer', '2026-07-12'), post('older', '2025-05-04')]

describe('renderAtomFeed', () => {
  it('is an atom document', () => {
    const feed = renderAtomFeed(posts, origin)

    expect(feed.startsWith('<?xml version="1.0" encoding="utf-8"?>')).toBe(true)
    expect(feed).toContain('<feed xmlns="http://www.w3.org/2005/Atom">')
  })

  it('identifies the feed and where it lives', () => {
    const feed = renderAtomFeed(posts, origin)

    expect(feed).toContain('<id>https://salva.codes/writing/</id>')
    expect(feed).toContain('<link rel="self" href="https://salva.codes/feed.xml"/>')
    expect(feed).toContain('<link rel="alternate" href="https://salva.codes/writing/"/>')
  })

  it('is as fresh as its newest post', () => {
    expect(renderAtomFeed(posts, origin)).toContain('<updated>2026-07-12T00:00:00Z</updated>')
  })

  it('carries one entry per post', () => {
    expect(renderAtomFeed(posts, origin).match(/<entry>/g)).toHaveLength(2)
  })

  it('gives each entry an absolute identity and link', () => {
    const feed = renderAtomFeed(posts, origin)

    expect(feed).toContain('<id>https://salva.codes/writing/newer/</id>')
    expect(feed).toContain('<link rel="alternate" href="https://salva.codes/writing/newer/"/>')
  })

  it('escapes the post markup it carries', () => {
    const feed = renderAtomFeed(posts, origin)

    expect(feed).toContain('&lt;p&gt;Body &amp; more.&lt;/p&gt;')
    expect(feed).not.toContain('<p>Body')
  })

  it('stays well formed with nothing published', () => {
    const feed = renderAtomFeed([], origin)

    expect(feed).toContain('<updated>')
    expect(feed).not.toContain('<entry>')
  })
})
