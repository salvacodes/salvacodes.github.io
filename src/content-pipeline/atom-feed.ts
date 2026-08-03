import { escapeHtml } from './html-escaping'
import type { Post } from './post-collection'
import { ARCHIVE_PATH, FEED_PATH, postPath, SITE_AUTHOR, SITE_NAME } from './site-context'

const BEGINNING_OF_TIME = '1970-01-01'

const asTimestamp = (date: string): string => `${date}T00:00:00Z`

const renderEntry = (post: Post, origin: string): string =>
  [
    '  <entry>',
    `    <id>${origin}${postPath(post.slug)}</id>`,
    `    <title>${escapeHtml(post.title)}</title>`,
    `    <link rel="alternate" href="${origin}${postPath(post.slug)}"/>`,
    `    <updated>${asTimestamp(post.date)}</updated>`,
    `    <summary>${escapeHtml(post.summary)}</summary>`,
    `    <content type="html">${escapeHtml(post.html)}</content>`,
    '  </entry>'
  ].join('\n')

export const renderAtomFeed = (posts: Post[], origin: string): string => {
  const latest =
    posts
      .map((post) => post.date)
      .sort()
      .at(-1) ?? BEGINNING_OF_TIME
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <title>${SITE_NAME} — Writings</title>`,
    `  <id>${origin}${ARCHIVE_PATH}</id>`,
    `  <link rel="self" href="${origin}${FEED_PATH}"/>`,
    `  <link rel="alternate" href="${origin}${ARCHIVE_PATH}"/>`,
    `  <updated>${asTimestamp(latest)}</updated>`,
    `  <author><name>${SITE_AUTHOR}</name></author>`,
    ...posts.map((post) => renderEntry(post, origin)),
    '</feed>',
    ''
  ].join('\n')
}
