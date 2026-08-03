import { describe, expect, it } from 'vitest'
import { collectTags, filterByTag } from './post-filtering'
import type { PostSummary } from './post-model'

const summary = (slug: string, tags: string[]): PostSummary => ({
  slug,
  title: `Post ${slug}`,
  date: '2026-07-12',
  displayDate: '12 July 2026',
  summary: 'A summary.',
  tags,
  readingMinutes: 4
})

const summaries = [summary('one', ['security', 'career']), summary('two', ['security']), summary('three', [])]

describe('collectTags', () => {
  it('lists every tag once, in alphabetical order', () => {
    expect(collectTags(summaries)).toEqual(['career', 'security'])
  })

  it('has nothing to offer when no post is tagged', () => {
    expect(collectTags([summary('one', [])])).toEqual([])
  })
})

describe('filterByTag', () => {
  it('keeps the posts carrying the tag', () => {
    expect(filterByTag(summaries, 'career').map((post) => post.slug)).toEqual(['one'])
  })

  it('keeps every post when no tag is chosen', () => {
    expect(filterByTag(summaries, undefined)).toEqual(summaries)
  })

  it('keeps nothing for a tag no post carries', () => {
    expect(filterByTag(summaries, 'gardening')).toEqual([])
  })
})
