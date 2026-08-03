import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown-renderer'

const render = (markdown: string): string =>
  renderMarkdown(markdown, { slug: 'switching', sourceName: 'switching/index.md' })

describe('renderMarkdown', () => {
  it('renders headings, paragraphs and lists', () => {
    const html = render('## A heading\n\nA paragraph.\n\n- first\n- second')

    expect(html).toContain('<h2>A heading</h2>')
    expect(html).toContain('<p>A paragraph.</p>')
    expect(html).toContain('<li>first</li>')
  })

  it('escapes ampersands and quotes in prose', () => {
    expect(render('Tom & Jerry said "hi"')).toContain('&amp;')
  })

  describe('raw HTML', () => {
    it('escapes a block of raw HTML instead of passing it through', () => {
      const html = render('<script>alert(1)</script>')

      expect(html).not.toContain('<script>')
      expect(html).toContain('&lt;script&gt;')
    })

    it('escapes inline raw HTML', () => {
      const html = render('text with <b onclick="x()">markup</b> inside')

      expect(html).not.toContain('<b ')
      expect(html).toContain('&lt;b onclick=&quot;x()&quot;&gt;')
    })

    it('keeps comparisons in prose readable', () => {
      expect(render('generics like Foo<Bar> appear in prose')).toContain('Foo&lt;Bar&gt;')
    })
  })

  describe('images', () => {
    it('resolves a relative image against the post directory', () => {
      const html = render('![A diagram](diagram.png)')

      expect(html).toContain('src="/writing/switching/diagram.png"')
      expect(html).toContain('alt="A diagram"')
    })

    it('resolves an image in a nested folder', () => {
      expect(render('![x](figures/one.png)')).toContain('src="/writing/switching/figures/one.png"')
    })

    it('lazy loads images', () => {
      expect(render('![x](d.png)')).toContain('loading="lazy"')
    })

    it('escapes the alt text', () => {
      expect(render('![a "quoted" & <tag>](d.png)')).toContain('alt="a &quot;quoted&quot; &amp; &lt;tag&gt;"')
    })

    it('rejects an image hosted elsewhere, which the content security policy would block', () => {
      expect(() => render('![x](https://example.com/d.png)')).toThrow(/switching\/index\.md.*image/i)
    })

    it('rejects an image that escapes the post directory', () => {
      expect(() => render('![x](../other/d.png)')).toThrow(/switching\/index\.md.*image/i)
    })

    it('rejects a root-relative image path', () => {
      expect(() => render('![x](/logo.png)')).toThrow(/switching\/index\.md.*image/i)
    })
  })

  describe('links', () => {
    it('opens an external link in a new tab without leaking the referrer', () => {
      const html = render('[example](https://example.com)')

      expect(html).toContain('target="_blank"')
      expect(html).toContain('rel="noreferrer noopener"')
    })

    it('keeps an internal link in the same tab', () => {
      const html = render('[other post](/writing/other/)')

      expect(html).toContain('href="/writing/other/"')
      expect(html).not.toContain('target=')
    })

    it('keeps an anchor link in the same tab', () => {
      expect(render('[top](#top)')).not.toContain('target=')
    })

    it('rejects a javascript url', () => {
      expect(() => render('[x](javascript:alert(1))')).toThrow(/switching\/index\.md.*link/i)
    })

    it('rejects a data url', () => {
      expect(() => render('[x](data:text/html,<script>)')).toThrow(/switching\/index\.md.*link/i)
    })
  })

  describe('code', () => {
    it('labels a fenced block with its language and highlights it', () => {
      const html = render('```ts\nconst answer = 42\n```')

      expect(html).toContain('<pre><code class="language-ts">')
      expect(html).toContain('class="hljs-')
    })

    it('escapes a fenced block that declares no language', () => {
      const html = render('```\n<not-a-tag>\n```')

      expect(html).toContain('<pre><code>')
      expect(html).toContain('&lt;not-a-tag&gt;')
    })

    it('escapes inline code', () => {
      expect(render('use `<div>` here')).toContain('<code>&lt;div&gt;</code>')
    })
  })
})
