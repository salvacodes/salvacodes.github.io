import { describe, expect, it } from 'vitest'
import { renderStandalonePages } from './page-emission'
import type { Post } from './post-collection'

const shell = '<!doctype html><html><head><title>salva.codes</title></head><body></body></html>'
const site = { origin: 'https://salva.codes', articleStylesheetHref: '/assets/article.css' }

const post = (slug: string): Post => ({
  slug,
  title: `Post ${slug}`,
  date: '2026-07-12',
  summary: 'A summary.',
  tags: [],
  readingMinutes: 4,
  isDraft: false,
  html: `<p>Body of ${slug}.</p>`
})

describe('renderStandalonePages', () => {
  it('emits the archive and one page per post', () => {
    const pages = renderStandalonePages([post('one'), post('two')], shell, site)

    expect(pages.map((page) => page.fileName)).toEqual([
      'writing/index.html',
      'writing/one/index.html',
      'writing/two/index.html'
    ])
  })

  it('builds each page from the shell so the desktop can boot over it', () => {
    const [archive] = renderStandalonePages([post('one')], shell, site)

    expect(archive?.source.startsWith('<!doctype html>')).toBe(true)
  })

  it('puts the post body in its own page', () => {
    const pages = renderStandalonePages([post('one')], shell, site)

    expect(pages.at(-1)?.source).toContain('<p>Body of one.</p>')
    expect(pages.at(-1)?.source).toContain('<title>Post one — salva.codes</title>')
  })

  it('emits only the archive when nothing is published', () => {
    expect(renderStandalonePages([], shell, site).map((page) => page.fileName)).toEqual(['writing/index.html'])
  })
})
