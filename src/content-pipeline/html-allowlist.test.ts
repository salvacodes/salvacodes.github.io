import { describe, expect, it } from 'vitest'
import { assertAllowedHtml } from './html-allowlist'
import { renderMarkdown } from './markdown-renderer'

const check = (html: string): void => assertAllowedHtml(html, 'switching/index.md')

describe('assertAllowedHtml', () => {
  it('accepts what the renderer produces', () => {
    const html = renderMarkdown(
      [
        '## Heading',
        '',
        'A paragraph with **bold**, a [link](https://example.com) and `code`.',
        '',
        '- item',
        '',
        '> quoted',
        '',
        '![alt](d.png)',
        '',
        '```ts',
        'const answer = 42',
        '```',
        '',
        '| a | b |',
        '| - | - |',
        '| 1 | 2 |'
      ].join('\n'),
      { slug: 'switching', sourceName: 'switching/index.md' }
    )

    expect(() => check(html)).not.toThrow()
  })

  it('accepts an empty document', () => {
    expect(() => check('')).not.toThrow()
  })

  it('rejects a script tag', () => {
    expect(() => check('<p>ok</p><script>alert(1)</script>')).toThrow(/switching\/index\.md.*script/)
  })

  it('rejects an unknown tag', () => {
    expect(() => check('<marquee>hi</marquee>')).toThrow(/switching\/index\.md.*marquee/)
  })

  it('rejects a top-level heading so posts keep one title', () => {
    expect(() => check('<h1>Title</h1>')).toThrow(/switching\/index\.md.*h1/)
  })

  it('rejects an event handler attribute', () => {
    expect(() => check('<p onclick="steal()">hi</p>')).toThrow(/switching\/index\.md.*onclick/)
  })

  it('rejects a style attribute the content security policy would block', () => {
    expect(() => check('<p style="color:red">hi</p>')).toThrow(/switching\/index\.md.*style/)
  })

  it('rejects an attribute that is allowed on another tag', () => {
    expect(() => check('<p href="/x">hi</p>')).toThrow(/switching\/index\.md.*href/)
  })

  it('rejects an image loaded from another origin', () => {
    expect(() => check('<img src="https://example.com/d.png" alt="x">')).toThrow(/switching\/index\.md.*src/)
  })

  it('rejects a javascript url that reached the output', () => {
    expect(() => check('<a href="javascript:alert(1)">x</a>')).toThrow(/switching\/index\.md.*href/)
  })

  it('rejects a stray angle bracket that should have been escaped', () => {
    expect(() => check('<p>1 < 2</p>')).toThrow(/switching\/index\.md/)
  })
})
