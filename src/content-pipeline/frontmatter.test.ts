import { describe, expect, it } from 'vitest'
import { parseFrontmatter } from './frontmatter'

const document = (...lines: string[]): string => lines.join('\n')

const validDocument = document(
  '---',
  'title: Why I switched to security',
  'date: 2026-07-12',
  'summary: What changed, and what did not.',
  'tags: [career, security]',
  'draft: true',
  '---',
  '',
  'First paragraph.'
)

describe('parseFrontmatter', () => {
  it('reads every declared field', () => {
    const { frontmatter } = parseFrontmatter(validDocument, 'switching/index.md')

    expect(frontmatter).toEqual({
      title: 'Why I switched to security',
      date: '2026-07-12',
      summary: 'What changed, and what did not.',
      tags: ['career', 'security'],
      isDraft: true
    })
  })

  it('returns the body without the frontmatter block', () => {
    const { body } = parseFrontmatter(validDocument, 'switching/index.md')

    expect(body).toBe('\nFirst paragraph.')
  })

  it('keeps horizontal rules that appear in the body', () => {
    const source = document('---', 'title: T', 'date: 2026-01-01', 'summary: S', '---', 'Above', '---', 'Below')

    expect(parseFrontmatter(source, 'post/index.md').body).toBe('Above\n---\nBelow')
  })

  it('defaults tags to empty and draft to false', () => {
    const source = document('---', 'title: T', 'date: 2026-01-01', 'summary: S', '---', 'Body')

    expect(parseFrontmatter(source, 'post/index.md').frontmatter).toMatchObject({ tags: [], isDraft: false })
  })

  it('accepts an empty tag list', () => {
    const source = document('---', 'title: T', 'date: 2026-01-01', 'summary: S', 'tags: []', '---', 'Body')

    expect(parseFrontmatter(source, 'post/index.md').frontmatter.tags).toEqual([])
  })

  it('strips quotes wrapping a value', () => {
    const source = document('---', 'title: "T: with colon"', 'date: 2026-01-01', "summary: 'S'", '---', 'Body')

    expect(parseFrontmatter(source, 'post/index.md').frontmatter).toMatchObject({
      title: 'T: with colon',
      summary: 'S'
    })
  })

  it('rejects a document without a frontmatter block', () => {
    expect(() => parseFrontmatter('Just a body', 'post/index.md')).toThrow(/post\/index\.md.*frontmatter/i)
  })

  it('rejects an unterminated frontmatter block', () => {
    expect(() => parseFrontmatter(document('---', 'title: T', 'Body'), 'post/index.md')).toThrow(
      /post\/index\.md.*frontmatter/i
    )
  })

  it('names the missing field', () => {
    const source = document('---', 'title: T', 'date: 2026-01-01', '---', 'Body')

    expect(() => parseFrontmatter(source, 'post/index.md')).toThrow(/post\/index\.md.*summary/)
  })

  it('rejects an empty required value', () => {
    const source = document('---', 'title:', 'date: 2026-01-01', 'summary: S', '---', 'Body')

    expect(() => parseFrontmatter(source, 'post/index.md')).toThrow(/post\/index\.md.*title/)
  })

  it('rejects an unknown field so typos fail the build', () => {
    const source = document('---', 'title: T', 'date: 2026-01-01', 'summary: S', 'tag: career', '---', 'Body')

    expect(() => parseFrontmatter(source, 'post/index.md')).toThrow(/post\/index\.md.*tag/)
  })

  it('rejects a repeated field', () => {
    const source = document('---', 'title: T', 'title: U', 'date: 2026-01-01', 'summary: S', '---', 'Body')

    expect(() => parseFrontmatter(source, 'post/index.md')).toThrow(/post\/index\.md.*title/)
  })

  it('rejects a line that is not a key-value pair', () => {
    const source = document('---', 'title: T', 'nonsense', 'date: 2026-01-01', 'summary: S', '---', 'Body')

    expect(() => parseFrontmatter(source, 'post/index.md')).toThrow(/post\/index\.md/)
  })

  it.each(['12-07-2026', '2026-7-12', '2026-13-01', '2026-02-30', 'yesterday'])('rejects the date %s', (date) => {
    const source = document('---', 'title: T', `date: ${date}`, 'summary: S', '---', 'Body')

    expect(() => parseFrontmatter(source, 'post/index.md')).toThrow(/post\/index\.md.*date/)
  })

  it.each(['[Career]', '[web dev]', '[sec,]', '[.hidden]'])('rejects the tag list %s', (tags) => {
    const source = document('---', 'title: T', 'date: 2026-01-01', 'summary: S', `tags: ${tags}`, '---', 'Body')

    expect(() => parseFrontmatter(source, 'post/index.md')).toThrow(/post\/index\.md.*tag/i)
  })

  it('rejects a tag list without brackets', () => {
    const source = document('---', 'title: T', 'date: 2026-01-01', 'summary: S', 'tags: career', '---', 'Body')

    expect(() => parseFrontmatter(source, 'post/index.md')).toThrow(/post\/index\.md.*tag/i)
  })

  it.each(['yes', 'True', '1'])('rejects the draft value %s', (draft) => {
    const source = document('---', 'title: T', 'date: 2026-01-01', 'summary: S', `draft: ${draft}`, '---', 'Body')

    expect(() => parseFrontmatter(source, 'post/index.md')).toThrow(/post\/index\.md.*draft/)
  })

  it('ignores blank lines inside the block', () => {
    const source = document('---', 'title: T', '', 'date: 2026-01-01', 'summary: S', '---', 'Body')

    expect(parseFrontmatter(source, 'post/index.md').frontmatter.title).toBe('T')
  })
})
