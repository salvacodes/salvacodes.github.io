import hljs from 'highlight.js'
import { escapeHtml } from './html-escaping'

export const highlightCode = (code: string, language: string | undefined): string => {
  if (!language || !hljs.getLanguage(language)) {
    return escapeHtml(code)
  }
  return hljs.highlight(code, { language, ignoreIllegals: true }).value
}
