import type { PostSummary } from '../apps/writings/post-model'
import type { Post } from './post-collection'
import { formatPostDate } from './post-date'

export const WRITING_INDEX_MODULE = 'virtual:writing-index'
export const WRITING_POST_PREFIX = 'virtual:writing-post/'

export const toSummary = (post: Post): PostSummary => ({
  slug: post.slug,
  title: post.title,
  date: post.date,
  displayDate: formatPostDate(post.date),
  summary: post.summary,
  tags: post.tags,
  readingMinutes: post.readingMinutes
})

const renderLoaders = (posts: Post[]): string =>
  posts.length === 0
    ? '{}'
    : [
        '{',
        ...posts.map((post) => `  ${JSON.stringify(post.slug)}: () => import("${WRITING_POST_PREFIX}${post.slug}"),`),
        '}'
      ].join('\n')

export const renderIndexModule = (posts: Post[]): string =>
  [
    `export const postSummaries = ${JSON.stringify(posts.map(toSummary), null, 2)}`,
    `export const postLoaders = ${renderLoaders(posts)}`,
    ''
  ].join('\n')

export const renderPostModule = (post: Post): string => `export const html = ${JSON.stringify(post.html)}\n`
