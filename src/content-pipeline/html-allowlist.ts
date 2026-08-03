const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  p: [],
  h2: [],
  h3: [],
  h4: [],
  ul: [],
  ol: [],
  li: [],
  blockquote: [],
  pre: [],
  code: ['class'],
  span: ['class'],
  em: [],
  strong: [],
  del: [],
  hr: [],
  br: [],
  table: [],
  thead: [],
  tbody: [],
  tr: [],
  th: ['align'],
  td: ['align'],
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'loading']
}

const TAG = /<\/?([A-Za-z][A-Za-z0-9-]*)([^>]*)>/g
const ATTRIBUTE = /([A-Za-z-]+)(?:\s*=\s*"([^"]*)")?/g
const POST_ASSET = /^\/writing\/[a-z0-9-]+\//
const SAFE_LINK = /^(https?:\/\/|[/#])/

const reject = (sourceName: string, detail: string): Error =>
  new Error(`${sourceName}: rendered HTML is not allowed — ${detail}`)

const assertAllowedValue = (tag: string, name: string, value: string, sourceName: string): void => {
  if (tag === 'img' && name === 'src' && !POST_ASSET.test(value)) {
    throw reject(sourceName, `src "${value}" does not point at a post asset`)
  }
  if (tag === 'a' && name === 'href' && !SAFE_LINK.test(value)) {
    throw reject(sourceName, `href "${value}" is not a site path or an http address`)
  }
}

const assertAllowedAttributes = (tag: string, declaration: string, allowed: string[], sourceName: string): void => {
  for (const [, name = '', value = ''] of declaration.matchAll(ATTRIBUTE)) {
    if (!allowed.includes(name)) {
      throw reject(sourceName, `attribute "${name}" on <${tag}>`)
    }
    assertAllowedValue(tag, name, value, sourceName)
  }
}

export const assertAllowedHtml = (html: string, sourceName: string): void => {
  const withoutTags = html.replace(TAG, (_match, rawTag: string, declaration: string) => {
    const tag = rawTag.toLowerCase()
    const allowed = ALLOWED_ATTRIBUTES[tag]
    if (!allowed) {
      throw reject(sourceName, `tag <${tag}>`)
    }
    assertAllowedAttributes(tag, declaration, allowed, sourceName)
    return ''
  })
  if (withoutTags.includes('<')) {
    throw reject(sourceName, 'an unescaped "<" remains in the text')
  }
}
