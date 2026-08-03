import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, posix, resolve } from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'
import { articleStylesheet } from './article-stylesheet'
import { renderAtomFeed } from './atom-feed'
import { ARCHIVE_FILE_NAME, postFileName, renderStandalonePages } from './page-emission'
import { collectPosts, POST_FILE_NAME, type Post } from './post-collection'
import { ARCHIVE_PATH, FEED_PATH, type SiteContext } from './site-context'
import { renderIndexModule, renderPostModule, WRITING_INDEX_MODULE, WRITING_POST_PREFIX } from './virtual-modules'

export interface WritingsOptions {
  contentDirectory?: string
  origin?: string
}

const DEFAULT_CONTENT_DIRECTORY = 'content/writing'
const DEFAULT_ORIGIN = 'https://salva.codes'
const DEV_STYLESHEET_PATH = '/@writings/article.css'
const RESOLVED_PREFIX = '\0'
const SHELL_FILE_NAME = 'index.html'

interface PostAsset {
  relativePath: string
  absolutePath: string
}

const collectAssets = (directory: string, prefix = ''): PostAsset[] => {
  if (!existsSync(directory)) {
    return []
  }
  return readdirSync(directory).flatMap((entry) => {
    const absolutePath = join(directory, entry)
    const relativePath = prefix ? posix.join(prefix, entry) : entry
    if (statSync(absolutePath).isDirectory()) {
      return collectAssets(absolutePath, relativePath)
    }
    return entry === POST_FILE_NAME && prefix === '' ? [] : [{ relativePath, absolutePath }]
  })
}

const contentTypes: Record<string, string> = {
  html: 'text/html',
  css: 'text/css',
  xml: 'application/atom+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  avif: 'image/avif'
}

const contentTypeOf = (path: string): string =>
  contentTypes[path.split('.').pop()?.toLowerCase() ?? ''] ?? 'application/octet-stream'

export const writings = (options: WritingsOptions = {}): Plugin => {
  const origin = options.origin ?? DEFAULT_ORIGIN
  let contentDirectory = resolve(options.contentDirectory ?? DEFAULT_CONTENT_DIRECTORY)
  let projectRoot = process.cwd()
  let outputDirectory = resolve('dist')
  let includeDrafts = false
  let shouldWrite = true
  let cachedPosts: Post[] | undefined
  let shellHtml: string | undefined
  let stylesheetHref: string | undefined

  const writeOutput = (fileName: string, source: string | Buffer): void => {
    const destination = join(outputDirectory, fileName)
    mkdirSync(dirname(destination), { recursive: true })
    writeFileSync(destination, source)
  }

  const posts = (): Post[] => {
    cachedPosts ??= collectPosts(contentDirectory, { includeDrafts })
    return cachedPosts
  }

  const postDirectory = (slug: string): string => join(contentDirectory, slug)

  const devSite: SiteContext = { origin, articleStylesheetHref: DEV_STYLESHEET_PATH }

  const devPage = async (server: ViteDevServer, url: string): Promise<string | undefined> => {
    const shell = readFileSync(join(projectRoot, SHELL_FILE_NAME), 'utf8')
    const transformed = await server.transformIndexHtml(url, shell)
    const wanted = url === ARCHIVE_PATH ? ARCHIVE_FILE_NAME : postFileName(url.slice(ARCHIVE_PATH.length, -1))
    return renderStandalonePages(posts(), transformed, devSite).find((page) => page.fileName === wanted)?.source
  }

  const devAsset = (url: string): PostAsset | undefined => {
    const [slug = '', ...rest] = url.slice(ARCHIVE_PATH.length).split('/')
    const wanted = rest.join('/')
    return collectAssets(postDirectory(slug)).find((asset) => asset.relativePath === wanted)
  }

  return {
    name: 'salvacodes:writings',

    configResolved(config) {
      projectRoot = config.root
      outputDirectory = resolve(config.root, config.build.outDir)
      shouldWrite = config.build.write !== false
      includeDrafts = config.command === 'serve'
      contentDirectory = resolve(config.root, options.contentDirectory ?? DEFAULT_CONTENT_DIRECTORY)
    },

    resolveId(id) {
      if (id === WRITING_INDEX_MODULE || id.startsWith(WRITING_POST_PREFIX)) {
        return `${RESOLVED_PREFIX}${id}`
      }
      return undefined
    },

    load(id) {
      if (id === `${RESOLVED_PREFIX}${WRITING_INDEX_MODULE}`) {
        return renderIndexModule(posts())
      }
      if (!id.startsWith(`${RESOLVED_PREFIX}${WRITING_POST_PREFIX}`)) {
        return undefined
      }
      const slug = id.slice(`${RESOLVED_PREFIX}${WRITING_POST_PREFIX}`.length)
      const post = posts().find((candidate) => candidate.slug === slug)
      if (!post) {
        throw new Error(`no post is written at ${slug}/${POST_FILE_NAME}`)
      }
      return renderPostModule(post)
    },

    configureServer(server) {
      server.watcher.add(contentDirectory)
      const reload = (path: string): void => {
        if (!path.startsWith(contentDirectory)) {
          return
        }
        cachedPosts = undefined
        for (const id of [WRITING_INDEX_MODULE, ...posts().map((post) => `${WRITING_POST_PREFIX}${post.slug}`)]) {
          const virtualModule = server.moduleGraph.getModuleById(`${RESOLVED_PREFIX}${id}`)
          if (virtualModule) {
            server.moduleGraph.invalidateModule(virtualModule)
          }
        }
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', reload)
      server.watcher.on('change', reload)
      server.watcher.on('unlink', reload)

      server.middlewares.use((request, response, next) => {
        const url = request.url?.split('?')[0] ?? '/'
        if (url === DEV_STYLESHEET_PATH) {
          response.setHeader('Content-Type', 'text/css')
          response.end(articleStylesheet())
          return
        }
        if (url === FEED_PATH) {
          response.setHeader('Content-Type', contentTypeOf(url))
          response.end(renderAtomFeed(posts(), origin))
          return
        }
        if (!url.startsWith(ARCHIVE_PATH)) {
          next()
          return
        }
        if (url.endsWith('/')) {
          devPage(server, url)
            .then((page) => {
              if (!page) {
                next()
                return
              }
              response.setHeader('Content-Type', 'text/html')
              response.end(page)
            })
            .catch(next)
          return
        }
        const asset = devAsset(url)
        if (!asset) {
          next()
          return
        }
        response.setHeader('Content-Type', contentTypeOf(asset.relativePath))
        response.end(readFileSync(asset.absolutePath))
      })
    },

    generateBundle() {
      const reference = this.emitFile({ type: 'asset', name: 'article.css', source: articleStylesheet() })
      stylesheetHref = `/${this.getFileName(reference)}`
    },

    transformIndexHtml: {
      order: 'post',
      handler(html) {
        shellHtml = html
        return undefined
      }
    },

    closeBundle() {
      if (!shouldWrite) {
        return
      }
      if (shellHtml === undefined || stylesheetHref === undefined) {
        throw new Error('the page shell was never built, so standalone pages cannot be written')
      }
      const site: SiteContext = { origin, articleStylesheetHref: stylesheetHref }
      for (const page of renderStandalonePages(posts(), shellHtml, site)) {
        writeOutput(page.fileName, page.source)
      }
      for (const post of posts()) {
        for (const asset of collectAssets(postDirectory(post.slug))) {
          writeOutput(`writing/${post.slug}/${asset.relativePath}`, readFileSync(asset.absolutePath))
        }
      }
      writeOutput('feed.xml', renderAtomFeed(posts(), origin))
    }
  }
}
