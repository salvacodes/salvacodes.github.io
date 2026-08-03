import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relativePath: string): string =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')

export const articleStylesheet = (): string =>
  [read('../apps/writings/post-body.css'), read('./article.css')].join('\n')
