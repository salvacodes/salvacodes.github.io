import { describe, expect, it } from 'vitest'
import { articleStylesheet } from './article-stylesheet'

describe('articleStylesheet', () => {
  it('styles the page around the article', () => {
    expect(articleStylesheet()).toContain('#prerendered-article')
  })

  it('styles the post body the same way the app does', () => {
    expect(articleStylesheet()).toContain('.article-body pre')
  })

  it('carries the syntax colours, which the app and the page share', () => {
    expect(articleStylesheet()).toContain('.hljs-keyword')
  })

  it('never needs an inline style, which the content security policy would block', () => {
    expect(articleStylesheet()).not.toContain('style=')
  })
})
