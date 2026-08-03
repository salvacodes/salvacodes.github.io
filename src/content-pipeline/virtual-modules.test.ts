import { describe, expect, it } from 'vitest'
import type { Post } from './post-collection'
import { renderIndexModule, renderPostModule, toSummary, WRITING_POST_PREFIX } from './virtual-modules'

const post = (slug: string, overrides: Partial<Post> = {}): Post => ({
  slug,
  title: `Post ${slug}`,
  date: '2026-07-12',
  summary: 'A summary.',
  tags: ['security'],
  readingMinutes: 4,
  isDraft: false,
  html: '<p>Body.</p>',
  ...overrides
})

describe('toSummary', () => {
  it('carries what a list needs and leaves the body behind', () => {
    const summary = toSummary(post('switching'))

    expect(summary).toEqual({
      slug: 'switching',
      title: 'Post switching',
      date: '2026-07-12',
      displayDate: '12 July 2026',
      summary: 'A summary.',
      tags: ['security'],
      readingMinutes: 4
    })
    expect(summary).not.toHaveProperty('html')
  })
})

describe('renderIndexModule', () => {
  it('exports the summaries as data', () => {
    const source = renderIndexModule([post('switching')])

    expect(source).toContain('export const postSummaries')
    expect(source).toContain('"slug": "switching"')
    expect(source).toContain('"displayDate": "12 July 2026"')
  })

  it('exports one lazy import per post so bodies load on demand', () => {
    const source = renderIndexModule([post('one'), post('two')])

    expect(source).toContain(`"one": () => import("${WRITING_POST_PREFIX}one")`)
    expect(source).toContain(`"two": () => import("${WRITING_POST_PREFIX}two")`)
  })

  it('stays valid with nothing published', () => {
    const source = renderIndexModule([])

    expect(source).toContain('export const postSummaries = []')
    expect(source).toContain('export const postLoaders = {}')
  })

  it('encodes text that would otherwise break the module', () => {
    const source = renderIndexModule([post('quoted', { title: 'A "quoted" \\ title' })])

    expect(source).toContain(String.raw`A \"quoted\" \\ title`)
  })
})

describe('renderPostModule', () => {
  it('exports the rendered body', () => {
    expect(renderPostModule(post('switching'))).toBe('export const html = "<p>Body.</p>"\n')
  })

  it('encodes markup that would otherwise break the module', () => {
    const source = renderPostModule(post('switching', { html: '<p>a "b" \\ c</p>' }))

    expect(source).toContain(String.raw`a \"b\" \\ c`)
  })
})
