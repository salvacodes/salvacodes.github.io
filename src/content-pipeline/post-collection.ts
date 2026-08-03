import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parseFrontmatter } from './frontmatter'
import { assertAllowedHtml } from './html-allowlist'
import { renderMarkdown } from './markdown-renderer'

export interface Post {
  slug: string
  title: string
  date: string
  summary: string
  tags: string[]
  readingMinutes: number
  isDraft: boolean
  html: string
}

export const POST_FILE_NAME = 'index.md'

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const WORDS_PER_MINUTE = 200
const IMAGE_SOURCE = /<img src="\/writing\/[a-z0-9-]+\/([^"]+)"/g

const countWords = (body: string): number => body.split(/\s+/).filter(Boolean).length

export const buildPost = (source: string, slug: string): Post => {
  if (!SLUG.test(slug)) {
    throw new Error(`"${slug}" is not a usable post slug: use lowercase words separated by hyphens`)
  }
  const sourceName = `${slug}/${POST_FILE_NAME}`
  const { frontmatter, body } = parseFrontmatter(source, sourceName)
  const html = renderMarkdown(body, { slug, sourceName })
  assertAllowedHtml(html, sourceName)
  return {
    slug,
    title: frontmatter.title,
    date: frontmatter.date,
    summary: frontmatter.summary,
    tags: frontmatter.tags,
    readingMinutes: Math.max(1, Math.ceil(countWords(body) / WORDS_PER_MINUTE)),
    isDraft: frontmatter.isDraft,
    html
  }
}

const assertImagesExist = (post: Post, directory: string): void => {
  for (const [, source = ''] of post.html.matchAll(IMAGE_SOURCE)) {
    if (!existsSync(join(directory, source))) {
      throw new Error(`${post.slug}/${POST_FILE_NAME}: image "${source}" is missing from the post folder`)
    }
  }
}

const readPost = (contentDirectory: string, slug: string): Post => {
  const directory = join(contentDirectory, slug)
  const file = join(directory, POST_FILE_NAME)
  if (!existsSync(file)) {
    throw new Error(`${slug}/${POST_FILE_NAME}: every post folder must hold a post file`)
  }
  const post = buildPost(readFileSync(file, 'utf8'), slug)
  assertImagesExist(post, directory)
  return post
}

const byNewestThenSlug = (left: Post, right: Post): number =>
  right.date.localeCompare(left.date) || left.slug.localeCompare(right.slug)

export const collectPosts = (contentDirectory: string, options: { includeDrafts: boolean }): Post[] => {
  if (!existsSync(contentDirectory)) {
    return []
  }
  return readdirSync(contentDirectory)
    .filter((entry) => statSync(join(contentDirectory, entry)).isDirectory())
    .map((slug) => readPost(contentDirectory, slug))
    .filter((post) => options.includeDrafts || !post.isDraft)
    .sort(byNewestThenSlug)
}
