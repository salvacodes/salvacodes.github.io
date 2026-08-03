import { commonHeadMarkup, metaTag, renderPostDate, renderTags } from './article-page'
import { escapeHtml } from './html-escaping'
import type { PageContent } from './page-shell'
import type { Post } from './post-collection'
import { ARCHIVE_PATH, postPath, SITE_NAME, type SiteContext } from './site-context'

const ARCHIVE_TITLE = 'Writings'
const ARCHIVE_DESCRIPTION = 'Notes on engineering, security and leading teams, by Salva.'

const renderEntry = (post: Post): string =>
  [
    '<li class="archive-entry">',
    `<p class="article-meta">${renderPostDate(post)} · ${post.readingMinutes} min read</p>`,
    `<h2 class="archive-entry-title"><a href="${postPath(post.slug)}">${escapeHtml(post.title)}</a></h2>`,
    `<p class="archive-entry-summary">${escapeHtml(post.summary)}</p>`,
    renderTags(post.tags),
    '</li>'
  ].join('')

const renderEntries = (posts: Post[]): string =>
  posts.length === 0
    ? '<p class="archive-empty">Nothing published yet. Come back soon.</p>'
    : `<ul class="archive-list">${posts.map(renderEntry).join('')}</ul>`

export const renderArchivePage = (posts: Post[], site: SiteContext): PageContent => ({
  title: `${ARCHIVE_TITLE} — ${SITE_NAME}`,
  headMarkup: [
    ...commonHeadMarkup(site, ARCHIVE_DESCRIPTION, ARCHIVE_PATH),
    metaTag('property', 'og:type', 'website'),
    metaTag('property', 'og:title', `${ARCHIVE_TITLE} — ${SITE_NAME}`)
  ].join('\n    '),
  bodyMarkup: [
    '<main id="prerendered-article">',
    '<article class="article">',
    '<header class="article-header">',
    '<a class="article-back" href="/">Back to the desktop</a>',
    `<h1 class="article-title">${ARCHIVE_TITLE}</h1>`,
    `<p class="archive-intro">${ARCHIVE_DESCRIPTION}</p>`,
    '</header>',
    renderEntries(posts),
    '</article>',
    '</main>'
  ].join('')
})
