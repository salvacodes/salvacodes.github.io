import { describe, expect, it } from 'vitest'
import { archivePath, isWritingPath, pathForPost, routeFromPath, WRITINGS_APP_ID } from './post-route'

describe('routeFromPath', () => {
  it('reads the desktop root as no route', () => {
    expect(routeFromPath('/')).toBeUndefined()
  })

  it('opens the archive', () => {
    expect(routeFromPath('/writing/')).toEqual({ appId: WRITINGS_APP_ID, params: {} })
  })

  it('opens a post', () => {
    expect(routeFromPath('/writing/how-this-site-is-built/')).toEqual({
      appId: WRITINGS_APP_ID,
      params: { 'post-slug': 'how-this-site-is-built' }
    })
  })

  it('forgives a missing trailing slash', () => {
    expect(routeFromPath('/writing/a-post')).toEqual({ appId: WRITINGS_APP_ID, params: { 'post-slug': 'a-post' } })
  })

  it.each(['/writing/a-post/extra/', '/writing/A-Post/', '/writing/a_post/', '/resume/', '/writingx/'])(
    'reads %s as no route',
    (pathname) => {
      expect(routeFromPath(pathname)).toBeUndefined()
    }
  )
})

describe('pathForPost', () => {
  it('addresses a post', () => {
    expect(pathForPost('a-post')).toBe('/writing/a-post/')
  })

  it('addresses the archive when no post is selected', () => {
    expect(pathForPost(undefined)).toBe(archivePath)
  })
})

describe('isWritingPath', () => {
  it.each(['/writing/', '/writing/a-post/'])('recognises %s', (pathname) => {
    expect(isWritingPath(pathname)).toBe(true)
  })

  it.each(['/', '/resume/'])('does not recognise %s', (pathname) => {
    expect(isWritingPath(pathname)).toBe(false)
  })
})
