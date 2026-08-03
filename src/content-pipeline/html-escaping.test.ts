import { describe, expect, it } from 'vitest'
import { escapeHtml } from './html-escaping'

describe('escapeHtml', () => {
  it('escapes the characters that could open a tag or close an attribute', () => {
    expect(escapeHtml(`<script>alert("x" & 'y')</script>`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot; &amp; &#39;y&#39;)&lt;/script&gt;'
    )
  })

  it('escapes ampersands once', () => {
    expect(escapeHtml('&amp;')).toBe('&amp;amp;')
  })

  it('leaves text without markup untouched', () => {
    expect(escapeHtml('plain text, 1 + 1 = 2')).toBe('plain text, 1 + 1 = 2')
  })
})
