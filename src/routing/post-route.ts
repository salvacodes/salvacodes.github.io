export const WRITINGS_APP_ID = 'writings'
export const POST_SLUG_PARAM = 'post-slug'
export const archivePath = '/writing/'
export const desktopPath = '/'

export interface Route {
  appId: string
  params: Record<string, string>
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const isWritingPath = (pathname: string): boolean => pathname.startsWith(archivePath)

export const pathForPost = (slug: string | undefined): string => (slug ? `${archivePath}${slug}/` : archivePath)

export const routeFromPath = (pathname: string): Route | undefined => {
  if (!isWritingPath(pathname)) {
    return undefined
  }
  const segments = pathname.slice(archivePath.length).split('/').filter(Boolean)
  if (segments.length === 0) {
    return { appId: WRITINGS_APP_ID, params: {} }
  }
  const [slug = ''] = segments
  if (segments.length > 1 || !SLUG.test(slug)) {
    return undefined
  }
  return { appId: WRITINGS_APP_ID, params: { [POST_SLUG_PARAM]: slug } }
}
