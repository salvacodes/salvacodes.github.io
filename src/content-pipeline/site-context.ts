export interface SiteContext {
  origin: string
  articleStylesheetHref: string
}

export const SITE_NAME = 'salva.codes'
export const SITE_AUTHOR = 'Salva'
export const ARCHIVE_PATH = '/writing/'
export const FEED_PATH = '/feed.xml'

export const postPath = (slug: string): string => `${ARCHIVE_PATH}${slug}/`
