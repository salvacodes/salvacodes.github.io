import { describe, expect, it } from 'vitest'
import { renderIntoShell } from './page-shell'

const shell = [
  '<!doctype html>',
  '<html lang="en">',
  '  <head>',
  '    <meta http-equiv="Content-Security-Policy" content="default-src \'none\'">',
  '    <title>salva.codes</title>',
  '    <script type="module" src="/assets/index.js"></script>',
  '  </head>',
  '  <body></body>',
  '</html>'
].join('\n')

const content = {
  title: 'A post — salva.codes',
  headMarkup: '<link rel="canonical" href="/x">',
  bodyMarkup: '<main>Hi</main>'
}

describe('renderIntoShell', () => {
  it('replaces the shell title', () => {
    const page = renderIntoShell(shell, content)

    expect(page).toContain('<title>A post — salva.codes</title>')
    expect(page).not.toContain('<title>salva.codes</title>')
  })

  it('adds the page head markup before the head closes', () => {
    expect(renderIntoShell(shell, content)).toMatch(/<link rel="canonical" href="\/x">\s*<\/head>/)
  })

  it('adds the page body markup before the body closes', () => {
    expect(renderIntoShell(shell, content)).toContain('<body><main>Hi</main></body>')
  })

  it('keeps the script and policy the shell already carries', () => {
    const page = renderIntoShell(shell, content)

    expect(page).toContain('Content-Security-Policy')
    expect(page).toContain('/assets/index.js')
  })

  it.each([
    ['<title>', shell.replace('<title>salva.codes</title>', '')],
    ['</head>', shell.replace('</head>', '')],
    ['</body>', shell.replace('<body></body>', '')]
  ])('refuses to build a page when the shell has no %s', (_marker, broken) => {
    expect(() => renderIntoShell(broken, content)).toThrow(/shell/i)
  })
})
