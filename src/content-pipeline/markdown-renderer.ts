import { Marked } from 'marked'
import { highlightCode } from './code-highlighting'
import { escapeHtml } from './html-escaping'

export interface MarkdownContext {
  slug: string
  sourceName: string
}

const RELATIVE_ASSET = /^[A-Za-z0-9_-]+(\.[A-Za-z0-9]+)?(\/[A-Za-z0-9_-]+(\.[A-Za-z0-9]+)?)*$/
const EXTERNAL_LINK = /^https?:\/\//
const INTERNAL_LINK = /^[/#]/
const LANGUAGE_NAME = /^[a-z0-9+#-]+$/

const reject = (context: MarkdownContext, detail: string): Error => new Error(`${context.sourceName}: ${detail}`)

const resolveImageSource = (href: string, context: MarkdownContext): string => {
  if (!RELATIVE_ASSET.test(href)) {
    throw reject(context, `image "${href}" must be a file stored next to the post`)
  }
  return `/writing/${context.slug}/${href}`
}

const resolveLinkTarget = (href: string, context: MarkdownContext): string => {
  if (!EXTERNAL_LINK.test(href) && !INTERNAL_LINK.test(href)) {
    throw reject(context, `link "${href}" must be absolute within the site or an http address`)
  }
  return href
}

const resolveLanguage = (info: string | undefined, context: MarkdownContext): string | undefined => {
  const language = info?.trim().split(/\s+/)[0]
  if (!language) {
    return undefined
  }
  if (!LANGUAGE_NAME.test(language)) {
    throw reject(context, `code block language "${language}" is not a language name`)
  }
  return language
}

export const renderMarkdown = (body: string, context: MarkdownContext): string =>
  new Marked({
    renderer: {
      html: (token) => escapeHtml(token.raw),
      image: (token) =>
        `<img src="${resolveImageSource(token.href, context)}" alt="${escapeHtml(token.text)}" loading="lazy">`,
      link(token) {
        const target = resolveLinkTarget(token.href, context)
        const content = this.parser.parseInline(token.tokens)
        const external = EXTERNAL_LINK.test(target) ? ' target="_blank" rel="noreferrer noopener"' : ''
        return `<a href="${escapeHtml(target)}"${external}>${content}</a>`
      },
      code: (token) => {
        const language = resolveLanguage(token.lang, context)
        const openingTag = language ? `<code class="language-${language}">` : '<code>'
        return `<pre>${openingTag}${highlightCode(token.text, language)}</code></pre>`
      }
    }
  }).parse(body, { async: false })
