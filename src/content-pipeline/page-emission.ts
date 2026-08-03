import { renderArchivePage } from './archive-page'
import { renderArticlePage } from './article-page'
import { renderIntoShell } from './page-shell'
import type { Post } from './post-collection'
import type { SiteContext } from './site-context'

export interface EmittedPage {
  fileName: string
  source: string
}

export const ARCHIVE_FILE_NAME = 'writing/index.html'

export const postFileName = (slug: string): string => `writing/${slug}/index.html`

export const renderStandalonePages = (posts: Post[], shellHtml: string, site: SiteContext): EmittedPage[] => [
  { fileName: ARCHIVE_FILE_NAME, source: renderIntoShell(shellHtml, renderArchivePage(posts, site)) },
  ...posts.map((post) => ({
    fileName: postFileName(post.slug),
    source: renderIntoShell(shellHtml, renderArticlePage(post, site))
  }))
]
