import { escapeHtml } from './html-escaping'
import type { PageContent } from './page-shell'
import type { Post } from './post-collection'
import { formatPostDate } from './post-date'
import { ARCHIVE_PATH, FEED_PATH, postPath, SITE_NAME, type SiteContext } from './site-context'

export const metaTag = (attribute: string, name: string, content: string): string =>
  `<meta ${attribute}="${name}" content="${escapeHtml(content)}">`

export const commonHeadMarkup = (site: SiteContext, description: string, canonicalPath: string): string[] => [
  metaTag('name', 'description', description),
  `<link rel="canonical" href="${site.origin}${canonicalPath}">`,
  metaTag('property', 'og:site_name', SITE_NAME),
  metaTag('property', 'og:description', description),
  metaTag('property', 'og:url', `${site.origin}${canonicalPath}`),
  metaTag('name', 'twitter:card', 'summary'),
  `<link rel="alternate" type="application/atom+xml" title="${SITE_NAME} writings" href="${FEED_PATH}">`,
  `<link rel="stylesheet" href="${site.articleStylesheetHref}">`
]

export const renderTags = (tags: string[]): string =>
  tags.length === 0 ? '' : `<ul class="article-tags">${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join('')}</ul>`

export const renderPostDate = (post: Post): string =>
  `<time datetime="${post.date}">${formatPostDate(post.date)}</time>`

const renderFooter = (): string =>
  [
    '<footer class="article-footer">',
    `<p>Written by ${SITE_NAME}. <a href="/">Open the desktop</a> or <a href="${FEED_PATH}">subscribe to the feed</a>.</p>`,
    '</footer>'
  ].join('')

export const renderArticlePage = (post: Post, site: SiteContext): PageContent => ({
  title: `${post.title} — ${SITE_NAME}`,
  headMarkup: [
    ...commonHeadMarkup(site, post.summary, postPath(post.slug)),
    metaTag('property', 'og:type', 'article'),
    metaTag('property', 'og:title', post.title),
    metaTag('property', 'article:published_time', post.date)
  ].join('\n    '),
  bodyMarkup: [
    '<main id="prerendered-article">',
    '<article class="article">',
    '<header class="article-header">',
    `<a class="article-back" href="${ARCHIVE_PATH}">All writings</a>`,
    `<h1 class="article-title">${escapeHtml(post.title)}</h1>`,
    `<p class="article-meta">${renderPostDate(post)} · ${post.readingMinutes} min read</p>`,
    renderTags(post.tags),
    '</header>',
    `<div class="article-body">${post.html}</div>`,
    '</article>',
    renderFooter(),
    '</main>'
  ].join('')
})
