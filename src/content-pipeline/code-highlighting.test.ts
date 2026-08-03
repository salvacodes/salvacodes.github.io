import { describe, expect, it } from 'vitest'
import { highlightCode } from './code-highlighting'

describe('highlightCode', () => {
  it('marks up tokens with classes for a known language', () => {
    const highlighted = highlightCode('const answer = 42', 'ts')

    expect(highlighted).toContain('class="hljs-')
    expect(highlighted).toContain('answer')
  })

  it('never emits a style attribute, which the content security policy would block', () => {
    const highlighted = highlightCode('body { color: red }', 'css')

    expect(highlighted).not.toContain('style=')
  })

  it('escapes markup inside highlighted code', () => {
    const highlighted = highlightCode('const tag = "<script>"', 'ts')

    expect(highlighted).not.toContain('<script>')
    expect(highlighted).toContain('&lt;script&gt;')
  })

  it('falls back to escaped text for an unknown language', () => {
    expect(highlightCode('<b>x</b>', 'klingon')).toBe('&lt;b&gt;x&lt;/b&gt;')
  })

  it('falls back to escaped text when no language is given', () => {
    expect(highlightCode('<b>x</b>', undefined)).toBe('&lt;b&gt;x&lt;/b&gt;')
  })

  it('resolves language aliases', () => {
    expect(highlightCode('echo hi', 'sh')).toContain('class="hljs-')
  })
})
