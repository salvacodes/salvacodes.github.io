import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildPost, collectPosts } from './post-collection'

const postSource = (fields: { title?: string; date?: string; draft?: boolean; body?: string } = {}): string =>
  [
    '---',
    `title: ${fields.title ?? 'A title'}`,
    `date: ${fields.date ?? '2026-01-01'}`,
    'summary: A summary.',
    'tags: [security]',
    ...(fields.draft ? ['draft: true'] : []),
    '---',
    '',
    fields.body ?? 'A body.'
  ].join('\n')

describe('buildPost', () => {
  it('combines frontmatter with rendered markdown', () => {
    const post = buildPost(postSource({ title: 'Switching', body: '## Section' }), 'switching')

    expect(post).toMatchObject({
      slug: 'switching',
      title: 'Switching',
      date: '2026-01-01',
      summary: 'A summary.',
      tags: ['security']
    })
    expect(post.html).toContain('<h2>Section</h2>')
  })

  it('estimates reading time from the word count', () => {
    const body = Array.from({ length: 400 }, () => 'word').join(' ')

    expect(buildPost(postSource({ body }), 'switching').readingMinutes).toBe(2)
  })

  it('never reports less than a minute', () => {
    expect(buildPost(postSource({ body: 'Short.' }), 'switching').readingMinutes).toBe(1)
  })

  it.each(['Switching', 'switching post', 'switching/other', '../switching'])('rejects the slug %s', (slug) => {
    expect(() => buildPost(postSource(), slug)).toThrow(/slug/i)
  })

  it('rejects a body whose rendered HTML breaks the allowlist', () => {
    expect(() => buildPost(postSource({ body: '# A second title' }), 'switching')).toThrow(/h1/)
  })

  it('names the post file when the frontmatter is wrong', () => {
    expect(() => buildPost('no frontmatter here', 'switching')).toThrow(/switching\/index\.md/)
  })
})

describe('collectPosts', () => {
  let contentDirectory = ''

  const writePost = (slug: string, fields: Parameters<typeof postSource>[0] = {}): string => {
    const directory = join(contentDirectory, slug)
    mkdirSync(directory, { recursive: true })
    writeFileSync(join(directory, 'index.md'), postSource(fields))
    return directory
  }

  beforeEach(() => {
    contentDirectory = mkdtempSync(join(tmpdir(), 'writing-'))
  })

  afterEach(() => {
    rmSync(contentDirectory, { recursive: true, force: true })
  })

  it('returns published posts newest first', () => {
    writePost('older', { date: '2025-05-04' })
    writePost('newer', { date: '2026-07-12' })
    writePost('middle', { date: '2026-01-30' })

    expect(collectPosts(contentDirectory, { includeDrafts: false }).map((post) => post.slug)).toEqual([
      'newer',
      'middle',
      'older'
    ])
  })

  it('orders posts sharing a date by slug so builds are reproducible', () => {
    writePost('beta', { date: '2026-01-01' })
    writePost('alpha', { date: '2026-01-01' })

    expect(collectPosts(contentDirectory, { includeDrafts: false }).map((post) => post.slug)).toEqual(['alpha', 'beta'])
  })

  it('leaves drafts out of a published build', () => {
    writePost('published')
    writePost('unfinished', { draft: true })

    expect(collectPosts(contentDirectory, { includeDrafts: false }).map((post) => post.slug)).toEqual(['published'])
  })

  it('keeps drafts when they are asked for', () => {
    writePost('published')
    writePost('unfinished', { draft: true })

    expect(collectPosts(contentDirectory, { includeDrafts: true })).toHaveLength(2)
  })

  it('returns nothing when no post has been written yet', () => {
    expect(collectPosts(join(contentDirectory, 'absent'), { includeDrafts: false })).toEqual([])
  })

  it('ignores stray files next to the post folders', () => {
    writePost('published')
    writeFileSync(join(contentDirectory, 'notes.txt'), 'scratch')

    expect(collectPosts(contentDirectory, { includeDrafts: false })).toHaveLength(1)
  })

  it('reports a post folder with no index.md', () => {
    mkdirSync(join(contentDirectory, 'empty'), { recursive: true })

    expect(() => collectPosts(contentDirectory, { includeDrafts: false })).toThrow(/empty\/index\.md/)
  })

  it('reports an image the post references but does not ship', () => {
    writePost('published', { body: '![missing](diagram.png)' })

    expect(() => collectPosts(contentDirectory, { includeDrafts: false })).toThrow(/diagram\.png/)
  })

  it('accepts an image stored next to the post', () => {
    const directory = writePost('published', { body: '![there](diagram.png)' })
    writeFileSync(join(directory, 'diagram.png'), '')

    expect(collectPosts(contentDirectory, { includeDrafts: false })).toHaveLength(1)
  })
})
