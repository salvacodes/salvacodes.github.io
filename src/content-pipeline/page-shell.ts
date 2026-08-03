export interface PageContent {
  title: string
  headMarkup: string
  bodyMarkup: string
}

const SHELL_TITLE = /<title>[^<]*<\/title>/
const HEAD_END = '</head>'
const BODY_END = '</body>'

const requireMarker = (marker: string, found: boolean): void => {
  if (!found) {
    throw new Error(`page shell has no ${marker}, so standalone pages cannot be built`)
  }
}

export const renderIntoShell = (shellHtml: string, content: PageContent): string => {
  requireMarker('<title>', SHELL_TITLE.test(shellHtml))
  requireMarker(HEAD_END, shellHtml.includes(HEAD_END))
  requireMarker(BODY_END, shellHtml.includes(BODY_END))
  return shellHtml
    .replace(SHELL_TITLE, `<title>${content.title}</title>`)
    .replace(HEAD_END, `${content.headMarkup}\n  ${HEAD_END}`)
    .replace(BODY_END, `${content.bodyMarkup}${BODY_END}`)
}
